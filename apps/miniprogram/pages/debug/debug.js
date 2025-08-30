// pages/debug/debug.js
const { isMockEnabled } = require('../../config/env.js')
const { storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    debugLog: '等待测试...'
  },

  onLoad() {
    this.log('调试页面加载完成')
  },

  /**
   * 添加日志
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString()
    const currentLog = this.data.debugLog
    const newLog = `${timestamp}: ${message}\n${currentLog}`
    this.setData({ debugLog: newLog })
    console.log(`[调试] ${message}`)
  },

  /**
   * 测试存储功能
   */
  onTestStorage() {
    try {
      // 测试基本存储
      const testData = { test: 'hello', time: Date.now() }
      storage.set('test_storage', testData)
      const retrieved = storage.get('test_storage')
      
      if (JSON.stringify(testData) === JSON.stringify(retrieved)) {
        this.log('✅ 存储功能正常')
      } else {
        this.log('❌ 存储功能异常')
        this.log(`保存: ${JSON.stringify(testData)}`)
        this.log(`读取: ${JSON.stringify(retrieved)}`)
      }
    } catch (error) {
      this.log(`❌ 存储测试失败: ${error.message}`)
    }
  },

  /**
   * 查看收藏数据
   */
  onCheckFavorites() {
    try {
      const favorites = storage.get('favorites')
      this.log(`收藏数据: ${JSON.stringify(favorites, null, 2)}`)
      
      // 也检查原始微信存储
      const rawFavorites = wx.getStorageSync('favorites')
      this.log(`原始收藏数据: ${JSON.stringify(rawFavorites, null, 2)}`)
    } catch (error) {
      this.log(`查看收藏失败: ${error.message}`)
    }
  },

  /**
   * 查看购物车数据
   */
  onCheckCart() {
    try {
      const cartItems = storage.get('cartItems')
      this.log(`购物车数据: ${JSON.stringify(cartItems, null, 2)}`)
      
      // 也检查原始微信存储
      const rawCartItems = wx.getStorageSync('cartItems')
      this.log(`原始购物车数据: ${JSON.stringify(rawCartItems, null, 2)}`)
    } catch (error) {
      this.log(`查看购物车失败: ${error.message}`)
    }
  },

  /**
   * 添加测试收藏
   */
  onAddTestFavorite() {
    try {
      const testFavorite = {
        id: 'test_favorite_' + Date.now(),
        title: '测试收藏商品',
        brand: '测试品牌',
        price: 999,
        image: 'https://picsum.photos/400/300?random=999',
        favoriteAt: new Date().toISOString()
      }
      
      const favorites = storage.get('favorites') || []
      favorites.push(testFavorite)
      storage.set('favorites', favorites)
      
      this.log(`✅ 添加测试收藏成功，当前收藏数: ${favorites.length}`)
    } catch (error) {
      this.log(`❌ 添加测试收藏失败: ${error.message}`)
    }
  },

  /**
   * 添加测试购物车
   */
  onAddTestCart() {
    try {
      const testCartItem = {
        id: 'test_cart_' + Date.now(),
        title: '测试购物车商品',
        brand: '测试品牌',
        price: 888,
        image: 'https://picsum.photos/400/300?random=888',
        quantity: 1,
        selected: true,
        addedAt: new Date().toISOString()
      }
      
      const cartItems = storage.get('cartItems') || []
      cartItems.push(testCartItem)
      storage.set('cartItems', cartItems)
      
      this.log(`✅ 添加测试购物车成功，当前商品数: ${cartItems.length}`)
    } catch (error) {
      this.log(`❌ 添加测试购物车失败: ${error.message}`)
    }
  },

  /**
   * 清空所有数据
   */
  onClearAll() {
    try {
      // 先清空指定的存储项
      wx.removeStorageSync('favorites')
      wx.removeStorageSync('cartItems')
      
      // 然后重新初始化为空数组
      storage.set('favorites', [])
      storage.set('cartItems', [])
      
      this.log('✅ 已清空所有存储数据并重新初始化')
    } catch (error) {
      this.log(`❌ 清空数据失败: ${error.message}`)
    }
  },

  /**
   * 修复损坏的数据
   */
  onFixData() {
    try {
      // 检查并修复favorites
      let favorites = wx.getStorageSync('favorites')
      if (!Array.isArray(favorites)) {
        this.log(`修复favorites数据类型: ${typeof favorites} → Array`)
        storage.set('favorites', [])
      }
      
      // 检查并修复cartItems
      let cartItems = wx.getStorageSync('cartItems')
      if (!Array.isArray(cartItems)) {
        this.log(`修复cartItems数据类型: ${typeof cartItems} → Array`)
        storage.set('cartItems', [])
      }
      
      this.log('✅ 数据修复完成')
    } catch (error) {
      this.log(`❌ 数据修复失败: ${error.message}`)
    }
  }
})
