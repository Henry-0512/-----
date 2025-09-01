// pages/index/index.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES, storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { deriveConditionText } = require('../../utils/condition.js')
const { getCategoryDisplay } = require('../../utils/category-icons.js')
const { formatPriceDisplay } = require('../../config/feature-flags.js')

// 以 rpx 为单位
const PAGE_PAD = 24
const GUTTER = 16
const CARD_W = Math.floor((750 - PAGE_PAD*2 - GUTTER)/2) // ≈343 → 用 342 更稳
const IMG_RATIO = 0.85 // 图片更"长"更好看（宜家风），想短就降到 0.78
const IMG_H = Math.round(CARD_W * IMG_RATIO)

function attachConditionText(list){
  return (list || []).map(it => {
    const priceInfo = formatPriceDisplay(it)
    return {
      ...it,
      _conditionText: deriveConditionText(it),
      formattedPrice: (it.rent_monthly_gbp || it.monthly || 8).toFixed(1),
      priceInfo: priceInfo
    }
  })
}

Page({
  data: {
    // 页面状态
    loading: true,
    error: null,
    isEmpty: false,
    banners: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=750&h=400&fit=crop',
        title: '精品家具租赁',
        link: '/pages/list/list'
      },
      {
        id: '2', 
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=750&h=400&fit=crop',
        title: '灵活租期',
        link: '/pages/category/category'
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=750&h=400&fit=crop',
        title: '品质保证',
        link: '/pages/list/list?category=sofa'
      }
    ],
    categories: [],
    displayCats: [],
    showAllCats: false,
    hotItems: [],
    totalCount: 0,
    searchKeyword: '',
    error: null,

    // 卡片宽高（IKEA风）
    cardW: 342, // 固定使用 342 更稳
    imgH: IMG_H,

    // 首次进入引导登录
    showAuthModal: false,
    authNickname: '',
    authAvatar: '',
    authNickError: false,
    authAvatarError: false
  },

  onLoad() {
    this.setData({ cardW: 342, imgH: IMG_H })
    this.loadHomeData()
  },

  onToggleCats(){
    const showAll = !this.data.showAllCats
    const cats = this.data.categories || []
    this.setData({
      showAllCats: showAll,
      displayCats: showAll ? cats : cats.slice(0,4)
    })
  },

  onShow() {
    // 每次显示时检查是否需要刷新数据
    if (!this.data.hotItems.length) {
      this.loadHomeData()
    }

    // 引导登录：若未引导且未登录，则显示
    try {
      const onboarded = storage.get('onboarded')
      const user = storage.get('user') || {}
      if (!onboarded && !(user && user.loggedIn)) {
        this.setData({ showAuthModal: true })
      }
    } catch (e) {}
  },

  /**
   * 加载首页数据
   */
  async loadHomeData() {
    try {
      this.setData({ 
        loading: true, 
        error: null,
        isEmpty: false 
      })
      
      // 并行加载分类数据和热门商品（默认月租从高到低）
      const [filterRes, hotItemsRes] = await Promise.all([
        api.getFiltersMeta(),
        api.filterProducts({}, { page: 1, page_size: 8, sort: 'rent_desc' })
      ])
      
      const rawCategories = filterRes.data?.categories || filterRes.data || []
      const categories = rawCategories.map(cat => ({
        ...cat,
        ...getCategoryDisplay(cat)
      }))
      const rawHotItems = (hotItemsRes.data?.items || hotItemsRes.data || []).map(item => ({
        ...item,
        conditionClass: this.mapBadgeClass(item.condition_grade || item.condition),
        conditionText: item.condition_grade || item.condition || '全新'
      }))
      const hotItems = attachConditionText(rawHotItems)
      
      this.setData({
        categories,
        displayCats: (this.data.showAllCats ? categories : (categories || []).slice(0,4)),
        hotItems,
        totalCount: hotItemsRes.data?.total || hotItems.length || 137,
        loading: false,
        isEmpty: categories.length === 0 && hotItems.length === 0
      })
    } catch (error) {
      console.error('加载首页数据失败：', error)
      
      this.setData({
        loading: false,
        error: {
          type: error.type || ERROR_TYPES.NETWORK,
          message: error.message || '加载失败，请重试',
          canRetry: error.canRetry !== false,
          onRetry: error.onRetry || (() => this.loadHomeData())
        }
      })
    }
  },

  // ===== 引导登录相关 =====
  onAuthInputNick(e) {
    this.setData({ authNickname: e.detail.value, authNickError: false })
  },
  onChooseAuthAvatar(e) {
    const url = e.detail.avatarUrl
    if (url) this.setData({ authAvatar: url, authAvatarError: false })
  },
  async onAuthLogin() {
    // 优先尝试获取微信资料，用户可拒绝
    try {
      const prof = await new Promise((resolve) => {
        wx.getUserProfile({ desc: '用于完善资料', success: resolve, fail: resolve })
      })
      const nickFromWx = prof && prof.userInfo && prof.userInfo.nickName
      const avatarFromWx = prof && prof.userInfo && prof.userInfo.avatarUrl
      if (!this.data.authNickname && nickFromWx) {
        this.setData({ authNickname: nickFromWx, authNickError: false })
      }
      if (!this.data.authAvatar && avatarFromWx) {
        // 仅在未手动选择头像时使用微信头像
        this.setData({ authAvatar: avatarFromWx, authAvatarError: false })
      }
    } catch (_) {}

    // 校验头像与昵称必填（头像默认空白并提示点击授权）
    const lacksAvatar = !this.data.authAvatar
    const lacksNick = !this.data.authNickname || !this.data.authNickname.trim()
    if (lacksAvatar || lacksNick) {
      this.setData({ authAvatarError: lacksAvatar, authNickError: lacksNick })
      wx.showToast({ title: '请完善头像与昵称', icon: 'none' })
      return
    }
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ timeout: 8000, success: resolve, fail: reject })
      })
      const res = await api.code2session(loginRes.code)
      const openid = res.data?.openid || this.generateLocalId()
      const user = {
        openid,
        nickname: this.data.authNickname,
        avatar: this.data.authAvatar,
        phone: '',
        loggedIn: true
      }
      storage.set('user', user)
      storage.set('client_id', openid)
      storage.set('onboarded', true)
      this.setData({ showAuthModal: false })
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (e) {
      // 失败走本地ID
      const id = this.generateLocalId()
      const user = {
        openid: id,
        nickname: this.data.authNickname || '访客用户',
        avatar: this.data.authAvatar || '',
        phone: '',
        loggedIn: true
      }
      storage.set('user', user)
      storage.set('client_id', id)
      storage.set('onboarded', true)
      this.setData({ showAuthModal: false })
      wx.showToast({ title: '已使用本地ID登录', icon: 'none' })
    }
  },
  onAuthSkip() {
    try {
      // 确保存在client_id
      let id = storage.get('client_id')
      if (!id) {
        id = this.generateLocalId()
        storage.set('client_id', id)
      }
      const user = storage.get('user') || {}
      if (!user || !user.openid) {
        storage.set('user', { openid: id, nickname: '微信用户', avatar: '', phone: '', loggedIn: false })
      }
      storage.set('onboarded', true)
    } catch (e) {}
    this.setData({ showAuthModal: false })
  },
  generateLocalId() {
    const d = new Date()
    const pad = n => (n < 10 ? '0' + n : '' + n)
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const HH = pad(d.getHours())
    const MM = pad(d.getMinutes())
    const rand = Math.floor(Math.random() * 9000 + 1000)
    return `guest-${yyyy}${mm}${dd}-${HH}${MM}-${rand}`
  },

  /**
   * 重试加载
   */
  onRetryLoad() {
    const { error } = this.data
    if (error && error.onRetry) {
      error.onRetry()
    } else {
      this.loadHomeData()
    }
  },

  /**
   * 管理员入口（隐藏功能）
   */
  onAdminAccess() {
    wx.showModal({
      title: '管理员入口',
      content: '确定要进入管理系统吗？',
      confirmText: '进入',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/admin/intents'
          })
        }
      }
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  /**
   * 执行搜索
   */
  onSearchConfirm() {
    const { searchKeyword } = this.data
    if (searchKeyword.trim()) {
      wx.navigateTo({
        url: `/pages/list/list?q=${encodeURIComponent(searchKeyword.trim())}`
      })
    }
  },

  /**
   * 点击搜索框
   */
  onSearchTap() {
    wx.navigateTo({ url: '/pages/search/index' })
  },

  /**
   * 轮播图点击
   */
  onBannerTap(e) {
    const { banner } = e.currentTarget.dataset
    if (banner.link) {
      if (banner.link.startsWith('/pages/')) {
        wx.navigateTo({
          url: banner.link
        })
      } else {
        wx.switchTab({
          url: banner.link
        })
      }
    }
  },

  /**
   * 分类点击
   */
  onTapCategory(e) {
    const name = e.currentTarget.dataset.name
    console.log('🔍 分类点击:', name)
    
    if (!name) {
      wx.showToast({
        title: '分类数据错误',
        icon: 'none'
      })
      return
    }
    
    console.log('🔍 准备跳转到列表页，分类:', name)
    
    // 简化URL，避免编码问题
    wx.navigateTo({
      url: `/pages/list/list?category=${name}&title=${name}&sort=rent_desc`,
      success: () => {
        console.log('🔍 跳转成功')
      },
      fail: (error) => {
        console.error('🔍 跳转失败:', error)
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 商品卡片点击
   */
  onProductCardTap(e) {
    const { product } = e.currentTarget.dataset
    console.log('商品卡片点击:', product)
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}`
    })
  },

  /**
   * 收藏状态变化
   */
  onFavoriteChange(e) {
    console.log('收藏状态变化:', e.detail)
  },

  /**
   * 查看更多热门商品
   */
  onViewMoreHot() {
    console.log('🔍 查看更多被点击')
    
    // 简化跳转
    wx.navigateTo({
      url: '/pages/list/list?title=全部商品&sort=rent_desc',
      success: () => {
        console.log('🔍 查看更多跳转成功')
      },
      fail: (error) => {
        console.error('🔍 查看更多跳转失败:', error)
      }
    })
  },

  // 首页排序筛选功能已移除

  /**
   * 重试加载
   */
  onRetry() {
    this.loadHomeData()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadHomeData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '家具租赁 - 让生活更美好',
      path: '/pages/index/index',
      imageUrl: '/images/share-home.png'
    }
  },

  /**
   * 成色样式映射函数
   */
  mapBadgeClass(condition) {
    if (!condition) return ''
    const v = String(condition)
    if (v.includes('全新') || v === 'new') return 'badge-new'
    if (v.includes('95') || v.includes('九五')) return 'badge-95'
    if (v.includes('90') || v.includes('九成')) return 'badge-90'
    return ''
  },

  /**
   * 切换收藏状态
   */
  onToggleFav(e) {
    const { id } = e.currentTarget.dataset
    const { hotItems } = this.data
    
    // 找到对应的商品
    const product = hotItems.find(item => item.id === id)
    if (!product) {
      console.error('未找到商品:', id)
      return
    }
    
    // 获取当前收藏列表
    const { storage } = require('../../utils/request.js')
    let favorites = storage.get('favorites') || []
    
    // 检查是否已收藏
    const existingIndex = favorites.findIndex(item => item.id === id)
    
    if (existingIndex >= 0) {
      // 取消收藏
      favorites.splice(existingIndex, 1)
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      })
    } else {
      // 添加收藏
      const favoriteItem = {
        id: product.id,
        title: product.title || product.name,
        cover: product.cover || product.image || (product.images && product.images[0] ? product.images[0].url : ''),
        rent_monthly_gbp: product.rent_monthly_gbp || product.monthly || 8,
        purchase_price_gbp: product.purchase_price_gbp || product.msrp,
        brand: product.brand || 'LivingLux',
        material: product.material || '科技布',
        color: product.color || '灰色',
        condition_grade: product.condition_grade || product.condition,
        addedAt: new Date().toISOString()
      }
      favorites.push(favoriteItem)
      wx.showToast({
        title: '已添加到收藏',
        icon: 'success'
      })
    }
    
    // 保存到本地存储
    storage.set('favorites', favorites)
    
    // 更新页面数据
    const updatedItems = hotItems.map(item => {
      if (item.id === id) {
        return { ...item, favored: existingIndex < 0 }
      }
      return item
    })
    
    this.setData({
      hotItems: updatedItems
    })
    
    console.log('收藏状态已更新:', id, existingIndex < 0 ? '已收藏' : '已取消收藏')
  },

  /**
   * 添加购物车
   */
  onAddToCart(e) {
    const { id } = e.currentTarget.dataset
    const { hotItems } = this.data
    
    // 找到对应的商品
    const product = hotItems.find(item => item.id === id)
    if (!product) {
      console.error('未找到商品:', id)
      return
    }
    
    // 获取当前购物车列表
    const { storage } = require('../../utils/request.js')
    let cartItems = storage.get('cartItems') || []
    
    // 检查是否已在购物车中
    const existingIndex = cartItems.findIndex(item => item.id === id)
    
    if (existingIndex >= 0) {
      // 增加数量
      cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1
      wx.showToast({
        title: '数量已增加',
        icon: 'success'
      })
    } else {
      // 添加到购物车
      const cartItem = {
        id: product.id,
        title: product.title || product.name,
        cover: product.cover || product.image || (product.images && product.images[0] ? product.images[0].url : ''),
        rent_monthly_gbp: product.rent_monthly_gbp || product.monthly || 8,
        purchase_price_gbp: product.purchase_price_gbp || product.msrp,
        brand: product.brand || 'LivingLux',
        material: product.material || '科技布',
        color: product.color || '灰色',
        condition_grade: product.condition_grade || product.condition,
        quantity: 1,
        selected: true,
        addedAt: new Date().toISOString()
      }
      cartItems.push(cartItem)
      wx.showToast({
        title: '已添加到购物车',
        icon: 'success'
      })
    }
    
    // 保存到本地存储
    storage.set('cartItems', cartItems)
    
    console.log('购物车已更新:', id, existingIndex >= 0 ? '数量增加' : '新添加')
  },

  /**
   * 查看选项
   */
  onOptions(e) {
    const { id } = e.currentTarget.dataset
    console.log('查看选项:', id)
    // TODO: 实现选项查看逻辑
  },

  /**
   * 价格咨询
   */
  onPriceInquiry(e) {
    const { product } = e.currentTarget.dataset
    const { getCustomerServiceConfig } = require('../../config/feature-flags.js')
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
  }
})
