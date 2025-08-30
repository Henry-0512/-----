/**
 * 将SKU数据转换为英镑体系的脚本
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 汇率和配置
const CONFIG = {
  CNY_TO_GBP: 0.11, // 人民币转英镑汇率（约1:9）
  MONTHLY_RATE: 0.02, // 月租费率2%
  MIN_MONTHLY_RENT: 8 // 最低月租£8
}

function convertToGBP() {
  const skuPath = path.join(__dirname, '../seed/sku.json')
  
  try {
    // 读取现有SKU数据
    const skuData = JSON.parse(fs.readFileSync(skuPath, 'utf8'))
    console.log(`💷 开始转换 ${skuData.length} 个SKU到英镑体系...`)
    
    // 转换每个SKU
    const convertedSKUs = skuData.map(sku => {
      // 转换买断价格为英镑
      const purchasePriceGBP = Math.round((sku.price || 0) * CONFIG.CNY_TO_GBP)
      
      // 计算月租价格
      const calculatedRent = Math.round(purchasePriceGBP * CONFIG.MONTHLY_RATE)
      const rentMonthlyGBP = Math.max(CONFIG.MIN_MONTHLY_RENT, calculatedRent)
      
      return {
        ...sku,
        // 英镑价格字段
        purchase_price_gbp: purchasePriceGBP,
        rent_monthly_gbp: rentMonthlyGBP,
        
        // 保留原字段兼容性
        price: sku.price, // 保留原人民币价格
        monthlyPrice: sku.monthlyPrice, // 保留原月租金
        
        // 货币信息
        currency: 'GBP',
        rent_rate: CONFIG.MONTHLY_RATE
      }
    })
    
    // 统计价格范围
    const rentPrices = convertedSKUs.map(sku => sku.rent_monthly_gbp)
    const purchasePrices = convertedSKUs.map(sku => sku.purchase_price_gbp)
    
    const priceStats = {
      rent_monthly: {
        min: Math.min(...rentPrices),
        max: Math.max(...rentPrices),
        avg: Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
      },
      purchase: {
        min: Math.min(...purchasePrices),
        max: Math.max(...purchasePrices),
        avg: Math.round(purchasePrices.reduce((a, b) => a + b, 0) / purchasePrices.length)
      }
    }
    
    // 写回文件
    fs.writeFileSync(skuPath, JSON.stringify(convertedSKUs, null, 2))
    
    console.log(`✅ 英镑转换完成！`)
    console.log('价格统计:')
    console.log(`  月租价范围: £${priceStats.rent_monthly.min} - £${priceStats.rent_monthly.max}`)
    console.log(`  买断价范围: £${priceStats.purchase.min} - £${priceStats.purchase.max}`)
    console.log(`  平均月租: £${priceStats.rent_monthly.avg}`)
    
    return { convertedSKUs, priceStats }
    
  } catch (error) {
    console.error('❌ 英镑转换失败:', error)
    return null
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  convertToGBP()
}

export { convertToGBP }
