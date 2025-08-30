// pages/favorites/favorites.js
const { isMockEnabled } = require('../../config/env.js')
const { storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    favoriteItems: [],
    allSelected: false,
    loading: false
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    // 每次显示时刷新收藏数据
    this.loadFavorites()
  },

  /**
   * 加载收藏数据
   */
  loadFavorites() {
    try {
      this.setData({ loading: true })
      
      let favorites = storage.get('favorites') || []
      
      // 确保favorites是数组
      if (!Array.isArray(favorites)) {
        console.warn('收藏数据不是数组，重置:', favorites)
        favorites = []
        storage.set('favorites', []) // 重置存储
      }
      
      // 为每个收藏商品添加选中状态
      const favoritesWithState = favorites.map(item => ({
        ...item,
        selected: false
      }))
      
      // 收藏数据加载完成
      
      this.setData({
        favoriteItems: favoritesWithState,
        loading: false,
        allSelected: false
      })
    } catch (error) {
      console.error('加载收藏数据失败:', error)
      this.setData({
        favoriteItems: [],
        loading: false
      })
    }
  },

  /**
   * 切换商品选中状态
   */
  onToggleSelect(e) {
    const { id } = e.currentTarget.dataset
    const { favoriteItems } = this.data
    
    const updatedItems = favoriteItems.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    
    const selectedCount = updatedItems.filter(item => item.selected).length
    const allSelected = selectedCount === updatedItems.length && updatedItems.length > 0
    
    this.setData({
      favoriteItems: updatedItems,
      allSelected
    })
  },

  /**
   * 全选/取消全选
   */
  onToggleSelectAll() {
    const { favoriteItems, allSelected } = this.data
    
    const updatedItems = favoriteItems.map(item => ({
      ...item,
      selected: !allSelected
    }))
    
    this.setData({
      favoriteItems: updatedItems,
      allSelected: !allSelected
    })
  },

  /**
   * 批量添加到购物车
   */
  onBatchAddToCart() {
    const { favoriteItems } = this.data
    const selectedItems = favoriteItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要添加的商品',
        icon: 'none'
      })
      return
    }
    
    try {
      // 获取现有购物车数据
      const cartItems = storage.get('cartItems') || []
      
      selectedItems.forEach(item => {
        const existingIndex = cartItems.findIndex(cartItem => cartItem.id === item.id)
        if (existingIndex >= 0) {
          // 商品已存在，增加数量
          cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1
        } else {
          // 新商品，添加到购物车
          cartItems.push({
            ...item,
            quantity: 1,
            selected: true,
            addedAt: new Date().toISOString()
          })
        }
      })
      
      storage.set('cartItems', cartItems)
      
      wx.showToast({
        title: `已添加${selectedItems.length}件商品到购物车`,
        icon: 'success'
      })
      
      // 取消选中状态
      this.setData({
        favoriteItems: favoriteItems.map(item => ({ ...item, selected: false })),
        allSelected: false
      })
    } catch (error) {
      console.error('批量添加购物车失败:', error)
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
    }
  },

  /**
   * 批量删除收藏
   */
  onBatchDelete() {
    const { favoriteItems } = this.data
    const selectedItems = favoriteItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要删除的商品',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除${selectedItems.length}件收藏商品吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            const remainingItems = favoriteItems.filter(item => !item.selected)
            storage.set('favorites', remainingItems)
            
            this.setData({
              favoriteItems: remainingItems.map(item => ({ ...item, selected: false })),
              allSelected: false
            })
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除收藏失败:', error)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 商品卡片点击
   */
  onProductCardTap(e) {
    const { product } = e.detail
    if (product && product.id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${product.id}`
      })
    }
  },

  /**
   * 收藏状态变化
   */
  onFavoriteChange(e) {
    // 刷新收藏列表
    this.loadFavorites()
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
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadFavorites()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '家具租赁 - 我的收藏',
      path: '/pages/favorites/favorites'
    }
  }
})
