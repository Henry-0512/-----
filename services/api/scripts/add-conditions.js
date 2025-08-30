/**
 * 为所有SKU添加成色数据的脚本
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 成色选项
const CONDITIONS = [
  { label: '全新', value: 'new', discount: 0 },
  { label: '九五新', value: '95_new', discount: 0.05 },
  { label: '九成新', value: '90_new', discount: 0.1 },
  { label: '八成新', value: '80_new', discount: 0.2 }
]

function addConditionsToSKU() {
  const skuPath = path.join(__dirname, '../seed/sku.json')
  
  try {
    // 读取现有SKU数据
    const skuData = JSON.parse(fs.readFileSync(skuPath, 'utf8'))
    
    // 为每个SKU添加成色信息
    const updatedSKU = skuData.map(sku => {
      // 随机选择一个成色
      const randomCondition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
      
      return {
        ...sku,
        condition: randomCondition,
        // 根据成色调整价格
        originalPrice: sku.price,
        price: Math.round(sku.price * (1 - randomCondition.discount))
      }
    })
    
    // 写回文件
    fs.writeFileSync(skuPath, JSON.stringify(updatedSKU, null, 2))
    
    console.log(`✅ 成功为 ${updatedSKU.length} 个SKU添加成色信息`)
    console.log('成色分布:')
    
    const conditionCounts = {}
    updatedSKU.forEach(sku => {
      const label = sku.condition.label
      conditionCounts[label] = (conditionCounts[label] || 0) + 1
    })
    
    Object.entries(conditionCounts).forEach(([label, count]) => {
      console.log(`  ${label}: ${count}件`)
    })
    
  } catch (error) {
    console.error('❌ 添加成色信息失败:', error)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  addConditionsToSKU()
}

export { addConditionsToSKU }
