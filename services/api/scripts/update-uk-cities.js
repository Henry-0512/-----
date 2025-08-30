// scripts/update-uk-cities.js - 更新为英国城市配送数据
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 英国城市配送配置
const UK_CITIES_CONFIG = [
  // 主要服务区域（Durham及周边）
  { 
    city: "Durham", 
    postcode: ["DH1", "DH2", "DH3"], 
    deliverable: true, 
    eta_days: [0, 1],
    region: "primary"
  },
  { 
    city: "Newcastle", 
    postcode: ["NE1", "NE2", "NE3"], 
    deliverable: true, 
    eta_days: [2, 3],
    region: "secondary"
  },
  { 
    city: "Sunderland", 
    postcode: ["SR1", "SR2", "SR3"], 
    deliverable: true, 
    eta_days: [2, 3],
    region: "secondary"
  },
  
  // 暂不支持的城市
  { 
    city: "Manchester", 
    postcode: ["M1", "M2", "M3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "London", 
    postcode: ["E1", "W1", "SW1"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Birmingham", 
    postcode: ["B1", "B2", "B3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Leeds", 
    postcode: ["LS1", "LS2", "LS3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Sheffield", 
    postcode: ["S1", "S2", "S3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Liverpool", 
    postcode: ["L1", "L2", "L3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Nottingham", 
    postcode: ["NG1", "NG2", "NG3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Cambridge", 
    postcode: ["CB1", "CB2", "CB3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Oxford", 
    postcode: ["OX1", "OX2", "OX3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  },
  { 
    city: "Edinburgh", 
    postcode: ["EH1", "EH2", "EH3"], 
    deliverable: false, 
    eta_days: null,
    region: "future"
  }
]

async function updateUKCities() {
  try {
    // 读取现有SKU数据
    const skuPath = path.join(__dirname, '../seed/sku.json')
    const data = await fs.readFile(skuPath, 'utf8')
    const skuData = JSON.parse(data)
    
    console.log(`开始更新 ${skuData.length} 个SKU的英国城市配送数据...`)
    
    // 为每个SKU更新deliverable_cities字段
    const updatedSkuData = skuData.map((sku, index) => {
      // 根据商品价格和类型确定配送范围
      let availableCities
      
      if (sku.price >= 5000) {
        // 高端商品：仅Durham（避免运输风险）
        availableCities = UK_CITIES_CONFIG.filter(city => city.city === 'Durham')
      } else if (sku.price >= 2000) {
        // 中端商品：Durham + 周边
        availableCities = UK_CITIES_CONFIG.filter(city => 
          city.region === 'primary' || city.region === 'secondary'
        )
      } else {
        // 普通商品：Durham + 周边（同中端）
        availableCities = UK_CITIES_CONFIG.filter(city => 
          city.region === 'primary' || city.region === 'secondary'
        )
      }
      
      return {
        ...sku,
        deliverable_cities: availableCities.map(city => ({
          city: city.city,
          postcode: city.postcode,
          deliverable: city.deliverable,
          eta_days: city.eta_days,
          region: city.region
        }))
      }
    })
    
    // 写回文件
    await fs.writeFile(skuPath, JSON.stringify(updatedSkuData, null, 2), 'utf8')
    console.log('✅ 英国城市配送数据更新完成！')
    
    // 输出统计信息
    const stats = {
      durham: 0,
      newcastle_sunderland: 0,
      total_deliverable: 0
    }
    
    updatedSkuData.forEach(sku => {
      const deliverableCities = sku.deliverable_cities.filter(city => city.deliverable)
      stats.total_deliverable += deliverableCities.length
      
      if (deliverableCities.some(city => city.city === 'Durham')) {
        stats.durham++
      }
      if (deliverableCities.some(city => ['Newcastle', 'Sunderland'].includes(city.city))) {
        stats.newcastle_sunderland++
      }
    })
    
    console.log(`📊 配送统计：`)
    console.log(`   支持Durham配送的商品：${stats.durham}个`)
    console.log(`   支持Newcastle/Sunderland配送的商品：${stats.newcastle_sunderland}个`)
    console.log(`   平均每SKU可配送城市：${Math.round(stats.total_deliverable / updatedSkuData.length)}个`)
    
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }
}

// 执行更新
updateUKCities()
