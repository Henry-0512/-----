// utils/safe-text.js - 敏感词过滤和文本安全处理工具

/**
 * 敏感词替换表
 * 用于在展示层统一处理敏感词汇，不影响真实数据存储
 */
const SENSITIVE_WORD_MAP = {
  // 配送相关
  '配送': '到家协助',
  '送货': '到家服务',
  '快递': '物流协助',
  '邮寄': '寄送服务',
  '运输': '物流运送',
  '发货': '商品寄出',
  
  // 租赁相关
  '租赁': '使用服务',
  '租金': '使用费',
  '押金': '服务保证金',
  '租期': '使用期限',
  '月租': '月度使用费',
  '周租': '周度使用费',
  
  // 商业相关
  '购买': '获取',
  '买卖': '交易',
  '销售': '提供',
  '价格': '费用',
  '优惠': '特惠',
  '折扣': '减免',
  
  // 服务相关
  '客服': '服务顾问',
  '售后': '后续服务',
  '退款': '费用退还',
  '维修': '维护服务',
  '保修': '保障服务',
  
  // 其他可能的敏感词
  '投诉': '意见反馈',
  '纠纷': '协商处理',
  '违约': '协议调整',
  '赔偿': '补偿服务'
}

/**
 * 特殊处理规则
 * 某些词汇需要根据上下文进行不同的处理
 */
const CONTEXT_RULES = {
  // 上下文相关的替换
  contextReplacements: [
    {
      pattern: /配送到(.+)/g,
      replacement: '到家协助送至$1'
    },
    {
      pattern: /(\d+)天配送/g,
      replacement: '$1天到家协助'
    },
    {
      pattern: /免费配送/g,
      replacement: '免费到家协助'
    }
  ],
  
  // 保护词汇（不进行替换的词汇）
  protectedWords: [
    '家具', '沙发', '床', '桌子', '椅子', // 商品名称
    '北京', '上海', '广州', '深圳',     // 城市名称
    'Durham', 'Newcastle', 'London'     // 英文城市名
  ]
}

/**
 * 安全文本处理器
 */
class SafeTextProcessor {
  constructor() {
    this.enabled = true
    this.wordMap = { ...SENSITIVE_WORD_MAP }
    this.contextRules = { ...CONTEXT_RULES }
  }

  /**
   * 处理单个文本
   * @param {string} text 原始文本
   * @param {Object} options 处理选项
   * @returns {string} 处理后的文本
   */
  process(text, options = {}) {
    if (!this.enabled || !text || typeof text !== 'string') {
      return text
    }

    let processedText = text

    try {
      // 1. 检查保护词汇
      const hasProtectedWords = this.contextRules.protectedWords.some(word => 
        processedText.includes(word)
      )

      // 2. 应用上下文规则
      if (!hasProtectedWords || !options.skipContext) {
        this.contextRules.contextReplacements.forEach(rule => {
          processedText = processedText.replace(rule.pattern, rule.replacement)
        })
      }

      // 3. 应用敏感词替换
      Object.entries(this.wordMap).forEach(([sensitive, safe]) => {
        // 避免替换保护词汇中包含的敏感词
        if (!hasProtectedWords || !this.isInProtectedContext(processedText, sensitive)) {
          const regex = new RegExp(sensitive, 'g')
          processedText = processedText.replace(regex, safe)
        }
      })

      return processedText

    } catch (error) {
      console.warn('文本安全处理失败:', error)
      return text // 失败时返回原文本
    }
  }

  /**
   * 批量处理对象中的文本字段
   * @param {Object} obj 包含文本的对象
   * @param {Array} fields 需要处理的字段名数组
   * @returns {Object} 处理后的对象
   */
  processObject(obj, fields = []) {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    const processed = { ...obj }

    fields.forEach(field => {
      if (processed[field] && typeof processed[field] === 'string') {
        processed[field] = this.process(processed[field])
      }
    })

    return processed
  }

  /**
   * 处理数组中的对象
   * @param {Array} array 对象数组
   * @param {Array} fields 需要处理的字段名数组
   * @returns {Array} 处理后的数组
   */
  processArray(array, fields = []) {
    if (!Array.isArray(array)) {
      return array
    }

    return array.map(item => this.processObject(item, fields))
  }

  /**
   * 检查是否在保护词汇的上下文中
   * @param {string} text 文本
   * @param {string} sensitive 敏感词
   * @returns {boolean} 是否在保护上下文中
   */
  isInProtectedContext(text, sensitive) {
    return this.contextRules.protectedWords.some(protected => {
      const protectedIndex = text.indexOf(protected)
      const sensitiveIndex = text.indexOf(sensitive)
      
      // 如果保护词汇和敏感词距离很近，则不替换
      return protectedIndex !== -1 && sensitiveIndex !== -1 && 
             Math.abs(protectedIndex - sensitiveIndex) < 10
    })
  }

  /**
   * 添加敏感词
   * @param {string} sensitive 敏感词
   * @param {string} safe 安全替换词
   */
  addSensitiveWord(sensitive, safe) {
    this.wordMap[sensitive] = safe
  }

  /**
   * 移除敏感词
   * @param {string} sensitive 敏感词
   */
  removeSensitiveWord(sensitive) {
    delete this.wordMap[sensitive]
  }

  /**
   * 启用/禁用安全文本处理
   * @param {boolean} enabled 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * 获取当前敏感词列表
   * @returns {Object} 敏感词映射表
   */
  getSensitiveWords() {
    return { ...this.wordMap }
  }
}

// 创建全局安全文本处理器实例
const safeTextProcessor = new SafeTextProcessor()

/**
 * 快捷方法：处理单个文本
 * @param {string} text 原始文本
 * @param {Object} options 处理选项
 * @returns {string} 安全文本
 */
const safeText = (text, options = {}) => {
  return safeTextProcessor.process(text, options)
}

/**
 * 快捷方法：处理商品对象
 * @param {Object} product 商品对象
 * @returns {Object} 处理后的商品对象
 */
const safeProduct = (product) => {
  if (!product) return product

  const textFields = ['title', 'brand', 'care', 'name']
  const processed = safeTextProcessor.processObject(product, textFields)

  // 处理嵌套的配送信息
  if (processed.delivery && processed.delivery.modes) {
    processed.delivery.modes = processed.delivery.modes.map(mode => safeText(mode))
  }

  // 处理FAQ
  if (processed.faq && Array.isArray(processed.faq)) {
    processed.faq = processed.faq.map(item => ({
      ...item,
      q: safeText(item.q),
      a: safeText(item.a)
    }))
  }

  return processed
}

/**
 * 快捷方法：处理商品列表
 * @param {Array} products 商品列表
 * @returns {Array} 处理后的商品列表
 */
const safeProductList = (products) => {
  if (!Array.isArray(products)) return products
  return products.map(product => safeProduct(product))
}

/**
 * 快捷方法：处理报价信息
 * @param {Object} quoteData 报价数据
 * @returns {Object} 处理后的报价数据
 */
const safeQuote = (quoteData) => {
  if (!quoteData || !quoteData.breakdown) return quoteData

  const processed = { ...quoteData }
  
  // 处理标签文本
  const labelFields = [
    'unitPriceLabel', 'baseRentLabel', 'serviceTotalLabel', 
    'depositReason', 'totalRentLabel', 'grandTotalLabel'
  ]
  
  processed.breakdown = safeTextProcessor.processObject(processed.breakdown, labelFields)
  
  // 处理服务名称
  if (processed.breakdown.services) {
    processed.breakdown.services = processed.breakdown.services.map(service => ({
      ...service,
      name: safeText(service.name)
    }))
  }

  // 处理计算说明
  if (processed.calculation) {
    processed.calculation = {
      ...processed.calculation,
      note: safeText(processed.calculation.note),
      formula: safeText(processed.calculation.formula)
    }
  }

  return processed
}

// 调试信息
const { isDev } = require('../config/env.js')
if (isDev()) {
  console.log('📝 敏感词过滤系统已启用')
  console.log('敏感词数量:', Object.keys(SENSITIVE_WORD_MAP).length)
}

module.exports = {
  safeText,
  safeProduct,
  safeProductList,
  safeQuote,
  safeTextProcessor,
  SENSITIVE_WORD_MAP,
  CONTEXT_RULES
}
