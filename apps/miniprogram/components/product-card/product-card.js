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
    buttonData: {}
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
      const { product } = this.data
      if (!product || !product.id) return

      const favorites = storage.get('favorites') || []
      const isFavorited = Array.isArray(favorites) && favorites.some(item => item && item.id === product.id)
      this.setData({ isFavorited })
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
      
      // 设置按钮埋点数据
      const buttonData = {
        sku_id: product.id,
        product_name: product.name,
        from_page: cardType === 'grid' ? 'product_grid' : 'product_list',
        price_mode: priceInfo.mode || 'ask'
      }
      
      this.setData({ 
        priceInfo,
        safeProduct: safeProductData,
        buttonData
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
    onFavoriteTap() {
      const { product, isFavorited } = this.data
      if (!product.id) return

      let favorites = storage.get('favorites', [])
      
      if (isFavorited) {
        // 取消收藏
        favorites = favorites.filter(item => item.id !== product.id)
        wx.showToast({
          title: '已取消收藏',
          icon: 'none',
          duration: 1500
        })
      } else {
        // 添加收藏
        favorites.push(product)
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
        product, 
        isFavorited: !isFavorited 
      })
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
     * 预览图片
     */
    onImageTap() {
      const { product } = this.data
      if (product.images && product.images.length > 0) {
        wx.previewImage({
          urls: product.images,
          current: product.images[0]
        })
      }
    }
  }
})
