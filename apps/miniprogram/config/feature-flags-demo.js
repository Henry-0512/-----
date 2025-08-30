// config/feature-flags-demo.js - 价格显示模式演示

/**
 * 快速切换价格显示模式的演示工具
 * 在开发阶段可以用来测试不同的价格显示效果
 */

const { PRICE_DISPLAY_MODES } = require('./feature-flags.js')

/**
 * 切换价格显示模式
 * @param {string} mode 新的价格显示模式
 */
const switchPriceMode = (mode) => {
  if (!Object.values(PRICE_DISPLAY_MODES).includes(mode)) {
    console.error('无效的价格显示模式:', mode)
    return false
  }

  // 动态修改功能开关
  const featureFlags = require('./feature-flags.js')
  featureFlags.FEATURE_FLAGS.PRICE_DISPLAY_MODE = mode
  
  console.log('价格显示模式已切换为:', mode)
  return true
}

/**
 * 获取所有可用的价格显示模式
 */
const getAllPriceModes = () => {
  return [
    { key: PRICE_DISPLAY_MODES.SHOW, name: '显示具体价格', description: '显示月租价格和原价' },
    { key: PRICE_DISPLAY_MODES.RANGE, name: '显示价格区间', description: '显示价格范围（如有）' },
    { key: PRICE_DISPLAY_MODES.FROM, name: '显示起价', description: '显示"¥XX/月 起"' },
    { key: PRICE_DISPLAY_MODES.ASK, name: '隐藏价格', description: '显示咨询按钮' }
  ]
}

/**
 * 演示不同价格模式的效果
 * @param {Object} sampleProduct 示例商品
 */
const demonstratePriceModes = (sampleProduct) => {
  const { formatPriceDisplay } = require('./feature-flags.js')
  
  console.log('=== 价格显示模式演示 ===')
  
  Object.values(PRICE_DISPLAY_MODES).forEach(mode => {
    // 临时切换模式
    const originalMode = require('./feature-flags.js').FEATURE_FLAGS.PRICE_DISPLAY_MODE
    require('./feature-flags.js').FEATURE_FLAGS.PRICE_DISPLAY_MODE = mode
    
    const result = formatPriceDisplay(sampleProduct)
    console.log(`${mode.toUpperCase()}模式:`, result)
    
    // 恢复原模式
    require('./feature-flags.js').FEATURE_FLAGS.PRICE_DISPLAY_MODE = originalMode
  })
  
  console.log('========================')
}

module.exports = {
  switchPriceMode,
  getAllPriceModes,
  demonstratePriceModes,
  PRICE_DISPLAY_MODES
}
