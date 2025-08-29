// config/env.js - 环境配置管理

/**
 * 环境配置
 * 支持 DEV/PROD 两套环境
 */

// 从项目配置文件读取环境变量
let currentEnv = 'DEV'; // 默认开发环境

try {
  // 尝试读取 project.private.config.json 中的环境配置
  const projectConfig = require('../project.private.config.json');
  if (projectConfig && projectConfig.env) {
    currentEnv = projectConfig.env;
  }
} catch (error) {
  console.warn('未找到 project.private.config.json，使用默认环境配置');
}

// 环境配置定义
const ENV_CONFIG = {
  // 开发环境
  DEV: {
    BASE_URL: 'http://localhost:3000',
    API_TIMEOUT: 10000,
    DEBUG: true,
    LOG_LEVEL: 'debug',
    MOCK_ENABLED: true
  },
  
  // 生产环境
  PROD: {
    BASE_URL: 'https://api.furniture-rent.com',
    API_TIMEOUT: 5000,
    DEBUG: false,
    LOG_LEVEL: 'error',
    MOCK_ENABLED: false
  }
};

// 获取当前环境配置
const getEnvConfig = () => {
  const config = ENV_CONFIG[currentEnv];
  if (!config) {
    console.error(`未知环境: ${currentEnv}，使用默认DEV环境`);
    return ENV_CONFIG.DEV;
  }
  return config;
};

// 获取当前环境名称
const getCurrentEnv = () => {
  return currentEnv;
};

// 是否为开发环境
const isDev = () => {
  return currentEnv === 'DEV';
};

// 是否为生产环境
const isProd = () => {
  return currentEnv === 'PROD';
};

// 获取API基础URL
const getBaseURL = () => {
  return getEnvConfig().BASE_URL;
};

// 获取API超时时间
const getApiTimeout = () => {
  return getEnvConfig().API_TIMEOUT;
};

// 是否启用调试模式
const isDebugEnabled = () => {
  return getEnvConfig().DEBUG;
};

// 是否启用Mock数据
const isMockEnabled = () => {
  return getEnvConfig().MOCK_ENABLED;
};

// 日志记录函数
const log = {
  debug: (...args) => {
    if (isDebugEnabled()) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    console.log('[INFO]', ...args);
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

// 环境信息打印（仅开发环境）
if (isDev()) {
  log.info('=== 环境配置信息 ===');
  log.info('当前环境:', currentEnv);
  log.info('API地址:', getBaseURL());
  log.info('超时时间:', getApiTimeout() + 'ms');
  log.info('调试模式:', isDebugEnabled());
  log.info('Mock数据:', isMockEnabled());
  log.info('==================');
}

module.exports = {
  // 基础信息
  getCurrentEnv,
  getEnvConfig,
  
  // 环境判断
  isDev,
  isProd,
  
  // 配置获取
  getBaseURL,
  getApiTimeout,
  isDebugEnabled,
  isMockEnabled,
  
  // 工具函数
  log,
  
  // 常量导出
  ENV: currentEnv,
  BASE_URL: getBaseURL(),
  API_TIMEOUT: getApiTimeout(),
  DEBUG: isDebugEnabled(),
  MOCK_ENABLED: isMockEnabled()
};
