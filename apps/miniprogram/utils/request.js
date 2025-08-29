/**
 * 网络请求封装工具
 */

const BASE_URL = 'http://localhost:3000'

// 请求状态码映射
const STATUS_CODE = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

/**
 * 发起网络请求
 * @param {Object} options 请求配置
 * @param {string} options.url 请求路径
 * @param {string} options.method 请求方法
 * @param {Object} options.data 请求参数
 * @param {Object} options.header 请求头
 * @param {boolean} options.showLoading 是否显示加载提示
 * @param {boolean} options.showError 是否显示错误提示
 * @returns {Promise} 请求结果
 */
function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = false,
    showError = true
  } = options

  // 显示加载提示
  if (showLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: method.toUpperCase(),
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }

        const { statusCode, data: responseData } = res

        if (statusCode === STATUS_CODE.SUCCESS) {
          if (responseData && responseData.success) {
            resolve(responseData)
          } else {
            const errorMsg = responseData?.message || '请求失败'
            if (showError) {
              wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2000
              })
            }
            reject(new Error(errorMsg))
          }
        } else {
          const errorMsg = getErrorMessage(statusCode)
          if (showError) {
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
          }
          reject(new Error(errorMsg))
        }
      },
      fail: (error) => {
        if (showLoading) {
          wx.hideLoading()
        }

        const errorMsg = '网络连接失败，请检查网络设置'
        if (showError) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
        }
        reject(new Error(errorMsg))
      }
    })
  })
}

/**
 * 根据状态码获取错误信息
 * @param {number} statusCode 状态码
 * @returns {string} 错误信息
 */
function getErrorMessage(statusCode) {
  switch (statusCode) {
    case STATUS_CODE.UNAUTHORIZED:
      return '未授权访问'
    case STATUS_CODE.FORBIDDEN:
      return '访问被禁止'
    case STATUS_CODE.NOT_FOUND:
      return '请求的资源不存在'
    case STATUS_CODE.SERVER_ERROR:
      return '服务器内部错误'
    default:
      return `请求失败 (${statusCode})`
  }
}

/**
 * API 接口封装
 */
const api = {
  /**
   * 获取筛选元数据
   */
  getFiltersMeta() {
    return request({
      url: '/api/filters/meta',
      showLoading: true
    })
  },

  /**
   * 筛选商品
   * @param {Object} filters 筛选条件
   */
  filterProducts(filters = {}) {
    return request({
      url: '/api/filter',
      method: 'POST',
      data: filters,
      showLoading: true
    })
  },

  /**
   * 搜索商品
   * @param {Object} params 搜索参数
   */
  searchProducts(params = {}) {
    const { q = '', page = 1, limit = 10 } = params
    const query = new URLSearchParams({ q, page, limit }).toString()
    return request({
      url: `/api/search?${query}`,
      showLoading: page === 1
    })
  },

  /**
   * 获取商品详情
   * @param {string} id 商品ID
   */
  getProductDetail(id) {
    return request({
      url: `/api/sku/${id}`,
      showLoading: true
    })
  },

  /**
   * 获取推荐商品
   * @param {string} id 商品ID
   */
  getRecommendations(id) {
    return request({
      url: `/api/sku/${id}/recommendations`
    })
  },

  /**
   * 创建意向订单
   * @param {Object} orderData 订单数据
   */
  createIntentOrder(orderData) {
    return request({
      url: '/api/intent-order',
      method: 'POST',
      data: orderData,
      showLoading: true
    })
  }
}

/**
 * 存储工具
 */
const storage = {
  /**
   * 获取存储数据
   * @param {string} key 存储键
   * @param {*} defaultValue 默认值
   * @returns {*} 存储的数据
   */
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key)
      return value !== '' ? value : defaultValue
    } catch (error) {
      console.error('获取存储数据失败:', error)
      return defaultValue
    }
  },

  /**
   * 设置存储数据
   * @param {string} key 存储键
   * @param {*} value 存储值
   * @returns {boolean} 是否设置成功
   */
  set(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (error) {
      console.error('设置存储数据失败:', error)
      return false
    }
  },

  /**
   * 删除存储数据
   * @param {string} key 存储键
   * @returns {boolean} 是否删除成功
   */
  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('删除存储数据失败:', error)
      return false
    }
  },

  /**
   * 清空所有存储数据
   * @returns {boolean} 是否清空成功
   */
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

module.exports = {
  request,
  api,
  storage
}
