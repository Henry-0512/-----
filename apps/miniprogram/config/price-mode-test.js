/**
 * 价格模式测试工具
 * 用于快速切换不同价格显示模式进行测试
 */

// 测试用的价格模式配置
const PRICE_MODE_CONFIGS = {
  show: {
    name: '显示具体价格',
    description: '显示商品的具体价格，包括月租金',
    example: '¥1200 / ¥80/月'
  },
  
  range: {
    name: '显示价格区间', 
    description: '显示价格范围，适合有多个规格的商品',
    example: '¥800 - ¥1500'
  },
  
  from: {
    name: '显示起价',
    description: '显示起始价格，突出价格优势',
    example: '¥80/月 起'
  },
  
  ask: {
    name: '询价模式',
    description: '隐藏具体价格，引导用户咨询',
    example: '参考价，请私信获取 + 咨询价格按钮'
  }
}

/**
 * 切换价格显示模式
 * @param {string} mode - 价格模式 ('show'|'range'|'from'|'ask')
 */
function switchPriceMode(mode) {
  if (!PRICE_MODE_CONFIGS[mode]) {
    console.error('无效的价格模式:', mode)
    return false
  }
  
  console.log(`\n=== 切换到价格模式: ${mode} ===`)
  console.log(`名称: ${PRICE_MODE_CONFIGS[mode].name}`)
  console.log(`描述: ${PRICE_MODE_CONFIGS[mode].description}`)
  console.log(`示例: ${PRICE_MODE_CONFIGS[mode].example}`)
  console.log(`\n请手动修改 config/feature-flags.js 文件:`)
  console.log(`PRICE_DISPLAY_MODE: '${mode}'`)
  console.log(`然后重新编译小程序进行测试\n`)
  
  return true
}

/**
 * 显示所有价格模式的说明
 */
function showAllModes() {
  console.log('\n=== 所有价格显示模式 ===')
  Object.keys(PRICE_MODE_CONFIGS).forEach(mode => {
    const config = PRICE_MODE_CONFIGS[mode]
    console.log(`\n${mode.toUpperCase()}模式:`)
    console.log(`  名称: ${config.name}`)
    console.log(`  描述: ${config.description}`)
    console.log(`  示例: ${config.example}`)
  })
  console.log('\n使用方法: switchPriceMode("模式名称")')
}

/**
 * 布局测试检查清单
 */
function showLayoutChecklist() {
  console.log('\n=== 价格布局测试检查清单 ===')
  console.log('✅ 检查项目:')
  console.log('  1. 商品卡片高度一致，无布局跳跃')
  console.log('  2. 价格文字不超出卡片边界')
  console.log('  3. 询价按钮大小合适，文字完整显示')
  console.log('  4. 首页、分类、列表页面布局正常')
  console.log('  5. 2列网格布局整齐，无右侧空白')
  console.log('  6. 不同屏幕尺寸下显示正常')
  
  console.log('\n🧪 测试步骤:')
  console.log('  1. 切换到目标价格模式')
  console.log('  2. 重新编译小程序')
  console.log('  3. 测试首页商品展示')
  console.log('  4. 测试分类页商品卡片')
  console.log('  5. 测试列表页筛选结果')
  console.log('  6. 检查详情页价格显示')
}

// 导出测试函数
module.exports = {
  switchPriceMode,
  showAllModes,
  showLayoutChecklist,
  PRICE_MODE_CONFIGS
}

// 如果直接运行此文件，显示帮助信息
if (typeof window === 'undefined') {
  showAllModes()
  showLayoutChecklist()
}
