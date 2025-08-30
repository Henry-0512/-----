// pages/admin/intents.js - 意向订单管理页面
const { api } = require('../../utils/request.js')

Page({
  data: {
    // 认证状态
    isAuthenticated: false,
    adminToken: '',
    inputToken: '',
    
    // 数据状态
    loading: false,
    orders: [],
    stats: {
      total: 0,
      pending: 0,
      contacted: 0,
      done: 0
    },
    
    // 筛选和分页
    currentStatus: 'all',
    page: 1,
    limit: 20,
    hasMore: true,
    
    // 状态选项
    statusOptions: [
      { key: 'all', name: '全部', color: '#666' },
      { key: 'pending', name: '待处理', color: '#FF9800' },
      { key: 'contacted', name: '已联系', color: '#2196F3' },
      { key: 'done', name: '已完成', color: '#4CAF50' }
    ],
    
    // UI状态
    error: null,
    isEmpty: false
  },

  onLoad() {
    // 检查是否已有保存的令牌
    const savedToken = wx.getStorageSync('adminToken')
    if (savedToken) {
      this.setData({ 
        adminToken: savedToken,
        isAuthenticated: true 
      })
      this.loadOrders()
    }
  },

  /**
   * 输入令牌变化
   */
  onTokenInput(e) {
    this.setData({ inputToken: e.detail.value })
  },

  /**
   * 验证管理员令牌
   */
  async onAuthenticate() {
    const { inputToken } = this.data
    
    if (!inputToken.trim()) {
      wx.showToast({
        title: '请输入访问令牌',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '验证中...' })
      
      // 尝试获取订单列表来验证令牌
      await api.getIntentOrderList(inputToken.trim(), { page: 1, limit: 1 })
      
      // 验证成功
      this.setData({
        adminToken: inputToken.trim(),
        isAuthenticated: true,
        inputToken: ''
      })
      
      // 保存令牌到本地
      wx.setStorageSync('adminToken', inputToken.trim())
      
      wx.hideLoading()
      wx.showToast({
        title: '验证成功',
        icon: 'success'
      })
      
      // 加载订单数据
      this.loadOrders()
      
    } catch (error) {
      wx.hideLoading()
      console.error('令牌验证失败:', error)
      
      if (error.statusCode === 401) {
        wx.showToast({
          title: '访问令牌无效',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: '验证失败，请重试',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理系统吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('adminToken')
          this.setData({
            isAuthenticated: false,
            adminToken: '',
            orders: [],
            stats: { total: 0, pending: 0, contacted: 0, done: 0 }
          })
        }
      }
    })
  },

  /**
   * 加载订单列表
   */
  async loadOrders(refresh = false) {
    const { adminToken, currentStatus, page, limit } = this.data
    
    if (!adminToken) return

    try {
      if (refresh) {
        this.setData({ 
          page: 1, 
          orders: [],
          loading: true,
          error: null 
        })
      } else {
        this.setData({ loading: true, error: null })
      }

      const currentPage = refresh ? 1 : page
      const res = await api.getIntentOrderList(adminToken, {
        status: currentStatus,
        page: currentPage,
        limit
      })

      const newOrders = res.data.orders || []
      const allOrders = refresh ? newOrders : [...this.data.orders, ...newOrders]

      this.setData({
        orders: allOrders,
        stats: res.data.stats || {},
        page: res.data.pagination?.page || currentPage,
        hasMore: (res.data.pagination?.page || currentPage) < (res.data.pagination?.totalPages || 1),
        loading: false,
        isEmpty: allOrders.length === 0
      })

    } catch (error) {
      console.error('加载订单列表失败:', error)
      this.setData({
        loading: false,
        error: error.message || '加载失败，请重试'
      })
    }
  },

  /**
   * 状态筛选切换
   */
  onStatusFilter(e) {
    const { status } = e.currentTarget.dataset
    if (status === this.data.currentStatus) return

    this.setData({
      currentStatus: status,
      page: 1,
      orders: []
    })
    this.loadOrders(true)
  },

  /**
   * 更新订单状态
   */
  async onUpdateStatus(e) {
    const { orderId, newStatus } = e.currentTarget.dataset
    const { adminToken } = this.data

    if (!orderId || !newStatus) return

    try {
      wx.showLoading({ title: '更新中...' })
      
      await api.updateIntentOrderStatus(orderId, adminToken, newStatus)
      
      wx.hideLoading()
      wx.showToast({
        title: '状态更新成功',
        icon: 'success'
      })
      
      // 刷新列表
      this.loadOrders(true)
      
    } catch (error) {
      wx.hideLoading()
      console.error('更新状态失败:', error)
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'none'
      })
    }
  },

  /**
   * 查看订单详情
   */
  onViewOrder(e) {
    const { order } = e.currentTarget.dataset
    
    const content = [
      `订单ID: ${order.id}`,
      `商品: ${order.sku?.title}`,
      `品牌: ${order.sku?.brand}`,
      `租期: ${order.duration}${order.durationUnit === 'week' ? '周' : '月'}`,
      `数量: ${order.quantity}`,
      `总金额: ¥${order.totalAmount}`,
      `创建时间: ${new Date(order.createdAt).toLocaleString()}`,
      order.userInfo?.phone ? `联系电话: ${order.userInfo.phone}` : '',
      order.note ? `备注: ${order.note}` : ''
    ].filter(Boolean).join('\n')

    wx.showModal({
      title: '订单详情',
      content,
      confirmText: '关闭',
      showCancel: false
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadOrders(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    const { hasMore, loading } = this.data
    if (hasMore && !loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadOrders()
    }
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadOrders(true)
  }
})
