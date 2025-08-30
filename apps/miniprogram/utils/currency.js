/**
 * 货币格式化工具 - 英镑体系
 */

/**
 * 格式化英镑价格
 * @param {number} value - 价格数值
 * @returns {string} - 格式化后的英镑价格
 */
export const gbp = (value) => {
  const num = Number(value) || 0
  return `£${num.toLocaleString('en-GB')}`
}

/**
 * 格式化月租价格
 * @param {number} value - 月租价格数值
 * @returns {string} - 格式化后的月租价格
 */
export const perMonth = (value) => {
  const num = Number(value) || 0
  return `${gbp(num)}/mo`
}

/**
 * 计算月租价格
 * @param {number} purchasePrice - 买断价格
 * @param {number} rate - 月租费率，默认2%
 * @param {number} minRent - 最低月租，默认£8
 * @returns {number} - 计算后的月租价格
 */
export const calculateMonthlyRent = (purchasePrice, rate = 0.02, minRent = 8) => {
  const calculatedRent = Math.round(purchasePrice * rate)
  return Math.max(minRent, calculatedRent)
}

/**
 * 价格显示配置
 */
export const PRICE_CONFIG = {
  CURRENCY: 'GBP',
  SYMBOL: '£',
  MONTHLY_RATE: 0.02, // 2%/月
  MIN_MONTHLY_RENT: 8, // 最低月租£8
  LOCALE: 'en-GB'
}

// CommonJS导出（兼容小程序）
module.exports = {
  gbp,
  perMonth,
  calculateMonthlyRent,
  PRICE_CONFIG
}
