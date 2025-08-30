// utils/track.js - 用户行为追踪工具

const { api } = require('./request.js')
const { authManager } = require('./auth.js')
const { log, isDebugEnabled } = require('../config/env.js')

/**
 * 用户行为追踪管理器
 */
class TrackingManager {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.trackQueue = []
    this.isTracking = true
    this.batchSize = 10
    this.flushInterval = 5000 // 5秒批量发送
    
    // 启动批量发送定时器
    this.startBatchTimer()
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }

  /**
   * 追踪用户行为
   * @param {string} event 事件名称
   * @param {Object} payload 事件数据
   * @param {Object} options 追踪选项
   */
  async track(event, payload = {}, options = {}) {
    if (!this.isTracking || !event) {
      return
    }

    try {
      const trackData = {
        event,
        payload: {
          ...payload,
          // 自动添加页面信息
          page: this.getCurrentPage(),
          timestamp: new Date().toISOString()
        },
        openid: authManager.getOpenid() || '',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      }

      // 调试模式下立即发送，生产模式下批量发送
      if (isDebugEnabled() || options.immediate) {
        await this.sendTrackingData(trackData)
      } else {
        this.addToQueue(trackData)
      }

      log.debug(`📊 追踪事件: ${event}`, payload)

    } catch (error) {
      log.error('追踪失败:', error)
      // 追踪失败不影响正常功能
    }
  }

  /**
   * 获取当前页面信息
   */
  getCurrentPage() {
    try {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      return {
        route: currentPage.route,
        options: currentPage.options || {}
      }
    } catch (error) {
      return { route: 'unknown', options: {} }
    }
  }

  /**
   * 添加到发送队列
   */
  addToQueue(trackData) {
    this.trackQueue.push(trackData)
    
    // 队列满时立即发送
    if (this.trackQueue.length >= this.batchSize) {
      this.flushQueue()
    }
  }

  /**
   * 发送追踪数据
   */
  async sendTrackingData(trackData) {
    try {
      await api.request({
        url: '/api/track',
        method: 'POST',
        data: trackData,
        showLoading: false,
        showError: false
      })
    } catch (error) {
      log.error('发送追踪数据失败:', error)
      // 静默失败，不影响用户体验
    }
  }

  /**
   * 批量发送队列中的数据
   */
  async flushQueue() {
    if (this.trackQueue.length === 0) return

    const batch = [...this.trackQueue]
    this.trackQueue = []

    try {
      // 批量发送
      await Promise.all(batch.map(data => this.sendTrackingData(data)))
      log.debug(`📊 批量发送追踪数据: ${batch.length}条`)
    } catch (error) {
      log.error('批量发送追踪数据失败:', error)
    }
  }

  /**
   * 启动批量发送定时器
   */
  startBatchTimer() {
    setInterval(() => {
      this.flushQueue()
    }, this.flushInterval)
  }

  /**
   * 设置追踪开关
   */
  setTrackingEnabled(enabled) {
    this.isTracking = enabled
    log.info(`追踪功能${enabled ? '已启用' : '已禁用'}`)
  }

  /**
   * 获取会话信息
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      openid: authManager.getOpenid(),
      isLoggedIn: authManager.checkLoginStatus()
    }
  }
}

// 创建全局追踪管理器实例
const trackingManager = new TrackingManager()

/**
 * 追踪用户行为（简化接口）
 * @param {string} event 事件名称
 * @param {Object} payload 事件数据
 * @param {Object} options 追踪选项
 */
const track = (event, payload = {}, options = {}) => {
  return trackingManager.track(event, payload, options)
}

/**
 * 预定义的追踪事件
 */
const TrackEvents = {
  // 筛选相关
  FILTER_APPLY: 'filter_apply',
  FILTER_RESET: 'filter_reset',
  
  // 列表相关
  LIST_LOAD_MORE: 'list_load_more',
  LIST_SORT_CHANGE: 'list_sort_change',
  
  // 商品详情相关
  PDP_VIEW: 'pdp_view',
  PDP_IMAGE_PREVIEW: 'pdp_image_preview',
  
  // 交互相关
  SIZE_SKETCH_ROTATE: 'size_sketch_rotate',
  SIZE_SKETCH_SCALE: 'size_sketch_scale',
  
  // 报价相关
  QUOTE_SUBMIT: 'quote_submit',
  QUOTE_CONFIG_CHANGE: 'quote_config_change',
  
  // 订单相关
  INTENT_SUBMIT_SUCCESS: 'intent_submit_success',
  INTENT_SUBMIT_FAILED: 'intent_submit_failed',
  
  // 用户行为
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // 按钮交互
  ASK_PRICE_CLICK: 'ask_price_click',
  CATEGORY_CLICK: 'category_click',
  MORE_CLICK: 'more_click',
  SORT_CHANGE: 'sort_change',
  
  // 页面访问
  PAGE_VIEW: 'page_view',
  PAGE_SHARE: 'page_share'
}

/**
 * 便捷的追踪方法
 */
const trackPageView = (pageName, options = {}) => {
  track(TrackEvents.PAGE_VIEW, {
    page: pageName,
    ...options
  })
}

const trackUserAction = (action, target, extra = {}) => {
  track(action, {
    target,
    ...extra
  })
}

// 调试信息
if (isDebugEnabled()) {
  log.info('📊 用户行为追踪系统已启用')
  log.debug('会话ID:', trackingManager.sessionId)
}

module.exports = {
  track,
  trackingManager,
  TrackEvents,
  trackPageView,
  trackUserAction
}
