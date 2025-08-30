// utils/auth.js - 用户认证管理工具

const { api, storage } = require('./request.js')
const { log } = require('../config/env.js')

/**
 * 用户认证管理
 */
class AuthManager {
  constructor() {
    this.openid = null
    this.sessionKey = null
    this.userInfo = null
    this.isLoggedIn = false
  }

  /**
   * 初始化认证状态
   */
  init() {
    // 从本地存储恢复认证信息
    const savedAuth = storage.get('userAuth')
    if (savedAuth) {
      this.openid = savedAuth.openid
      this.sessionKey = savedAuth.sessionKey
      this.userInfo = savedAuth.userInfo
      this.isLoggedIn = Boolean(this.openid)
      
      log.debug('恢复用户认证状态:', {
        openid: this.openid,
        isLoggedIn: this.isLoggedIn
      })
    }
    
    return this.isLoggedIn
  }

  /**
   * 微信登录
   */
  async wxLogin() {
    try {
      log.debug('开始微信登录...')
      
      // 调用wx.login获取code
      const loginRes = await this.getWxLoginCode()
      log.debug('获取微信code成功:', loginRes.code)
      
      // 调用后端code2session接口
      const authRes = await api.code2session(loginRes.code)
      log.debug('code2session成功:', authRes.data)
      
      // 保存认证信息
      this.openid = authRes.data.openid
      this.sessionKey = authRes.data.session_key
      this.userInfo = authRes.data.userInfo
      this.isLoggedIn = true
      
      // 存储到本地
      this.saveAuthToStorage()
      
      log.info('用户登录成功:', this.openid)
      return {
        success: true,
        openid: this.openid,
        userInfo: this.userInfo
      }
      
    } catch (error) {
      log.error('微信登录失败:', error)
      throw error
    }
  }

  /**
   * 获取微信登录code
   */
  getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res)
          } else {
            reject(new Error('获取微信登录code失败'))
          }
        },
        fail: (error) => {
          reject(new Error('微信登录失败: ' + error.errMsg))
        }
      })
    })
  }

  /**
   * 保存认证信息到本地存储
   */
  saveAuthToStorage() {
    const authData = {
      openid: this.openid,
      sessionKey: this.sessionKey,
      userInfo: this.userInfo,
      loginTime: new Date().toISOString()
    }
    
    storage.set('userAuth', authData)
    log.debug('认证信息已保存到本地存储')
  }

  /**
   * 清除认证信息
   */
  logout() {
    this.openid = null
    this.sessionKey = null
    this.userInfo = null
    this.isLoggedIn = false
    
    storage.remove('userAuth')
    log.info('用户已退出登录')
  }

  /**
   * 获取当前用户openid
   */
  getOpenid() {
    return this.openid
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    return this.isLoggedIn && Boolean(this.openid)
  }

  /**
   * 确保用户已登录（如未登录则自动登录）
   */
  async ensureLogin() {
    if (this.checkLoginStatus()) {
      return this.openid
    }
    
    try {
      const result = await this.wxLogin()
      return result.openid
    } catch (error) {
      log.error('自动登录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户信息（用于订单提交）
   */
  getUserInfoForOrder() {
    return {
      openid: this.openid,
      userInfo: this.userInfo,
      isLoggedIn: this.isLoggedIn
    }
  }
}

// 创建全局认证管理实例
const authManager = new AuthManager()

// 自动初始化
authManager.init()

module.exports = {
  authManager,
  AuthManager
}
