/**
 * 全局配置文件
 */

// 是否使用模拟数据（开发阶段建议设为true）
const USE_MOCK_DATA = true

// API配置
const API_CONFIG = {
  // 后端API地址
  BASE_URL: 'http://localhost:3000',
  // 请求超时时间（毫秒）
  TIMEOUT: 10000
}

// 调试配置
const DEBUG_CONFIG = {
  // 是否显示请求日志
  SHOW_REQUEST_LOG: true,
  // 是否显示错误详情
  SHOW_ERROR_DETAIL: true
}

module.exports = {
  USE_MOCK_DATA,
  API_CONFIG,
  DEBUG_CONFIG
}
