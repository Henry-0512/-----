// pages/detail/detail.js
const { isMockEnabled } = require('../../config/env.js')
const { api, storage, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { formatPriceDisplay, isFeatureEnabled, getCustomerServiceConfig } = require('../../config/feature-flags.js')
const { track, TrackEvents } = require('../../utils/track.js')

Page({
  data: {
    // 页面状态
    loading: true,
    error: null,
    isEmpty: false,
    
    // 数据状态
    sku: null,
    recommendations: [],
    recommendationsError: null,
    selectedImage: 0,
    showSizeGuide: false,
    duration: 1,
    maxDuration: 12,
    minDuration: 1,
    isFavorited: false,
    
    // 价格显示
    priceInfo: {
      mode: 'show',
      display: '',
      originalPrice: '',
      showButton: false,
      buttonText: ''
    },
    
    // 租期选择器
    durationUnit: 'month',  // 'week' | 'month'
    quantity: 1,
    selectedServices: [],
    
    // 配送信息
    selectedCity: '',
    selectedPostcode: '',
    availableCities: [],
    deliveryInfo: null,
    
    // 可选服务
    availableServices: [
      { id: 'delivery', name: '送货到门', price: 50, selected: false },
      { id: 'installation', name: '白手套安装', price: 150, selected: false },
      { id: 'upstairs', name: '上楼服务', price: 80, selected: false },
      { id: 'insurance', name: '租赁保险', price: 0, selected: false, note: '按租金2%计算' }
    ],
    
    // 报价信息
    quoteData: null,
    quoteLoading: false,
    quoteError: null
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      // 追踪PDP访问
      track(TrackEvents.PDP_VIEW, {
        skuId: id,
        source: options.source || 'direct',
        referrer: options.referrer || ''
      })
      
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
      this.setData({ 
        loading: true, 
        error: null,
        isEmpty: false 
      })
      
      const res = await api.getProductDetail(id)
      const sku = res.data || res
      
      if (!sku || !sku.id) {
        throw new Error('商品不存在')
      }
      
      // 格式化价格信息
      const priceInfo = formatPriceDisplay(sku)
      
      this.setData({
        sku,
        priceInfo,
        availableCities: sku.deliverable_cities || [],
        loading: false
      })
      
      // 加载初始报价
      this.calculateQuote()
    } catch (error) {
      console.error('加载商品详情失败：', error)
      
      this.setData({
        loading: false,
        error: {
          type: error.type || ERROR_TYPES.NETWORK,
          message: error.message || '加载商品详情失败',
          canRetry: error.canRetry !== false,
          onRetry: error.onRetry || (() => this.loadSkuDetail(id))
        }
      })
    }
  },

  /**
   * 加载推荐商品
   */
  async loadRecommendations(id) {
    try {
      this.setData({ recommendationsError: null })
      
      const res = await api.getRecommendations(id)
      const recommendations = res.data?.items || res.data || []
      
      this.setData({
        recommendations
      })
    } catch (error) {
      console.error('加载推荐商品失败：', error)
      
      this.setData({
        recommendationsError: {
          type: error.type || ERROR_TYPES.NETWORK,
          message: error.message || '加载推荐失败',
          canRetry: error.canRetry !== false,
          onRetry: error.onRetry || (() => this.loadRecommendations(id))
        }
      })
    }
  },

  /**
   * 重试加载商品详情
   */
  onRetryDetail() {
    const { error } = this.data
    if (error && error.onRetry) {
      error.onRetry()
    } else {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const { id } = currentPage.options
      if (id) {
        this.loadSkuDetail(id)
      }
    }
  },

  /**
   * 重试加载推荐商品
   */
  onRetryRecommendations() {
    const { recommendationsError } = this.data
    if (recommendationsError && recommendationsError.onRetry) {
      recommendationsError.onRetry()
    } else {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const { id } = currentPage.options
      if (id) {
        this.loadRecommendations(id)
      }
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
    const { sku, duration, durationUnit, quantity, selectedServices, quoteData, selectedCity } = this.data
    if (!sku) return
    
    try {
      // 确保用户已登录
      const app = getApp()
      const openid = await app.ensureUserLogin()
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 7) // 一周后开始
      
      const orderData = {
        skuId: sku.id,
        duration,
        durationUnit,
        quantity,
        services: selectedServices,
        startDate: startDate.toISOString().split('T')[0],
        openid,
        quoteData,
        userInfo: {
          source: 'create_order',
          city: selectedCity,
          timestamp: new Date().toISOString()
        }
      }
      
      const res = await api.submitIntentOrder(orderData)
      
      if (res.success) {
        // 追踪订单提交成功
        track(TrackEvents.INTENT_SUBMIT_SUCCESS, {
          orderId: res.data.orderId,
          skuId: sku.id,
          duration,
          durationUnit,
          quantity,
          services: selectedServices,
          city: selectedCity,
          hasQuoteData: Boolean(quoteData)
        })
        
        // 保存订单到本地存储
        let orders = storage.get('orders') || []
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
      
      // 追踪订单提交失败
      track(TrackEvents.INTENT_SUBMIT_FAILED, {
        skuId: sku.id,
        duration,
        durationUnit,
        quantity,
        services: selectedServices,
        city: selectedCity,
        error: error.message || 'unknown_error',
        errorType: error.type || 'api_error'
      })
      
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
   * 计算报价
   */
  async calculateQuote() {
    const { sku, duration, durationUnit, quantity, selectedServices, selectedCity, selectedPostcode } = this.data
    if (!sku || !sku.id) return

    try {
      this.setData({ quoteLoading: true, quoteError: null })

      // 追踪报价计算
      track(TrackEvents.QUOTE_SUBMIT, {
        skuId: sku.id,
        duration,
        durationUnit,
        quantity,
        services: selectedServices,
        city: selectedCity,
        hasCity: Boolean(selectedCity),
        serviceCount: selectedServices.length
      })

      const res = await api.getQuote({
        skuId: sku.id,
        duration,
        durationUnit,
        quantity,
        services: selectedServices,
        city: selectedCity,
        postcode: selectedPostcode
      })

      this.setData({
        quoteData: res.data,
        deliveryInfo: res.data?.delivery,
        quoteLoading: false
      })
    } catch (error) {
      console.error('计算报价失败:', error)
      
      // 处理配送不可达的情况
      if (error.error_type === 'delivery_unavailable') {
        this.setData({
          quoteLoading: false,
          quoteError: null,
          deliveryGuide: error.data?.deliveryGuide
        })
        this.showDeliveryGuide(error.data?.deliveryGuide)
      } else {
        this.setData({
          quoteLoading: false,
          quoteError: error.message || '报价计算失败'
        })
      }
    }
  },

  /**
   * 租期单位切换
   */
  onDurationUnitChange(e) {
    const { value } = e.detail
    const durationUnit = value === 0 ? 'week' : 'month'
    
    this.setData({ 
      durationUnit,
      duration: 1  // 重置租期
    })
    this.calculateQuote()
  },

  /**
   * 租期时长变化
   */
  onDurationChange(e) {
    const { value } = e.detail
    this.setData({ duration: parseInt(value) })
    this.calculateQuote()
  },

  /**
   * 数量变化
   */
  onQuantityChange(e) {
    const { value } = e.detail
    this.setData({ quantity: Math.max(1, parseInt(value) || 1) })
    this.calculateQuote()
  },

  /**
   * 数量减少
   */
  onQuantityDecrease() {
    const { quantity } = this.data
    if (quantity > 1) {
      this.setData({ quantity: quantity - 1 })
      this.calculateQuote()
    }
  },

  /**
   * 数量增加
   */
  onQuantityIncrease() {
    const { quantity } = this.data
    this.setData({ quantity: quantity + 1 })
    this.calculateQuote()
  },

  /**
   * 服务选择变化
   */
  onServiceChange(e) {
    const { serviceId } = e.currentTarget.dataset
    const { availableServices } = this.data
    
    const updatedServices = availableServices.map(service => {
      if (service.id === serviceId) {
        return { ...service, selected: !service.selected }
      }
      return service
    })
    
    const selectedServices = updatedServices
      .filter(service => service.selected)
      .map(service => service.id)
    
    this.setData({
      availableServices: updatedServices,
      selectedServices
    })
    this.calculateQuote()
  },

  /**
   * 城市选择
   */
  onCitySelect() {
    const { availableCities } = this.data
    
    // 分离可配送和不可配送的城市
    const deliverableCities = availableCities.filter(city => city.deliverable)
    const undeliverableCities = availableCities.filter(city => !city.deliverable)
    
    // 构建选项列表
    const itemList = [
      ...deliverableCities.map(city => city.city),
      ...undeliverableCities.map(city => `${city.city}（暂不支持）`)
    ]
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedIndex = res.tapIndex
        
        if (selectedIndex < deliverableCities.length) {
          // 选择了可配送城市
          const selectedCityInfo = deliverableCities[selectedIndex]
          this.setData({
            selectedCity: selectedCityInfo.city,
            selectedPostcode: selectedCityInfo.postcode[0] || ''
          })
          this.calculateQuote()
        } else {
          // 选择了不可配送城市
          const undeliverableCity = undeliverableCities[selectedIndex - deliverableCities.length]
          this.showDeliveryUnavailable(undeliverableCity.city)
        }
      }
    })
  },

  /**
   * 显示不可配送城市提示
   */
  showDeliveryUnavailable(cityName) {
    const { availableCities } = this.data
    const deliverableCities = availableCities.filter(city => city.deliverable)
    
    wx.showModal({
      title: '配送提醒',
      content: `目前仅支持 Durham 及周边，后续将逐步扩展\n\n当前可配送城市：${deliverableCities.map(c => c.city).join('、')}`,
      confirmText: '联系客服',
      cancelText: '查看可配送城市',
      success: (res) => {
        if (res.confirm) {
          this.onContactCustomerService()
        } else {
          this.showAvailableCities()
        }
      }
    })
  },

  /**
   * 显示配送引导
   */
  showDeliveryGuide(guide) {
    if (!guide) return

    wx.showModal({
      title: '配送提醒',
      content: guide.message,
      confirmText: '联系客服',
      cancelText: '查看可配送城市',
      success: (res) => {
        if (res.confirm) {
          this.onContactCustomerService()
        } else {
          this.showAvailableCities()
        }
      }
    })
  },

  /**
   * 联系客服
   */
  onContactCustomerService() {
    const customerService = getCustomerServiceConfig()
    
    wx.showModal({
      title: '联系客服',
      content: `了解配送扩展计划\n\n客服电话：${customerService.phone.number}\n工作时间：${customerService.phone.workTime}`,
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: customerService.phone.number,
            fail: (error) => {
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
   * 提交配送需求
   */
  onSubmitDeliveryRequest() {
    const { sku, selectedCity } = this.data
    
    wx.showModal({
      title: '提交配送需求',
      content: `商品：${sku.title}\n城市：${selectedCity}\n\n我们会评估配送可行性并尽快回复您`,
      confirmText: '提交',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '需求已提交',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 显示可配送城市
   */
  showAvailableCities() {
    const { availableCities } = this.data
    const cities = availableCities.map(city => city.city).join('、')
    
    wx.showModal({
      title: '可配送城市',
      content: `该商品支持配送到以下城市：\n\n${cities}`,
      confirmText: '知道了',
      showCancel: false
    })
  },

  /**
   * 价格咨询
   */
  onPriceInquiry() {
    const { sku } = this.data
    const customerService = getCustomerServiceConfig()

    wx.showModal({
      title: '价格咨询',
      content: `商品：${sku.title}\n品牌：${sku.brand}\n\n请联系客服获取详细报价信息\n\n客服电话：${customerService.phone.number}\n工作时间：${customerService.phone.workTime}`,
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