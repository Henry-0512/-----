/**
 * 网络请求封装工具 - 模拟版本（无需后端服务）
 */

const { mockApi } = require('./mock-data.js')

/**
 * 存储工具
 */
const storage = {
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key)
      return value !== '' ? value : defaultValue
    } catch (error) {
      console.error('获取存储数据失败:', error)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (error) {
      console.error('设置存储数据失败:', error)
      return false
    }
  },

  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除存储数据失败:', error)
      return false
    }
  },

  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空存储数据失败:', error)
      return false
    }
  }
}

/**
 * 模拟网络请求
 */
function request(options = {}) {
  console.log('🚀 模拟请求:', options.url)
  
  // 显示加载提示
  if (options.showLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return new Promise((resolve) => {
    // 模拟网络延迟
    setTimeout(() => {
      if (options.showLoading) {
        wx.hideLoading()
      }
      
      // 这里可以根据URL返回不同的模拟数据
      resolve({
        success: true,
        data: { message: '模拟数据' }
      })
    }, 500)
  })
}

/**
 * API 接口封装 - 使用模拟数据
 */
const api = {
  getFiltersMeta() {
    wx.showLoading({ title: '加载中...', mask: true })
    return mockApi.getFiltersMeta().finally(() => {
      wx.hideLoading()
    })
  },

  filterProducts(filters = {}) {
    wx.showLoading({ title: '加载中...', mask: true })
    return mockApi.filterProducts(filters).finally(() => {
      wx.hideLoading()
    })
  },

  searchProducts(params = {}) {
    wx.showLoading({ title: '加载中...', mask: true })
    return mockApi.searchProducts(params).finally(() => {
      wx.hideLoading()
    })
  },

  getProductDetail(id) {
    wx.showLoading({ title: '加载中...', mask: true })
    return mockApi.getProductDetail(id).finally(() => {
      wx.hideLoading()
    })
  },

  getRecommendations(id) {
    return mockApi.getRecommendations(id)
  },

  createIntentOrder(orderData) {
    wx.showLoading({ title: '创建订单中...', mask: true })
    return mockApi.createIntentOrder(orderData).finally(() => {
      wx.hideLoading()
    })
  }
}

module.exports = {
  request,
  api,
  storage
}
