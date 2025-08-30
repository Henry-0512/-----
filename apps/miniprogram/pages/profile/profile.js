// pages/profile/profile.js
const { isMockEnabled } = require('../../config/env.js')
const { storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { authManager } = require('../../utils/auth.js')

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '未登录',
      phone: '',
      openid: '',
      isLoggedIn: false
    },
    orders: [],
    favoriteItems: [],
    compareItems: [],
    loading: true,
    currentTab: 'orders', // orders | favorites | compare
    statsData: {
      totalOrders: 0,
      totalFavorites: 0,
      totalCompare: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadData()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 从认证管理器获取用户信息
    const isLoggedIn = authManager.checkLoginStatus()
    const openid = authManager.getOpenid()
    
    // 从本地存储获取额外用户信息
    const localUserInfo = storage.get('userInfo') || {}
    
    this.setData({
      userInfo: {
        avatar: localUserInfo.avatar || '',
        nickname: localUserInfo.nickname || (isLoggedIn ? '微信用户' : '未登录'),
        phone: localUserInfo.phone || '',
        openid: openid ? openid.substr(-8) : '', // 只显示后8位
        isLoggedIn
      }
    })
  },

  /**
   * 手动登录
   */
  async onLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      
      const result = await authManager.wxLogin()
      
      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      this.loadUserInfo()
      
    } catch (error) {
      wx.hideLoading()
      console.error('登录失败:', error)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authManager.logout()
          this.loadUserInfo()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 加载所有数据
   */
  loadData() {
    try {
      this.setData({ loading: true })
      
      const orders = storage.get('orders') || []
      const favoriteItems = storage.get('favorites') || []
      const compareItems = storage.get('compareList') || []
      
      // 确保数据为数组类型
      const safeOrders = Array.isArray(orders) ? orders : []
      const safeFavorites = Array.isArray(favoriteItems) ? favoriteItems : []
      const safeCompare = Array.isArray(compareItems) ? compareItems : []
      
      this.setData({
        orders: safeOrders,
        favoriteItems: safeFavorites,
        compareItems: safeCompare,
        statsData: {
          totalOrders: safeOrders.length,
          totalFavorites: safeFavorites.length,
          totalCompare: safeCompare.length
        },
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败：', error)
      this.setData({ 
        loading: false,
        orders: [],
        favoriteItems: [],
        compareItems: [],
        statsData: {
          totalOrders: 0,
          totalFavorites: 0,
          totalCompare: 0
        }
      })
    }
  },

  /**
   * 获取用户信息授权
   */
  async onGetUserProfile() {
    try {
      const res = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      const userInfo = {
        avatar: res.userInfo.avatarUrl,
        nickname: res.userInfo.nickName,
        phone: this.data.userInfo.phone
      }
      
      storage.set('userInfo', userInfo)
      this.setData({ userInfo })
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('获取用户信息失败：', error)
      wx.showToast({
        title: '取消登录',
        icon: 'none'
      })
    }
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ currentTab: tab })
  },

  /**
   * 订单详情
   */
  onOrderDetail(e) {
    const { order } = e.currentTarget.dataset
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消'
    }
    
    wx.showModal({
      title: '订单详情',
      content: `订单号：${order.orderId}\n状态：${statusMap[order.status] || order.status}\n金额：¥${order.totalAmount}\n创建时间：${order.createdAt}`,
      showCancel: false
    })
  },

  /**
   * 商品卡片点击
   */
  onProductCardTap(e) {
    const { product } = e.detail
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}`
    })
  },

  /**
   * 收藏状态变化
   */
  onFavoriteChange(e) {
    console.log('收藏状态变化:', e.detail)
    // 刷新收藏列表
    setTimeout(() => {
      this.loadData()
    }, 100)
  },

  /**
   * 对比状态变化
   */
  onCompareChange(e) {
    console.log('对比状态变化:', e.detail)
    // 刷新对比列表
    setTimeout(() => {
      this.loadData()
    }, 100)
  },

  /**
   * 清空收藏
   */
  onClearFavorites() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有收藏吗？',
      success: (res) => {
        if (res.confirm) {
          storage.set('favorites', [])
          this.loadData()
          wx.showToast({
            title: '已清空收藏',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 清空对比
   */
  onClearCompare() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有对比商品吗？',
      success: (res) => {
        if (res.confirm) {
          storage.set('compareList', [])
          this.loadData()
          wx.showToast({
            title: '已清空对比',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 开始对比
   */
  onStartCompare() {
    const { compareItems } = this.data
    if (compareItems.length < 2) {
      wx.showToast({
        title: '至少需要2个商品才能对比',
        icon: 'none'
      })
      return
    }
    
    // 这里可以跳转到对比页面
    wx.showModal({
      title: '对比功能',
      content: '对比功能开发中...',
      showCancel: false
    })
  },

  /**
   * 跳转到设置页面
   */
  onGoToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 联系客服
   */
  onContactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n邮箱：service@furniture-rent.com',
      showCancel: false
    })
  },

  /**
   * 商品对比
   */
  onCompare() {
    wx.navigateTo({
      url: '/pages/compare/compare'
    })
  },

  /**
   * 关于我们
   */
  onAboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '家具租赁小程序 v1.0\n为您提供优质的家具租赁服务\n让家居生活更美好',
      showCancel: false
    })
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.remove('userInfo')
          this.setData({
            userInfo: {
              avatar: '',
              nickname: '未登录',
              phone: ''
            }
          })
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 查看关于页面
   */
  onViewAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 查看服务条款
   */
  onViewTerms() {
    wx.navigateTo({
      url: '/pages/policy/policy?type=terms'
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacy() {
    wx.navigateTo({
      url: '/pages/policy/policy?type=privacy'
    })
  },

  /**
   * 新增页面功能方法
   */
  onViewCart() {
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },

  onViewFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  onViewOrders() {
    wx.showToast({
      title: '订单功能开发中',
      icon: 'none'
    })
  },

  onPersonalDetails() {
    wx.showToast({
      title: '个人详情功能开发中',
      icon: 'none'
    })
  },

  onAddressBook() {
    wx.showToast({
      title: '地址簿功能开发中',
      icon: 'none'
    })
  },

  onPaymentDetails() {
    wx.showToast({
      title: '支付详情功能开发中',
      icon: 'none'
    })
  },

  onManageAccount() {
    wx.showToast({
      title: '账户管理功能开发中',
      icon: 'none'
    })
  },

  onPriceMatch() {
    wx.showToast({
      title: '价格匹配功能开发中',
      icon: 'none'
    })
  },

  onPriceRefund() {
    wx.showToast({
      title: '价格退款功能开发中',
      icon: 'none'
    })
  },

  onSettings() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  onChooseIcon() {
    wx.showToast({
      title: '选择图标功能开发中',
      icon: 'none'
    })
  },

  onFeedback() {
    wx.showToast({
      title: '反馈功能开发中',
      icon: 'none'
    })
  },

  onHelpContact() {
    wx.showToast({
      title: '帮助联系功能开发中',
      icon: 'none'
    })
  },

  onInStoreMode() {
    wx.showToast({
      title: '店内模式功能开发中',
      icon: 'none'
    })
  },

  onOurServices() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  onDebug() {
    wx.navigateTo({
      url: '/pages/debug/debug'
    })
  }
})