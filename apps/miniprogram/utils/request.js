/**
 * 网络请求封装工具 - 支持真实API调用和完整错误处理
 */

// 导入环境配置
const { getBaseURL, getApiTimeout, isDebugEnabled, log, isMockEnabled } = require('../config/env.js')

// 请求状态码映射
const STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
}

// 错误类型定义
const ERROR_TYPES = {
  NETWORK: 'NETWORK',        // 网络错误
  TIMEOUT: 'TIMEOUT',        // 超时错误
  SERVER: 'SERVER',          // 服务器错误
  CLIENT: 'CLIENT',          // 客户端错误
  BUSINESS: 'BUSINESS'       // 业务错误
}

// 错误消息映射
const ERROR_MESSAGES = {
  [STATUS_CODE.BAD_REQUEST]: '请求参数错误',
  [STATUS_CODE.UNAUTHORIZED]: '登录已过期，请重新登录',
  [STATUS_CODE.FORBIDDEN]: '没有访问权限',
  [STATUS_CODE.NOT_FOUND]: '请求的资源不存在',
  [STATUS_CODE.METHOD_NOT_ALLOWED]: '请求方法不支持',
  [STATUS_CODE.REQUEST_TIMEOUT]: '请求超时',
  [STATUS_CODE.SERVER_ERROR]: '服务器内部错误',
  [STATUS_CODE.BAD_GATEWAY]: '网关错误',
  [STATUS_CODE.SERVICE_UNAVAILABLE]: '服务暂时不可用',
  [STATUS_CODE.GATEWAY_TIMEOUT]: '网关超时'
}

/**
 * 获取错误信息
 * @param {number} statusCode 状态码
 * @param {string} defaultMessage 默认错误信息
 * @returns {object} 错误信息对象
 */
function getErrorInfo(statusCode, defaultMessage = '请求失败') {
  const message = ERROR_MESSAGES[statusCode] || defaultMessage
  let type = ERROR_TYPES.SERVER
  
  if (statusCode >= 400 && statusCode < 500) {
    type = ERROR_TYPES.CLIENT
  } else if (statusCode >= 500) {
    type = ERROR_TYPES.SERVER
  }
  
  return {
    type,
    message,
    statusCode,
    canRetry: type === ERROR_TYPES.SERVER || type === ERROR_TYPES.NETWORK || type === ERROR_TYPES.TIMEOUT
  }
}

/**
 * 判断是否为网络错误
 * @param {object} error 错误对象
 * @returns {boolean} 是否为网络错误
 */
function isNetworkError(error) {
  const networkErrors = [
    'request:fail',
    'request:fail timeout',
    'request:fail abort',
    'request:fail net::ERR_NETWORK_CHANGED',
    'request:fail net::ERR_CONNECTION_REFUSED',
    'request:fail net::ERR_CONNECTION_TIMED_OUT',
    'request:fail net::ERR_NAME_NOT_RESOLVED'
  ]
  
  return networkErrors.some(errorType => 
    error.errMsg && error.errMsg.includes(errorType)
  )
}

/**
 * 发起网络请求（核心方法）
 * @param {Object} options 请求配置
 * @param {string} options.url 请求路径
 * @param {string} options.method 请求方法
 * @param {Object} options.data 请求参数
 * @param {Object} options.header 请求头
 * @param {boolean} options.showLoading 是否显示加载提示
 * @param {boolean} options.showError 是否显示错误提示
 * @param {number} options.retryCount 重试次数
 * @param {boolean} options.enableRetry 是否允许重试
 * @returns {Promise} 请求结果
 */
function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = false,
    showError = true,
    retryCount = 0,
    enableRetry = true
  } = options

  // 获取动态配置
  const baseURL = getBaseURL()
  const timeout = getApiTimeout()

  // 调试日志
  log.debug(`[请求] ${method} ${baseURL}${url}`, {
    data,
    retryCount,
    timeout
  })

  if (showLoading) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseURL}${url}`,
      method: method.toUpperCase(),
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      timeout,
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }

        const { statusCode, data: responseData } = res
        
        log.debug(`[响应] ${statusCode}`, responseData)

        if (statusCode === STATUS_CODE.SUCCESS || statusCode === STATUS_CODE.CREATED) {
          // 成功响应
          if (responseData && responseData.success !== false) {
            resolve({
              success: true,
              data: responseData.data || responseData,
              message: responseData.message || 'success'
            })
          } else {
            // 业务错误
            const error = {
              type: ERROR_TYPES.BUSINESS,
              message: responseData?.message || '业务处理失败',
              statusCode,
              canRetry: false,
              data: responseData
            }
            
            if (showError) {
              wx.showToast({
                title: error.message,
                icon: 'none',
                duration: 2000
              })
            }
            
            reject(error)
          }
        } else {
          // HTTP错误
          const errorInfo = getErrorInfo(statusCode)
          
          if (showError) {
            wx.showToast({
              title: errorInfo.message,
              icon: 'none',
              duration: 2000
            })
          }
          
          reject(errorInfo)
        }
      },
      fail: (error) => {
        if (showLoading) {
          wx.hideLoading()
        }

        log.error('[请求失败]', error)

        let errorInfo
        
        if (isNetworkError(error)) {
          errorInfo = {
            type: ERROR_TYPES.NETWORK,
            message: '网络连接失败，请检查网络设置',
            canRetry: true,
            originalError: error
          }
        } else if (error.errMsg && error.errMsg.includes('timeout')) {
          errorInfo = {
            type: ERROR_TYPES.TIMEOUT,
            message: '请求超时，请稍后重试',
            canRetry: true,
            originalError: error
          }
        } else {
          errorInfo = {
            type: ERROR_TYPES.NETWORK,
            message: '请求失败，请稍后重试',
            canRetry: true,
            originalError: error
          }
        }

        // 自动重试逻辑
        if (enableRetry && errorInfo.canRetry && retryCount < 2) {
          log.debug(`[自动重试] 第${retryCount + 1}次重试`)
          
          setTimeout(() => {
            request({
              ...options,
              retryCount: retryCount + 1,
              showLoading: false // 重试时不再显示loading
            }).then(resolve).catch(reject)
          }, Math.pow(2, retryCount) * 1000) // 指数退避：1s, 2s, 4s
          
          return
        }

        if (showError) {
          wx.showToast({
            title: errorInfo.message,
            icon: 'none',
            duration: 2000
          })
        }

        reject(errorInfo)
      }
    })
  })
}

/**
 * 带重试功能的请求
 * @param {Object} options 请求配置
 * @param {Function} onRetry 重试回调
 * @returns {Promise} 请求结果
 */
function requestWithRetry(options, onRetry) {
  return request({
    ...options,
    enableRetry: false, // 禁用自动重试，使用手动重试
    showError: false    // 不自动显示错误，由页面处理
  }).catch(error => {
    // 如果是可重试的错误，抛出带重试信息的错误
    if (error.canRetry) {
      error.onRetry = () => requestWithRetry(options, onRetry)
      if (onRetry) error.onRetry = onRetry
    }
    throw error
  })
}

// ================== API 接口封装 ==================

/**
 * 获取筛选元数据
 */
const getFiltersMeta = () => {
  return requestWithRetry({
    url: '/api/filters/meta',
    method: 'GET',
    showLoading: true
  })
}

/**
 * 商品筛选
 * @param {Object} filters 筛选条件
 */
const filterProducts = (filters = {}) => {
  return requestWithRetry({
    url: '/api/filter',
    method: 'POST',
    data: filters,
    showLoading: true
  }, () => filterProducts(filters))
}

/**
 * 商品搜索
 * @param {string} keyword 搜索关键词
 * @param {Object} filters 附加筛选条件
 */
const searchProducts = (keyword, filters = {}) => {
  return requestWithRetry({
    url: '/api/search',
    method: 'GET',
    data: { q: keyword, ...filters },
    showLoading: true
  }, () => searchProducts(keyword, filters))
}

/**
 * 获取商品详情
 * @param {string} skuId 商品ID
 */
const getProductDetail = (skuId) => {
  return requestWithRetry({
    url: `/api/sku/${skuId}`,
    method: 'GET',
    showLoading: true
  }, () => getProductDetail(skuId))
}

/**
 * 获取推荐商品
 * @param {string} skuId 商品ID
 */
const getRecommendations = (skuId) => {
  return requestWithRetry({
    url: `/api/sku/${skuId}/recommendations`,
    method: 'GET'
  }, () => getRecommendations(skuId))
}

/**
 * 提交意向订单
 * @param {Object} orderData 订单数据
 */
const submitIntentOrder = (orderData) => {
  return request({
    url: '/api/intent-order',
    method: 'POST',
    data: orderData,
    showLoading: true
  })
}

// 本地存储工具
const storage = {
  get: (key) => {
    try {
      const value = wx.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  },
  
  set: (key, value) => {
    try {
      wx.setStorageSync(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  },
  
  remove: (key) => {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }
}

// 导出API对象
const api = {
  // 基础请求方法
  request,
  requestWithRetry,
  
  // 业务接口
  getFiltersMeta,
  filterProducts,
  searchProducts,
  getProductDetail,
  getRecommendations,
  submitIntentOrder,
  
  // 工具方法
  storage,
  
  // 错误类型
  ERROR_TYPES
}

module.exports = {
  api,
  request,
  requestWithRetry,
  storage,
  ERROR_TYPES,
  STATUS_CODE
}