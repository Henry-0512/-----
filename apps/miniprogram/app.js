// app.js
const { authManager } = require('./utils/auth.js')
const { log } = require('./config/env.js')

App({
  globalData: {
    userInfo: null,
    baseURL: 'http://localhost:3000',
    authManager: authManager
  },

  async onLaunch() {
    log.info('小程序启动')
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 自动登录
    try {
      await this.autoLogin()
    } catch (error) {
      log.error('自动登录失败:', error)
      // 登录失败不影响小程序正常使用
    }
  },

  /**
   * 自动登录
   */
  async autoLogin() {
    try {
      log.debug('开始自动登录...')
      
      // 检查是否已有有效的登录状态
      if (authManager.checkLoginStatus()) {
        log.info('用户已登录:', authManager.getOpenid())
        this.globalData.userInfo = authManager.userInfo
        return
      }
      
      // 执行微信登录
      const result = await authManager.wxLogin()
      this.globalData.userInfo = result.userInfo
      
      log.info('自动登录成功:', result.openid)
      
    } catch (error) {
      log.error('自动登录失败:', error)
      // 可以在这里添加登录失败的处理逻辑
    }
  },

  /**
   * 确保用户已登录
   */
  async ensureUserLogin() {
    try {
      const openid = await authManager.ensureLogin()
      this.globalData.userInfo = authManager.userInfo
      return openid
    } catch (error) {
      log.error('确保登录失败:', error)
      throw error
    }
  },

  /**
   * 获取用户openid
   */
  getUserOpenid() {
    return authManager.getOpenid()
  },

  // 封装网络请求
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseURL}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败：${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
})
