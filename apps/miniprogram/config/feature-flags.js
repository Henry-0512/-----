// config/feature-flags.js - 功能开关配置

/**
 * 功能开关配置
 * 用于控制应用的各种功能特性和显示模式
 */

// 价格显示模式配置
const PRICE_DISPLAY_MODES = {
  SHOW: 'show',       // 显示具体价格
  RANGE: 'range',     // 显示价格区间
  FROM: 'from',       // 显示起价
  ASK: 'ask'          // 隐藏价格，显示咨询提示
}

// 功能开关定义
const FEATURE_FLAGS = {
  // 价格显示模式
  // 可选值: 'show' | 'range' | 'from' | 'ask'
  PRICE_DISPLAY_MODE: 'show',
  
  // 其他功能开关（预留扩展）
  ENABLE_FAVORITES: true,           // 是否启用收藏功能
  ENABLE_COMPARE: true,             // 是否启用对比功能
  ENABLE_CART: true,                // 是否启用购物车
  ENABLE_REVIEWS: false,            // 是否启用评价功能
  ENABLE_RECOMMENDATIONS: true,     // 是否启用推荐功能
  ENABLE_SIZE_GUIDE: true,          // 是否启用尺寸指南
  ENABLE_AR_VIEW: false,            // 是否启用AR预览
  ENABLE_LIVE_CHAT: true,           // 是否启用在线客服
  
  // 显示配置
  SHOW_STOCK_COUNT: true,           // 是否显示库存数量
  SHOW_BRAND_INFO: true,            // 是否显示品牌信息
  SHOW_DELIVERY_INFO: true,         // 是否显示配送信息
  SHOW_CARE_INSTRUCTIONS: true,     // 是否显示护理说明
  
  // 行为配置
  AUTO_PLAY_BANNER: true,           // 是否自动播放轮播图
  ENABLE_PULL_REFRESH: true,        // 是否启用下拉刷新
  ENABLE_INFINITE_SCROLL: true,     // 是否启用无限滚动
  
  // 性能配置
  IMAGE_LAZY_LOAD: true,            // 是否启用图片懒加载
  CACHE_ENABLED: true,              // 是否启用缓存
  PRELOAD_NEXT_PAGE: false          // 是否预加载下一页
}

/**
 * 获取功能开关状态
 * @param {string} flagName 功能开关名称
 * @returns {*} 功能开关值
 */
const getFeatureFlag = (flagName) => {
  return FEATURE_FLAGS[flagName]
}

/**
 * 检查功能是否启用
 * @param {string} flagName 功能开关名称
 * @returns {boolean} 是否启用
 */
const isFeatureEnabled = (flagName) => {
  return Boolean(FEATURE_FLAGS[flagName])
}

/**
 * 获取价格显示模式
 * @returns {string} 价格显示模式
 */
const getPriceDisplayMode = () => {
  return FEATURE_FLAGS.PRICE_DISPLAY_MODE || PRICE_DISPLAY_MODES.SHOW
}

/**
 * 检查是否为指定的价格显示模式
 * @param {string} mode 价格显示模式
 * @returns {boolean} 是否匹配
 */
const isPriceMode = (mode) => {
  return getPriceDisplayMode() === mode
}

/**
 * 格式化价格显示
 * @param {Object} product 商品对象
 * @returns {Object} 格式化后的价格信息
 */
const formatPriceDisplay = (product) => {
  if (!product) {
    return {
      mode: 'show',
      display: '价格未知',
      showButton: false
    }
  }

  const mode = getPriceDisplayMode()
  const price = product.price || 0
  const priceMin = product.price_min
  const priceMax = product.price_max
  const monthlyPrice = product.monthlyPrice || Math.ceil(price / 50)

  switch (mode) {
    case PRICE_DISPLAY_MODES.RANGE:
      // 显示价格区间
      if (priceMin && priceMax && priceMin !== priceMax) {
        const monthlyMin = Math.ceil(priceMin / 50)
        const monthlyMax = Math.ceil(priceMax / 50)
        return {
          mode: 'range',
          display: `¥${monthlyMin}-${monthlyMax}/月`,
          originalPrice: `原价¥${priceMin}-${priceMax}`,
          showButton: false
        }
      }
      // 如果没有区间数据，退化为show模式
      return {
        mode: 'show',
        display: `¥${monthlyPrice}/月`,
        originalPrice: `原价¥${price}`,
        showButton: false
      }

    case PRICE_DISPLAY_MODES.FROM:
      // 显示起价
      return {
        mode: 'from',
        display: `¥${monthlyPrice}/月 起`,
        originalPrice: priceMin ? `原价¥${priceMin} 起` : `原价¥${price} 起`,
        showButton: false
      }

    case PRICE_DISPLAY_MODES.ASK:
      // 隐藏价格，显示咨询
      return {
        mode: 'ask',
        display: '参考价，请私信获取',
        originalPrice: '',
        showButton: true,
        buttonText: '咨询价格'
      }

    case PRICE_DISPLAY_MODES.SHOW:
    default:
      // 显示具体价格
      return {
        mode: 'show',
        display: `¥${monthlyPrice}/月`,
        originalPrice: `原价¥${price}`,
        showButton: false
      }
  }
}

/**
 * 获取客服联系方式配置
 * @returns {Object} 客服配置
 */
const getCustomerServiceConfig = () => {
  return {
    // 微信客服配置
    wechat: {
      enabled: true,
      serviceId: 'kf001@furniture-rent',
      welcomeMessage: '您好，我是家具租赁顾问，请问有什么可以帮您？'
    },
    
    // 电话客服配置
    phone: {
      enabled: true,
      number: '400-888-6666',
      workTime: '9:00-21:00'
    },
    
    // 在线客服配置
    online: {
      enabled: false,
      chatUrl: 'https://chat.furniture-rent.com'
    }
  }
}

// 调试信息（仅开发环境）
const { isDev } = require('./env.js')
if (isDev()) {
  console.log('=== 功能开关配置 ===')
  console.log('价格显示模式:', getPriceDisplayMode())
  console.log('启用的功能:', Object.entries(FEATURE_FLAGS).filter(([key, value]) => value === true).map(([key]) => key))
  console.log('==================')
}

module.exports = {
  // 常量定义
  PRICE_DISPLAY_MODES,
  FEATURE_FLAGS,
  
  // 核心方法
  getFeatureFlag,
  isFeatureEnabled,
  getPriceDisplayMode,
  isPriceMode,
  formatPriceDisplay,
  getCustomerServiceConfig,
  
  // 便捷方法
  isShowMode: () => isPriceMode(PRICE_DISPLAY_MODES.SHOW),
  isRangeMode: () => isPriceMode(PRICE_DISPLAY_MODES.RANGE),
  isFromMode: () => isPriceMode(PRICE_DISPLAY_MODES.FROM),
  isAskMode: () => isPriceMode(PRICE_DISPLAY_MODES.ASK)
}
