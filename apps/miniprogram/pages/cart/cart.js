// pages/cart/cart.js
const { isMockEnabled } = require('../../config/env.js')
const { storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    cartItems: [],
    selectedItems: [],
    allSelected: false,
    totalAmount: 0,
    loading: false
  },

  onLoad() {
    this.loadCartData()
  },

  onShow() {
    // 每次显示时刷新购物车数据
    this.loadCartData()
  },

  /**
   * 加载购物车数据
   */
  loadCartData() {
    try {
      const cartItems = storage.get('cartItems') || []
      const validItems = Array.isArray(cartItems) ? cartItems : []
      
      // 为每个商品添加选中状态和数量
      const itemsWithState = validItems.map(item => ({
        ...item,
        selected: item.selected !== false, // 默认选中
        quantity: item.quantity || 1
      }))
      
      console.log('购物车数据加载:', itemsWithState)
      
      this.setData({
        cartItems: itemsWithState,
        loading: false
      })
      
      this.updateSelection()
    } catch (error) {
      console.error('加载购物车数据失败:', error)
      this.setData({
        cartItems: [],
        loading: false
      })
    }
  },

  /**
   * 更新选中状态和总价
   */
  updateSelection() {
    const { cartItems } = this.data
    const selectedItems = cartItems.filter(item => item.selected)
    const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length
    
    // 计算总金额
    const totalAmount = selectedItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0
      const quantity = item.quantity || 1
      return sum + (price * quantity)
    }, 0)
    
    this.setData({
      selectedItems,
      allSelected,
      totalAmount: totalAmount.toFixed(0)
    })
  },

  /**
   * 切换商品选中状态
   */
  onToggleSelect(e) {
    const { id } = e.currentTarget.dataset
    const { cartItems } = this.data
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    
    this.setData({ cartItems: updatedItems })
    this.updateSelection()
    this.saveCartData(updatedItems)
  },

  /**
   * 全选/取消全选
   */
  onToggleSelectAll() {
    const { cartItems, allSelected } = this.data
    
    const updatedItems = cartItems.map(item => ({
      ...item,
      selected: !allSelected
    }))
    
    this.setData({ cartItems: updatedItems })
    this.updateSelection()
    this.saveCartData(updatedItems)
  },

  /**
   * 增加数量
   */
  onIncreaseQty(e) {
    const { id } = e.currentTarget.dataset
    const { cartItems } = this.data
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: (item.quantity || 1) + 1 }
      }
      return item
    })
    
    this.setData({ cartItems: updatedItems })
    this.updateSelection()
    this.saveCartData(updatedItems)
  },

  /**
   * 减少数量
   */
  onDecreaseQty(e) {
    const { id } = e.currentTarget.dataset
    const { cartItems } = this.data
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id && (item.quantity || 1) > 1) {
        return { ...item, quantity: (item.quantity || 1) - 1 }
      }
      return item
    })
    
    this.setData({ cartItems: updatedItems })
    this.updateSelection()
    this.saveCartData(updatedItems)
  },

  /**
   * 移除商品
   */
  onRemoveItem(e) {
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中移除这件商品吗？',
      success: (res) => {
        if (res.confirm) {
          const { cartItems } = this.data
          const updatedItems = cartItems.filter(item => item.id !== id)
          
          this.setData({ cartItems: updatedItems })
          this.updateSelection()
          this.saveCartData(updatedItems)
          
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 结算
   */
  onCheckout() {
    const { selectedItems } = this.data
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      })
      return
    }
    
    // 跳转到结算页面（暂时显示提示）
    wx.showModal({
      title: '结算确认',
      content: `即将结算${selectedItems.length}件商品，总计¥${this.data.totalAmount}/月`,
      confirmText: '确认结算',
      cancelText: '继续购物',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '结算功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 去购物
   */
  onGoShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /**
   * 保存购物车数据
   */
  saveCartData(cartItems) {
    try {
      storage.set('cartItems', cartItems)
    } catch (error) {
      console.error('保存购物车数据失败:', error)
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCartData()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '家具租赁 - 我的购物车',
      path: '/pages/cart/cart'
    }
  }
})
