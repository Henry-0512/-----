// components/product-card/product-card.js
const { storage } = require('../../utils/request.js')
const { formatPriceDisplay, isFeatureEnabled, getCustomerServiceConfig } = require('../../config/feature-flags.js')
const { safeProduct } = require('../../utils/safe-text.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 商品数据
    product: {
      type: Object,
      value: {}
    },
    // 卡片样式类型: 'grid' | 'list'
    cardType: {
      type: String,
      value: 'grid'
    },
    // 是否显示收藏按钮
    showFavorite: {
      type: Boolean,
      value: true
    },
    // 是否显示对比按钮
    showCompare: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isFavorited: false,
    isCompared: false,
    priceInfo: {
      mode: 'show',
      display: '',
      originalPrice: '',
      showButton: false,
      buttonText: ''
    },
    safeProduct: null,
    buttonData: {},
    priceText: '', // 精简价格显示文本
    conditionLabels: ['九成新', '全新', '九五新', '八成新'], // 成色标签
    conditionLabel: '', // 当前显示的成色
    productDesc: '', // 商品描述
    priceNumber: '' // 价格数字
  },

  /**
   * 组件生命周期函数
   */
  lifetimes: {
    attached() {
      this.checkFavoriteStatus()
      this.checkCompareStatus()
      this.updatePriceDisplay()
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'product.id': function(productId) {
      if (productId) {
        this.checkFavoriteStatus()
        this.checkCompareStatus()
        this.updatePriceDisplay()
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 检查收藏状态
     */
    checkFavoriteStatus() {
      const { safeProduct } = this.data
      if (!safeProduct || !safeProduct.id) return

      try {
        const favorites = storage.get('favorites') || []
        const isFavorited = Array.isArray(favorites) && favorites.some(item => item && item.id === safeProduct.id)
        this.setData({ isFavorited })
      } catch (error) {
        console.error('检查收藏状态失败:', error)
        this.setData({ isFavorited: false })
      }
    },

    /**
     * 检查对比状态
     */
    checkCompareStatus() {
      const { product } = this.data
      if (!product || !product.id) return

      const compareList = storage.get('compareList') || []
      const isCompared = Array.isArray(compareList) && compareList.some(item => item && item.id === product.id)
      this.setData({ isCompared })
    },

    /**
     * 更新价格显示
     */
    updatePriceDisplay() {
      const { product, cardType } = this.data
      if (!product) return

      // 应用敏感词过滤
      const safeProductData = safeProduct(product)
      const priceInfo = formatPriceDisplay(safeProductData)
      
      // 生成精简价格文本
      let priceText = ''
      switch (priceInfo.mode) {
        case 'show':
          priceText = `¥${product.price || 0}`
          break
        case 'from':
          priceText = `From ¥${product.price || 0}/月`
          break
        case 'range':
          if (product.price_min && product.price_max && product.price_min !== product.price_max) {
            priceText = `¥${product.price_min}–¥${product.price_max}`
          } else {
            priceText = `¥${product.price || 0}`
          }
          break
        case 'ask':
        default:
          priceText = '' // ask模式下隐藏价格chip
          break
      }
      
      // 设置按钮埋点数据
      const buttonData = {
        sku_id: product.id,
        product_name: product.name,
        from_page: cardType === 'grid' ? 'product_grid' : 'product_list',
        price_mode: priceInfo.mode || 'ask'
      }
      
      // 生成成色标签
      const conditionLabel = safeProductData.condition 
        ? safeProductData.condition.label 
        : this.data.conditionLabels[Math.floor(Math.random() * this.data.conditionLabels.length)]
      
      // 生成商品描述
      const productDesc = this.generateProductDesc(safeProductData)
      
      // 生成价格数字
      const priceNumber = this.generatePriceNumber(safeProductData, priceInfo)
      
      this.setData({ 
        priceInfo,
        priceText,
        safeProduct: safeProductData,
        buttonData,
        conditionLabel,
        productDesc,
        priceNumber
      })
    },

    /**
     * 点击卡片事件
     */
    onCardTap() {
      const { product } = this.data
      this.triggerEvent('cardtap', { product })
    },

    /**
     * 切换收藏状态
     */
    onToggleFavorite() {
      const { safeProduct, isFavorited } = this.data
      if (!safeProduct || !safeProduct.id) return

      try {
        let favorites = storage.get('favorites') || []
        if (!Array.isArray(favorites)) {
          favorites = []
        }
        
        if (isFavorited) {
          // 取消收藏
          favorites = favorites.filter(item => item && item.id !== safeProduct.id)
          wx.showToast({
            title: '已取消收藏',
            icon: 'none',
            duration: 1500
          })
        } else {
          // 添加收藏
          favorites.push({
            ...safeProduct,
            favoriteAt: new Date().toISOString()
          })
          wx.showToast({
            title: '已添加收藏',
            icon: 'success',
            duration: 1500
          })
        }

        storage.set('favorites', favorites)
        this.setData({ isFavorited: !isFavorited })
        
        // 触发收藏状态变化事件
        this.triggerEvent('favoritechange', { 
          product: safeProduct, 
          isFavorited: !isFavorited,
          favoriteCount: favorites.length
        })
      } catch (error) {
        console.error('收藏操作失败:', error)
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
      }
    },

    /**
     * 切换对比状态
     */
    onCompareTap() {
      const { product, isCompared } = this.data
      if (!product.id) return

      let compareList = storage.get('compareList', [])
      
      if (isCompared) {
        // 移除对比
        compareList = compareList.filter(item => item.id !== product.id)
        wx.showToast({
          title: '已移除对比',
          icon: 'none',
          duration: 1500
        })
      } else {
        // 检查对比列表数量限制
        if (compareList.length >= 3) {
          wx.showToast({
            title: '最多只能对比3个商品',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        // 添加对比
        compareList.push(product)
        wx.showToast({
          title: '已添加对比',
          icon: 'success',
          duration: 1500
        })
      }

      storage.set('compareList', compareList)
      this.setData({ isCompared: !isCompared })
      
      // 触发对比状态变化事件
      this.triggerEvent('comparechange', { 
        product, 
        isCompared: !isCompared 
      })
    },

    /**
     * 价格咨询按钮点击 - 仅处理业务逻辑，埋点由AskPriceButton组件统一处理
     */
    onPriceInquiry() {
      const { product } = this.data
      const customerService = getCustomerServiceConfig()

      wx.showModal({
        title: '价格咨询',
        content: `商品：${product.title || product.name}\n\n请联系客服获取详细报价信息\n\n客服电话：${customerService.phone.number}\n工作时间：${customerService.phone.workTime}`,
        confirmText: '拨打电话',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm && customerService.phone.enabled) {
            wx.makePhoneCall({
              phoneNumber: customerService.phone.number,
              fail: (error) => {
                console.error('拨打电话失败:', error)
                wx.showToast({
                  title: '拨打失败，请稍后重试',
                  icon: 'none'
                })
              }
            })
          }
        }
      })
    },

    /**
     * 格式化价格显示
     */
    formatPrice(price) {
      return price ? `¥${price}` : '价格面议'
    },

    /**
     * 图片预览
     */
    onImagePreview() {
      const { safeProduct } = this.data
      if (!safeProduct) return
      
      let imageUrl = ''
      if (safeProduct.images && safeProduct.images[0]) {
        imageUrl = safeProduct.images[0].url || safeProduct.images[0]
      } else if (safeProduct.image) {
        imageUrl = safeProduct.image
      }
      
      if (imageUrl) {
        wx.previewImage({
          current: imageUrl,
          urls: [imageUrl]
        })
      }
    },

    /**
     * 预览图片 - 保持兼容
     */
    onImageTap() {
      this.onImagePreview()
    },

    /**
     * 获取成色标签
     */
    getConditionLabel() {
      const { conditionLabels } = this.data
      const randomIndex = Math.floor(Math.random() * conditionLabels.length)
      return conditionLabels[randomIndex]
    },

    /**
     * 生成商品描述
     */
    generateProductDesc(product) {
      if (!product) return ''
      
      // 组合描述信息
      const parts = []
      if (product.color && product.color[0]) {
        parts.push(product.color[0])
      }
      if (product.material && product.material[0]) {
        parts.push(product.material[0])
      }
      if (product.dimensions && product.dimensions.length) {
        parts.push(`${product.dimensions.length}m`)
      }
      
      return parts.join(', ') || '租赁家具'
    },

    /**
     * 生成价格数字
     */
    generatePriceNumber(product, priceInfo) {
      if (!product) return '0'
      
      switch (priceInfo.mode) {
        case 'show':
          return product.price || '0'
        case 'from':
          return product.price || '0'
        case 'range':
          if (product.price_min && product.price_max) {
            return `${product.price_min}–${product.price_max}`
          }
          return product.price || '0'
        default:
          return '0'
      }
    },

    /**
     * 添加到购物车
     */
    onAddToCart() {
      const { safeProduct } = this.data
      
      if (!safeProduct || !safeProduct.id) {
        wx.showToast({
          title: '商品信息错误',
          icon: 'none'
        })
        return
      }
      
      try {
        // 获取现有购物车数据
        const cartItems = storage.get('cartItems') || []
        const existingItemIndex = cartItems.findIndex(item => item.id === safeProduct.id)
        
        if (existingItemIndex >= 0) {
          // 商品已存在，增加数量
          cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1
        } else {
          // 新商品，添加到购物车
          cartItems.push({
            ...safeProduct,
            quantity: 1,
            selected: true,
            addedAt: new Date().toISOString()
          })
        }
        
        // 保存到本地存储
        storage.set('cartItems', cartItems)
        
        wx.showToast({
          title: '已添加到购物车',
          icon: 'success'
        })
        
        // 触发添加购物车事件
        this.triggerEvent('addtocart', {
          product: safeProduct,
          cartCount: cartItems.length
        })
      } catch (error) {
        console.error('添加购物车失败:', error)
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        })
      }
    }
  }
})
