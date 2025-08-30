/**
 * 敏感词过滤工具
 * 用于在展示层统一处理敏感词替换，不影响真实数据
 */

// 敏感词替换表
const SENSITIVE_WORDS_MAP = {
  // 配送相关
  '配送': '到家协助',
  '送货': '到家协助',
  '快递': '到家协助',
  '物流': '到家协助',
  
  // 安装相关
  '安装': '组装协助',
  '装配': '组装协助',
  '组装': '组装协助',
  
  // 服务相关
  '客服': '顾问',
  '售后': '后续服务',
  '维修': '维护',
  '保修': '质保',
  
  // 金融相关
  '贷款': '分期',
  '借款': '分期',
  '信贷': '分期',
  
  // 其他敏感词
  '投诉': '反馈',
  '纠纷': '协商',
  '退款': '退还',
  '赔偿': '补偿'
}

// 保护词汇（不进行替换的上下文）
const PROTECTED_WORDS_REGEX = [
  /配送费/g,  // 配送费保持不变
  /配送范围/g, // 配送范围保持不变
  /配送时间/g  // 配送时间保持不变
]

/**
 * 单个文本敏感词过滤
 * @param {string} text - 原始文本
 * @returns {string} - 过滤后的文本
 */
function safeText(text) {
  if (!text || typeof text !== 'string') {
    return text
  }
  
  let result = text
  
  // 检查是否包含保护词汇
  const hasProtectedWords = PROTECTED_WORDS_REGEX.some(regex => regex.test(text))
  if (hasProtectedWords) {
    return result // 包含保护词汇时不进行替换
  }
  
  // 进行敏感词替换
  Object.keys(SENSITIVE_WORDS_MAP).forEach(sensitiveWord => {
    const replacement = SENSITIVE_WORDS_MAP[sensitiveWord]
    const regex = new RegExp(sensitiveWord, 'g')
    result = result.replace(regex, replacement)
  })
  
  return result
}

/**
 * 商品对象敏感词过滤
 * @param {Object} product - 商品对象
 * @returns {Object} - 过滤后的商品对象（浅拷贝）
 */
function safeProduct(product) {
  if (!product || typeof product !== 'object') {
    return product
  }
  
  const safeObj = { ...product }
  
  // 需要过滤的字段
  const textFields = [
    'name', 'title', 'description', 'brand', 'material', 
    'color', 'style', 'notes', 'features', 'care_instructions',
    'warranty', 'delivery_info'
  ]
  
  textFields.forEach(field => {
    if (safeObj[field] && typeof safeObj[field] === 'string') {
      safeObj[field] = safeText(safeObj[field])
    }
  })
  
  // 处理数组字段
  if (Array.isArray(safeObj.features)) {
    safeObj.features = safeObj.features.map(feature => 
      typeof feature === 'string' ? safeText(feature) : feature
    )
  }
  
  if (Array.isArray(safeObj.care_instructions)) {
    safeObj.care_instructions = safeObj.care_instructions.map(instruction => 
      typeof instruction === 'string' ? safeText(instruction) : instruction
    )
  }
  
  // 处理FAQ
  if (Array.isArray(safeObj.faq)) {
    safeObj.faq = safeObj.faq.map(item => ({
      ...item,
      question: typeof item.question === 'string' ? safeText(item.question) : item.question,
      answer: typeof item.answer === 'string' ? safeText(item.answer) : item.answer
    }))
  }
  
  // 处理服务信息
  if (safeObj.services && Array.isArray(safeObj.services)) {
    safeObj.services = safeObj.services.map(service => ({
      ...service,
      name: typeof service.name === 'string' ? safeText(service.name) : service.name,
      description: typeof service.description === 'string' ? safeText(service.description) : service.description
    }))
  }
  
  return safeObj
}

/**
 * 报价对象敏感词过滤
 * @param {Object} quote - 报价对象
 * @returns {Object} - 过滤后的报价对象
 */
function safeQuote(quote) {
  if (!quote || typeof quote !== 'object') {
    return quote
  }
  
  const safeObj = { ...quote }
  
  // 处理breakdown中的文本
  if (safeObj.breakdown && Array.isArray(safeObj.breakdown)) {
    safeObj.breakdown = safeObj.breakdown.map(item => ({
      ...item,
      label: typeof item.label === 'string' ? safeText(item.label) : item.label,
      note: typeof item.note === 'string' ? safeText(item.note) : item.note
    }))
  }
  
  // 处理服务信息
  if (safeObj.services && Array.isArray(safeObj.services)) {
    safeObj.services = safeObj.services.map(service => ({
      ...service,
      name: typeof service.name === 'string' ? safeText(service.name) : service.name,
      description: typeof service.description === 'string' ? safeText(service.description) : service.description
    }))
  }
  
  // 处理配送信息
  if (safeObj.deliveryInfo && typeof safeObj.deliveryInfo === 'object') {
    const deliveryInfo = { ...safeObj.deliveryInfo }
    if (deliveryInfo.note) {
      deliveryInfo.note = safeText(deliveryInfo.note)
    }
    safeObj.deliveryInfo = deliveryInfo
  }
  
  return safeObj
}

/**
 * 批量处理数组中的对象
 * @param {Array} items - 对象数组
 * @param {Function} processor - 处理函数 (safeProduct 或 safeQuote)
 * @returns {Array} - 处理后的数组
 */
function safeBatch(items, processor = safeProduct) {
  if (!Array.isArray(items)) {
    return items
  }
  
  return items.map(item => processor(item))
}

module.exports = {
  safeText,
  safeProduct,
  safeQuote,
  safeBatch,
  SENSITIVE_WORDS_MAP
}