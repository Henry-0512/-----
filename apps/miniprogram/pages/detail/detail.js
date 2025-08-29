// pages/detail/detail.js
const { USE_MOCK_DATA } = require('../../utils/config.js')

const { api, storage } = USE_MOCK_DATA 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    loading: true,
    sku: null,
    recommendations: [],
    selectedImage: 0,
    showSizeGuide: false,
    duration: 1,
    maxDuration: 12,
    minDuration: 1,
    error: null,
    isFavorited: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadSkuDetail(id)
      this.loadRecommendations(id)
      this.checkFavoriteStatus(id)
    } else {
      this.setData({
        error: '商品ID无效',
        loading: false
      })
    }
  },

  onShow() {
    // 每次显示时检查收藏状态
    const { sku } = this.data
    if (sku) {
      this.checkFavoriteStatus(sku.id)
    }
  },

  /**
   * 加载商品详情
   */
  async loadSkuDetail(id) {
    try {
      this.setData({ loading: true, error: null })
      
      const res = await api.getProductDetail(id)
      
      this.setData({
        sku: res.data,
        loading: false
      })
    } catch (error) {
      console.error('加载商品详情失败：', error)
      this.setData({
        error: '加载失败，请重试',
        loading: false
      })
    }
  },

  /**
   * 加载推荐商品
   */
  async loadRecommendations(id) {
    try {
      const res = await api.getRecommendations(id)
      this.setData({
        recommendations: res.data || []
      })
    } catch (error) {
      console.error('加载推荐商品失败：', error)
    }
  },

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus(id) {
    const favorites = storage.get('favorites', [])
    const isFavorited = favorites.some(item => item.id === id)
    this.setData({ isFavorited })
  },

  /**
   * 选择图片
   */
  onImageSelect(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ selectedImage: index })
  },

  /**
   * 预览图片
   */
  onImagePreview() {
    const { sku, selectedImage } = this.data
    if (sku && sku.images && sku.images.length > 0) {
      // 处理新的图片格式（对象数组）和旧格式（字符串数组）
      const imageUrls = sku.images.map(img => 
        typeof img === 'object' ? img.url : img
      )
      const currentUrl = typeof sku.images[selectedImage] === 'object' 
        ? sku.images[selectedImage].url 
        : sku.images[selectedImage]
      
      wx.previewImage({
        urls: imageUrls,
        current: currentUrl
      })
    }
  },

  /**
   * 显示尺寸示意图
   */
  onShowSizeGuide() {
    this.setData({ showSizeGuide: true })
  },

  /**
   * 隐藏尺寸示意图
   */
  onHideSizeGuide() {
    this.setData({ showSizeGuide: false })
  },

  /**
   * 调整租赁时长
   */
  onDurationChange(e) {
    const { type } = e.currentTarget.dataset
    let { duration, minDuration, maxDuration } = this.data
    
    if (type === 'minus' && duration > minDuration) {
      duration--
    } else if (type === 'plus' && duration < maxDuration) {
      duration++
    }
    
    this.setData({ duration })
  },

  /**
   * 时长输入变化
   */
  onDurationInput(e) {
    let duration = parseInt(e.detail.value) || this.data.minDuration
    const { minDuration, maxDuration } = this.data
    
    duration = Math.max(minDuration, Math.min(maxDuration, duration))
    this.setData({ duration })
  },

  /**
   * 切换收藏状态
   */
  onToggleFavorite() {
    const { sku, isFavorited } = this.data
    if (!sku) return

    let favorites = storage.get('favorites', [])
    
    if (isFavorited) {
      // 取消收藏
      favorites = favorites.filter(item => item.id !== sku.id)
      wx.showToast({
        title: '已取消收藏',
        icon: 'none',
        duration: 1500
      })
    } else {
      // 添加收藏
      favorites.push(sku)
      wx.showToast({
        title: '已添加收藏',
        icon: 'success',
        duration: 1500
      })
    }

    storage.set('favorites', favorites)
    this.setData({ isFavorited: !isFavorited })
  },

  /**
   * 添加到对比
   */
  onAddToCompare() {
    const compareList = storage.get('compareList', [])
    const { sku } = this.data
    
    // 检查是否已在对比列表中
    const exists = compareList.some(item => item.id === sku.id)
    if (exists) {
      wx.showToast({ title: '已在对比列表中', icon: 'none' })
      return
    }
    
    // 检查对比列表是否已满（最多4件）
    if (compareList.length >= 4) {
      wx.showModal({
        title: '提示',
        content: '对比列表最多只能添加4件商品，是否替换第一件？',
        success: (res) => {
          if (res.confirm) {
            const newCompareList = compareList.slice(1)
            newCompareList.push({
              id: sku.id,
              title: sku.title || sku.name,
              monthlyPrice: sku.monthlyPrice || Math.ceil(sku.price/50),
              price: sku.price,
              images: sku.images,
              brand: sku.brand,
              style: sku.style,
              material: sku.material,
              color: sku.color,
              width_mm: sku.width_mm,
              depth_mm: sku.depth_mm,
              height_mm: sku.height_mm,
              addedAt: new Date().toISOString()
            })
            storage.set('compareList', newCompareList)
            wx.showToast({ title: '已添加到对比', icon: 'success' })
          }
        }
      })
      return
    }
    
    // 添加到对比列表
    const newCompareList = [...compareList, {
      id: sku.id,
      title: sku.title || sku.name,
      monthlyPrice: sku.monthlyPrice || Math.ceil(sku.price/50),
      price: sku.price,
      images: sku.images,
      brand: sku.brand,
      style: sku.style,
      material: sku.material,
      color: sku.color,
      width_mm: sku.width_mm,
      depth_mm: sku.depth_mm,
      height_mm: sku.height_mm,
      addedAt: new Date().toISOString()
    }]
    
    storage.set('compareList', newCompareList)
    wx.showToast({ title: '已添加到对比', icon: 'success' })
  },

  /**
   * 添加到购物车
   */
  onAddToCart() {
    const cart = storage.get('cart', [])
    const { sku, duration } = this.data
    
    // 检查购物车中是否已有此商品
    const existingIndex = cart.findIndex(item => item.skuId === sku.id)
    
    if (existingIndex > -1) {
      // 更新数量
      cart[existingIndex].quantity += 1
      cart[existingIndex].duration = duration
      wx.showToast({ title: '已更新购物车', icon: 'success' })
    } else {
      // 添加新商品
      cart.push({
        skuId: sku.id,
        title: sku.title || sku.name,
        monthlyPrice: sku.monthlyPrice || Math.ceil(sku.price/50),
        price: sku.price,
        images: sku.images,
        brand: sku.brand,
        quantity: 1,
        duration: duration,
        addedAt: new Date().toISOString()
      })
      wx.showToast({ title: '已添加到购物车', icon: 'success' })
    }
    
    storage.set('cart', cart)
  },

  /**
   * 创建意向订单
   */
  async onCreateOrder() {
    const { sku, duration } = this.data
    if (!sku) return
    
    if (!sku.available) {
      wx.showToast({
        title: '商品暂时缺货',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7) // 一周后开始
      
      const res = await api.createIntentOrder({
        skuId: sku.id,
        duration,
        startDate: startDate.toISOString().split('T')[0]
      })
      
      if (res.success) {
        // 保存订单到本地存储
        let orders = storage.get('orders', [])
        orders.unshift(res.data)
        storage.set('orders', orders)
        
        wx.showModal({
          title: '订单创建成功',
          content: `订单号：${res.data.orderId}\n总金额：¥${res.data.totalAmount}`,
          showCancel: false,
          confirmText: '查看订单',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.switchTab({
                url: '/pages/profile/profile'
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('创建意向订单失败：', error)
      wx.showToast({
        title: '订单创建失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 推荐商品卡片点击
   */
  onRecommendationTap(e) {
    const { product } = e.detail
    wx.redirectTo({
      url: `/pages/detail/detail?id=${product.id}`
    })
  },

  /**
   * 重试加载
   */
  onRetry() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const { id } = currentPage.options
    
    if (id) {
      this.loadSkuDetail(id)
      this.loadRecommendations(id)
    }
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { sku } = this.data
    return {
      title: sku ? sku.name : '家具租赁',
      path: `/pages/detail/detail?id=${sku ? sku.id : ''}`,
      imageUrl: sku && sku.images ? sku.images[0] : ''
    }
  }
})