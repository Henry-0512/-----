// pages/detail/detail.js
const { isMockEnabled } = require('../../config/env.js')
const { api, storage, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { formatPriceDisplay, isFeatureEnabled, getCustomerServiceConfig, FEATURE_INTENT } = require('../../config/feature-flags.js')
const intent = require('../../utils/intent.js')
const { track, TrackEvents } = require('../../utils/track.js')
const pricing = require('../../utils/pricing.js')

Page({
  data: {
    // 页面状态
    loading: true,
    error: null,
    isEmpty: false,
    // 功能开关：意向单（首屏即注入，避免初次渲染不显示）
    FEATURE_INTENT: FEATURE_INTENT === true,
    
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
    
    // 按钮埋点数据
    detailButtonData: {},
    
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
      { id: 'delivery', name: '送货到门', price: 0, selected: false },
      { id: 'upstairs', name: '上楼加安装服务', price: 5, selected: false },
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

  // 价格盒子回调，保存用于提交意向单
  onPriceBoxChange(e){
    this.setData({ pricingOffer: e.detail })
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
      
      // 格式化价格显示（保留一位小数）
      const formattedPrice = (sku.rent_monthly_gbp || sku.monthlyPrice || 8).toFixed(1)
      
      // 设置按钮埋点数据
      const detailButtonData = {
        sku_id: sku.id,
        product_name: sku.name,
        from_page: 'detail',
        price_mode: priceInfo.mode || 'ask'
      }
      
      const fallbackCities = [
        { city: 'Durham', postcode: ['DH1','DH2'], deliverable: true, eta_days: [0,1] },
        { city: 'Newcastle', postcode: ['NE1','NE2'], deliverable: true, eta_days: [2,3] },
        { city: 'Sunderland', postcode: ['SR1','SR2'], deliverable: true, eta_days: [2,3] }
      ]

      this.setData({
        sku,
        priceInfo,
        detailButtonData,
        formattedPrice,
        availableCities: (sku.deliverable_cities && sku.deliverable_cities.length > 0) ? sku.deliverable_cities : fallbackCities,
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
    const favorites = storage.get('favorites') || []
    const isFavorited = Array.isArray(favorites) && favorites.some(item => item.id === id)
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
    // 支持两种触发：按钮（dataset.type）和输入框（e.detail.value）
    const { type } = e.currentTarget.dataset || {}
    let { duration, minDuration, maxDuration } = this.data

    if (type === 'minus') {
      duration = Math.max(minDuration, (parseInt(duration) || minDuration) - 1)
    } else if (type === 'plus') {
      duration = Math.min(maxDuration, (parseInt(duration) || minDuration) + 1)
    } else if (e && e.detail && e.detail.value != null) {
      const inputVal = parseInt(e.detail.value)
      duration = Number.isNaN(inputVal) ? minDuration : inputVal
      duration = Math.max(minDuration, Math.min(maxDuration, duration))
    }

    this.setData({ duration })
    this.calculateQuote()
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

    let favorites = storage.get('favorites') || []
    if (!Array.isArray(favorites)) favorites = []
    
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
  // 已移除对比功能

  /**
   * 添加到购物车
   */
  onAddToCart() {
    const { storage } = require('../../utils/request.js')
    let cartItems = storage.get('cartItems') || []
    const { sku } = this.data
    
    if (!sku) {
      console.error('商品信息不存在')
      return
    }
    
    // 检查购物车中是否已有此商品
    const existingIndex = cartItems.findIndex(item => item.id === sku.id)
    
    if (existingIndex >= 0) {
      // 更新数量
      cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1
      wx.showToast({ title: '数量已增加', icon: 'success' })
    } else {
      // 添加新商品
      const cartItem = {
        id: sku.id,
        title: sku.title || sku.name,
        cover: sku.cover || (sku.images && sku.images[0] ? (typeof sku.images[0] === 'object' ? sku.images[0].url : sku.images[0]) : ''),
        rent_monthly_gbp: sku.rent_monthly_gbp || sku.monthlyPrice || 8,
        purchase_price_gbp: sku.purchase_price_gbp || sku.price,
        brand: sku.brand || 'LivingLux',
        material: sku.material || '科技布',
        color: sku.color || '灰色',
        condition_grade: sku.condition_grade || sku.condition,
        quantity: 1,
        selected: true,
        addedAt: new Date().toISOString()
      }
      cartItems.push(cartItem)
      wx.showToast({ title: '已添加到购物车', icon: 'success' })
    }
    
    storage.set('cartItems', cartItems)
    console.log('购物车已更新:', sku.id, existingIndex >= 0 ? '数量增加' : '新添加')
  },

  /**
   * 加入意向单（仅当 FEATURE_INTENT=true 显示）
   */
  onAddToIntent() {
    if (!this.data.FEATURE_INTENT) return
    const { sku } = this.data
    if (!sku) return
    const cover = (sku.images && sku.images.length) ? (typeof sku.images[0] === 'object' ? sku.images[0].url : sku.images[0]) : ''
    intent.add({
      sku_id: sku.id,
      qty: 1,
      title: sku.title || sku.name || '',
      cover,
      rent_monthly_gbp: sku.rent_monthly_gbp || 0,
      condition_grade: sku.condition_grade || (sku.condition && sku.condition.grade) || 0
    })
    wx.showToast({ title: '已加入意向单', icon: 'success' })
  },

  /**
   * 立即提交意向：先加入当前商品，再跳转意向单列表
   */
  onSubmitIntent() {
    if (!this.data.FEATURE_INTENT) return
    const { sku } = this.data
    if (sku) {
      const cover = (sku.images && sku.images.length) ? (typeof sku.images[0] === 'object' ? sku.images[0].url : sku.images[0]) : ''
      intent.add({
        sku_id: sku.id,
        qty: 1,
        title: sku.title || sku.name || '',
        cover,
        rent_monthly_gbp: sku.rent_monthly_gbp || 0,
        condition_grade: sku.condition_grade || (sku.condition && sku.condition.grade) || 0
      })
    }
    wx.navigateTo({ url: '/pages/intent/list?quick=1' })
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
    wx.navigateTo({
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

      // 计算增值服务合计（保持现有选择逻辑）
      let addonTotal = 0
      if (Array.isArray(selectedServices) && selectedServices.length){
        // 2%保险来自老逻辑，这里保留
        const monthlyUnit = sku.rent_monthly_gbp || 8
        const unitPrice = durationUnit === 'week' ? Math.ceil(monthlyUnit / 4) : monthlyUnit
        const baseRent = unitPrice * duration * quantity
        const insuranceFee = selectedServices.includes('insurance') ? Math.round(baseRent * 0.02) : 0
        const upstairsFee = selectedServices.includes('upstairs') ? 5 : 0
        const deliveryFee = selectedServices.includes('delivery') ? 0 : 0
        addonTotal = (insuranceFee + upstairsFee + deliveryFee)
      }

      // 兜底推断 MSRP 或用已有月租
      const tier = sku.tier || 'mid'
      const msrp = typeof sku.purchase_price_gbp === 'number' ? sku.purchase_price_gbp
        : (typeof sku.msrp === 'number' ? sku.msrp : 0)
      const baseMonthly = typeof sku.rent_monthly_gbp === 'number' ? sku.rent_monthly_gbp : undefined

      const quote = pricing.computeOneOffQuote({
        msrp,
        baseMonthly,
        tier,
        termUnit: this.data.durationUnit,
        termCount: this.data.duration,
        qty: this.data.quantity,
        city: this.data.selectedCity,
        useWaiver: this.data.selectedServices.includes('insurance'),
        addonTotal
      })

      // 绑定到费用明细
      const q = quote.price
      const quoteData = {
        breakdown: {
          unitPriceLabel: this.data.durationUnit === 'week' ? '周租单价/件(折后)' : '月租单价/件(折后)',
          unitPrice: Number(q.monthlyPerItem.toFixed(1)),
          baseRentLabel: `租金小计（${this.data.termUnit==='week'?'周':'月'}×时长×数量）`,
          baseRent: Number((q.rentTotal + q.waiverAddon).toFixed(1)),
          services: [],
          discount: 0,
          discountReason: '已自动计算长租折扣',
          deposit: Number(q.depositTotal.toFixed(1)),
          depositReason: '押金（单件封顶，验收通过退）',
          totalRentLabel: '一次性总额',
          totalRent: Number(q.oneOffTotal.toFixed(1)),
          grandTotalLabel: '一次性付款',
          grandTotal: Number(q.oneOffTotal.toFixed(1))
        },
        calculation: {
          note: '一次性付款 = 押金 + 全期租金(+保障) + 运费 + 增值服务；验收通过7日内原路退押金'
        }
      }

      this.setData({ quoteData, quoteLoading: false, quote })
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
    const durationUnit = (value === '0' || value === 0) ? 'week' : 'month'
    
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
   * 评分点击跳转
   */
  onRatingTap() {
    const { sku } = this.data
    
    if (!sku || !sku.id) {
      wx.showToast({
        title: '商品信息不完整',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/reviews/reviews?productId=${sku.id}&productName=${encodeURIComponent(sku.title || sku.name)}`
    })
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