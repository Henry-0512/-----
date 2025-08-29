// pages/profile/profile.js
const { USE_MOCK_DATA } = require('../../utils/config.js')

const { storage } = USE_MOCK_DATA 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '未登录',
      phone: ''
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
    const userInfo = storage.get('userInfo', {
      avatar: '',
      nickname: '未登录',
      phone: ''
    })
    
    this.setData({ userInfo })
  },

  /**
   * 加载所有数据
   */
  loadData() {
    try {
      this.setData({ loading: true })
      
      const orders = storage.get('orders', [])
      const favoriteItems = storage.get('favorites', [])
      const compareItems = storage.get('compareList', [])
      
      this.setData({
        orders,
        favoriteItems,
        compareItems,
        statsData: {
          totalOrders: orders.length,
          totalFavorites: favoriteItems.length,
          totalCompare: compareItems.length
        },
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败：', error)
      this.setData({ loading: false })
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
  }
})