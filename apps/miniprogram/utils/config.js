/**
 * 全局配置文件
 * 注意：此文件已废弃，请使用 config/env.js 进行环境配置
 */

// 导入环境配置
const { isMockEnabled, getBaseURL, getApiTimeout, isDebugEnabled } = require('../config/env.js')

// 兼容性导出（保持向后兼容）
const USE_MOCK_DATA = isMockEnabled()

// API配置（从环境配置读取）
const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: getApiTimeout()
}

// 调试配置（从环境配置读取）
const DEBUG_CONFIG = {
  SHOW_REQUEST_LOG: isDebugEnabled(),
  SHOW_ERROR_DETAIL: isDebugEnabled()
}

module.exports = {
  USE_MOCK_DATA,
  API_CONFIG,
  DEBUG_CONFIG
}
