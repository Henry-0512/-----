// scripts/add-cities.js - 批量添加配送城市数据
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配送城市模板数据
const DELIVERABLE_CITIES_TEMPLATES = [
  // 一线城市（快速配送）
  [
    { "city": "北京", "postcode": ["100000", "101000", "102000"], "eta_days": [2,4] },
    { "city": "上海", "postcode": ["200000", "201000", "202000"], "eta_days": [2,4] },
    { "city": "广州", "postcode": ["510000", "511000", "512000"], "eta_days": [3,5] },
    { "city": "深圳", "postcode": ["518000", "518100", "518200"], "eta_days": [3,5] }
  ],
  // 二线城市（标准配送）
  [
    { "city": "杭州", "postcode": ["310000", "311000"], "eta_days": [4,6] },
    { "city": "南京", "postcode": ["210000", "211000"], "eta_days": [4,6] },
    { "city": "武汉", "postcode": ["430000", "431000"], "eta_days": [5,7] },
    { "city": "成都", "postcode": ["610000", "611000"], "eta_days": [5,7] },
    { "city": "西安", "postcode": ["710000", "711000"], "eta_days": [6,8] }
  ],
  // 三线城市（较慢配送）
  [
    { "city": "苏州", "postcode": ["215000"], "eta_days": [5,8] },
    { "city": "无锡", "postcode": ["214000"], "eta_days": [6,9] },
    { "city": "宁波", "postcode": ["315000"], "eta_days": [6,9] },
    { "city": "青岛", "postcode": ["266000"], "eta_days": [7,10] }
  ]
]

async function updateSkuData() {
  try {
    // 读取现有SKU数据
    const skuPath = path.join(__dirname, '../seed/sku.json')
    const data = await fs.readFile(skuPath, 'utf8')
    const skuData = JSON.parse(data)
    
    console.log(`开始更新 ${skuData.length} 个SKU的配送城市数据...`)
    
    // 为每个SKU添加deliverable_cities字段
    const updatedSkuData = skuData.map((sku, index) => {
      // 如果已经有deliverable_cities字段，跳过
      if (sku.deliverable_cities) {
        return sku
      }
      
      // 根据商品类型和价格选择配送范围
      let cities
      if (sku.price >= 5000) {
        // 高端商品：一线城市优先
        cities = DELIVERABLE_CITIES_TEMPLATES[0]
      } else if (sku.price >= 2000) {
        // 中端商品：一二线城市
        cities = [...DELIVERABLE_CITIES_TEMPLATES[0], ...DELIVERABLE_CITIES_TEMPLATES[1]]
      } else {
        // 普通商品：全覆盖
        cities = [...DELIVERABLE_CITIES_TEMPLATES[0], ...DELIVERABLE_CITIES_TEMPLATES[1], ...DELIVERABLE_CITIES_TEMPLATES[2]]
      }
      
      return {
        ...sku,
        deliverable_cities: cities
      }
    })
    
    // 写回文件
    await fs.writeFile(skuPath, JSON.stringify(updatedSkuData, null, 2), 'utf8')
    console.log('✅ SKU配送城市数据更新完成！')
    
    // 输出统计信息
    const stats = updatedSkuData.reduce((acc, sku) => {
      const cityCount = sku.deliverable_cities?.length || 0
      acc.total += cityCount
      acc.max = Math.max(acc.max, cityCount)
      acc.min = Math.min(acc.min, cityCount)
      return acc
    }, { total: 0, max: 0, min: Infinity })
    
    console.log(`📊 统计信息：`)
    console.log(`   总配送城市数：${stats.total}`)
    console.log(`   平均每SKU：${Math.round(stats.total / updatedSkuData.length)}个城市`)
    console.log(`   最多城市：${stats.max}个`)
    console.log(`   最少城市：${stats.min}个`)
    
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }
}

// 执行更新
updateSkuData()
