/**
 * 扩展SKU数据到60条的脚本
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 成色选项
const CONDITIONS = [
  { label: '全新', value: 'new', grade: 5, discount: 0 },
  { label: '九五新', value: '95_new', grade: 4, discount: 0.05 },
  { label: '九成新', value: '90_new', grade: 3, discount: 0.1 },
  { label: '八成新', value: '80_new', grade: 2, discount: 0.2 },
  { label: '七成新', value: '70_new', grade: 1, discount: 0.3 }
]

// 家具类别模板
const FURNITURE_TEMPLATES = [
  { category: '沙发', brands: ['HomeNest', 'ComfortLiving', 'SofaKing'], priceRange: [800, 3000] },
  { category: '床', brands: ['SleepWell', 'BedroomEssentials', 'DreamBed'], priceRange: [600, 2500] },
  { category: '餐桌', brands: ['DiningCraft', 'TableMaster', 'WoodWork'], priceRange: [400, 1800] },
  { category: '椅子', brands: ['ComfortSeats', 'ErgoTech', 'ChairCraft'], priceRange: [200, 800] },
  { category: '书桌', brands: ['StudySpace', 'WorkDesk', 'OfficeMax'], priceRange: [300, 1200] },
  { category: '茶几', brands: ['LivingLux', 'CoffeeTable', 'ModernHome'], priceRange: [250, 900] },
  { category: '衣柜', brands: ['StoragePlus', 'WardrobePro', 'ClosetMax'], priceRange: [800, 2800] },
  { category: '书架', brands: ['BookShelf', 'StudySpace', 'StorageWise'], priceRange: [300, 1000] }
]

function generateAdditionalSKUs(existingSKUs, targetCount = 60) {
  const additionalSKUs = []
  const startId = existingSKUs.length + 1
  
  for (let i = 0; i < (targetCount - existingSKUs.length); i++) {
    const template = FURNITURE_TEMPLATES[i % FURNITURE_TEMPLATES.length]
    const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]
    const basePrice = Math.floor(Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0])
    const finalPrice = Math.round(basePrice * (1 - condition.discount))
    
    const sku = {
      id: `sku_${template.category.toLowerCase()}_${String(startId + i).padStart(3, '0')}`,
      spu_id: `spu_${template.category.toLowerCase()}_${String(Math.floor((startId + i) / 3) + 1)}`,
      title: `${template.brands[i % template.brands.length]} ${template.category} ${(1.2 + Math.random() * 1.8).toFixed(1)}m`,
      brand: template.brands[i % template.brands.length],
      category: [template.category, '客厅'],
      primaryCategory: template.category,
      style: ['现代', '简约', '北欧'][Math.floor(Math.random() * 3)],
      material: getRandomMaterial(template.category),
      color: getRandomColor(),
      width_mm: Math.floor(1000 + Math.random() * 2000),
      depth_mm: Math.floor(400 + Math.random() * 1000),
      height_mm: Math.floor(300 + Math.random() * 1200),
      package: {
        width_mm: Math.floor(1050 + Math.random() * 2000),
        depth_mm: Math.floor(450 + Math.random() * 1000),
        height_mm: Math.floor(150 + Math.random() * 800),
        weight_kg: Math.floor(10 + Math.random() * 80)
      },
      price: finalPrice,
      originalPrice: basePrice,
      condition: condition,
      condition_grade: condition.grade,
      monthlyPrice: Math.ceil(finalPrice / 50),
      images: [
        { url: `https://picsum.photos/400/300?random=${1000 + i}`, type: 'main' }
      ],
      stock: [{ 
        location: 'Durham', 
        qty: Math.floor(1 + Math.random() * 20) 
      }],
      deliverable_cities: getRandomCities(),
      eta_days: Math.floor(1 + Math.random() * 7),
      features: getRandomFeatures(template.category),
      care: '请避免阳光直射，定期清洁保养',
      warranty: '1年质保，正常使用损耗免费维护',
      faq: [
        { question: '如何租赁这件家具？', answer: '选择租期和数量，提交订单即可' },
        { question: '配送范围是哪里？', answer: '目前支持Durham及周边地区' }
      ]
    }
    
    additionalSKUs.push(sku)
  }
  
  return additionalSKUs
}

function getRandomMaterial(category) {
  const materials = {
    '沙发': ['布艺', '皮质', '仿皮'],
    '床': ['实木', '金属', '板材'],
    '餐桌': ['实木', '玻璃', '大理石'],
    '椅子': ['布艺', '皮质', '塑料', '金属'],
    '书桌': ['实木', '板材', '钢木'],
    '茶几': ['实木', '玻璃', '大理石'],
    '衣柜': ['板材', '实木', '金属'],
    '书架': ['实木', '板材', '金属']
  }
  const categoryMaterials = materials[category] || ['实木', '板材']
  return [categoryMaterials[Math.floor(Math.random() * categoryMaterials.length)]]
}

function getRandomColor() {
  const colors = ['白', '黑', '灰', '棕', '米白', '原木', '深棕', '浅灰']
  return [colors[Math.floor(Math.random() * colors.length)]]
}

function getRandomCities() {
  return [
    { city: 'Durham', postcode: ['DH1'], deliverable: true, eta_days: [0, 1], region: 'primary' },
    { city: 'Newcastle', postcode: ['NE1'], deliverable: true, eta_days: [2, 3], region: 'secondary' }
  ]
}

function getRandomFeatures(category) {
  const features = {
    '沙发': ['舒适坐感', '耐磨面料', '可拆洗'],
    '床': ['静音设计', '承重强', '易组装'],
    '餐桌': ['防水台面', '稳固结构', '易清洁'],
    '椅子': ['人体工学', '透气材质', '可调节'],
    '书桌': ['大容量抽屉', '理线设计', '防刮花'],
    '茶几': ['储物空间', '圆角设计', '防撞'],
    '衣柜': ['大容量', '静音导轨', '防潮'],
    '书架': ['承重强', '可调层板', '稳固']
  }
  const categoryFeatures = features[category] || ['实用', '美观', '耐用']
  return categoryFeatures.slice(0, 2 + Math.floor(Math.random() * 2))
}

function expandSKUData() {
  const skuPath = path.join(__dirname, '../seed/sku.json')
  
  try {
    // 读取现有SKU数据
    const existingSKUs = JSON.parse(fs.readFileSync(skuPath, 'utf8'))
    console.log(`📦 当前SKU数量: ${existingSKUs.length}`)
    
    // 生成额外的SKU
    const additionalSKUs = generateAdditionalSKUs(existingSKUs, 60)
    console.log(`➕ 生成额外SKU: ${additionalSKUs.length}`)
    
    // 合并SKU数据
    const allSKUs = [...existingSKUs, ...additionalSKUs]
    
    // 写回文件
    fs.writeFileSync(skuPath, JSON.stringify(allSKUs, null, 2))
    
    console.log(`✅ SKU数据扩展完成，总计: ${allSKUs.length}条`)
    
    // 统计分类分布
    const categoryStats = {}
    allSKUs.forEach(sku => {
      const category = sku.primaryCategory || sku.category[0]
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })
    
    console.log('分类分布:')
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`)
    })
    
    // 统计成色分布
    const conditionStats = {}
    allSKUs.forEach(sku => {
      const condition = sku.condition?.label || '未知'
      conditionStats[condition] = (conditionStats[condition] || 0) + 1
    })
    
    console.log('成色分布:')
    Object.entries(conditionStats).forEach(([condition, count]) => {
      console.log(`  ${condition}: ${count}件`)
    })
    
    return allSKUs
    
  } catch (error) {
    console.error('❌ SKU数据扩展失败:', error)
    return null
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  expandSKUData()
}

export { expandSKUData }
