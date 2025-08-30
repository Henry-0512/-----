import Fastify from 'fastify'
import cors from '@fastify/cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: true
})

// 注册 CORS
await fastify.register(cors, {
  origin: true
})

// 加载种子数据
let skuData = []
try {
  const seedPath = path.join(__dirname, '../seed/sku.json')
  const data = await fs.readFile(seedPath, 'utf8')
  skuData = JSON.parse(data)
} catch (error) {
  console.warn('种子数据加载失败，使用空数据:', error.message)
}

// API 路由

// 获取筛选元数据
fastify.get('/api/filters/meta', async (request, reply) => {
  // 动态生成分类统计
  const categoryStats = {}
  const brandStats = {}
  const styleStats = {}
  
  skuData.forEach(sku => {
    // 统计分类（取第一个分类作为主分类）
    const mainCategory = sku.category[0]
    categoryStats[mainCategory] = (categoryStats[mainCategory] || 0) + 1
    
    // 统计品牌
    brandStats[sku.brand] = (brandStats[sku.brand] || 0) + 1
    
    // 统计风格
    sku.style.forEach(style => {
      styleStats[style] = (styleStats[style] || 0) + 1
    })
  })
  
  return {
    success: true,
    data: {
      categories: Object.entries(categoryStats).map(([id, count]) => ({
        id,
        name: getCategoryName(id),
        count
      })),
      priceRanges: [
        { id: 'low', name: '0-500元', min: 0, max: 500 },
        { id: 'mid', name: '500-1500元', min: 500, max: 1500 },
        { id: 'high', name: '1500-3000元', min: 1500, max: 3000 },
        { id: 'premium', name: '3000元以上', min: 3000, max: 999999 }
      ],
      brands: Object.entries(brandStats).map(([id, count]) => ({
        id,
        name: id,
        count
      })),
      styles: Object.entries(styleStats).map(([id, count]) => ({
        id,
        name: id,
        count
      }))
    }
  }
})

// 辅助函数：获取分类名称
function getCategoryName(categoryId) {
  const categoryNames = {
    '沙发': '沙发',
    '床': '床',
    '餐桌': '餐桌',
    '椅子': '椅子',
    '书桌': '书桌',
    '地毯': '地毯',
    '茶几': '茶几',
    '衣柜': '衣柜',
    '床垫': '床垫',
    '床头柜': '床头柜',
    '书架': '书架',
    '梳妆台': '梳妆台',
    '台灯': '台灯',
    '收纳': '收纳',
    '枕头': '枕头',
    '凳子': '凳子',
    '镜子': '镜子',
    '鞋柜': '鞋柜'
  }
  return categoryNames[categoryId] || categoryId
}

// 筛选商品
fastify.post('/api/filter', async (request, reply) => {
  const { 
    categories, 
    priceRange, 
    brands, 
    styles,
    page = 1,
    page_size = 10,
    sort = 'newest'
  } = request.body || {}
  
  let filteredData = [...skuData]
  
  // 按分类筛选
  if (categories && categories.length > 0) {
    filteredData = filteredData.filter(item => 
      item.category.some(cat => categories.includes(cat))
    )
  }
  
  // 按价格筛选
  if (priceRange) {
    filteredData = filteredData.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    )
  }
  
  // 按品牌筛选
  if (brands && brands.length > 0) {
    filteredData = filteredData.filter(item => 
      brands.includes(item.brand)
    )
  }
  
  // 按风格筛选
  if (styles && styles.length > 0) {
    filteredData = filteredData.filter(item => 
      item.style.some(style => styles.includes(style))
    )
  }
  
  // 排序处理
  switch (sort) {
    case 'price_asc':
      filteredData.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      filteredData.sort((a, b) => b.price - a.price)
      break
    case 'newest':
      // 按ID倒序（假设ID越大越新）
      filteredData.sort((a, b) => b.id.localeCompare(a.id))
      break
    default:
      // 默认综合排序（按价格和库存综合）
      filteredData.sort((a, b) => {
        const aStock = a.stock?.[0]?.qty || 0
        const bStock = b.stock?.[0]?.qty || 0
        return (bStock - aStock) || (a.price - b.price)
      })
  }
  
  // 分页处理
  const total = filteredData.length
  const totalPages = Math.ceil(total / page_size)
  const startIndex = (page - 1) * page_size
  const endIndex = startIndex + page_size
  const items = filteredData.slice(startIndex, endIndex)
  
  return {
    success: true,
    data: {
      items,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: totalPages,
      has_more: page < totalPages
    }
  }
})

// 搜索商品
fastify.get('/api/search', async (request, reply) => {
  const { 
    q, 
    page = 1, 
    page_size = 10,
    sort = 'newest'
  } = request.query
  
  let results = [...skuData]
  
  // 搜索筛选
  if (q) {
    const query = q.toLowerCase()
    results = results.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.category.some(cat => cat.toLowerCase().includes(query)) ||
      item.style.some(style => style.toLowerCase().includes(query)) ||
      item.material.some(mat => mat.toLowerCase().includes(query)) ||
      item.color.some(color => color.toLowerCase().includes(query)) ||
      item.care.toLowerCase().includes(query)
    )
  }
  
  // 排序处理
  switch (sort) {
    case 'price_asc':
      results.sort((a, b) => a.price - b.price)
      break
    case 'price_desc':
      results.sort((a, b) => b.price - a.price)
      break
    case 'newest':
      // 按ID倒序（假设ID越大越新）
      results.sort((a, b) => b.id.localeCompare(a.id))
      break
    default:
      // 默认综合排序（按相关度和价格）
      results.sort((a, b) => {
        const aStock = a.stock?.[0]?.qty || 0
        const bStock = b.stock?.[0]?.qty || 0
        return (bStock - aStock) || (a.price - b.price)
      })
  }
  
  // 分页处理
  const total = results.length
  const totalPages = Math.ceil(total / page_size)
  const startIndex = (page - 1) * page_size
  const endIndex = startIndex + parseInt(page_size)
  const items = results.slice(startIndex, endIndex)
  
  return {
    success: true,
    data: {
      items,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: totalPages,
      has_more: page < totalPages
    }
  }
})

// 获取单个 SKU 详情
fastify.get('/api/sku/:id', async (request, reply) => {
  const { id } = request.params
  const sku = skuData.find(item => item.id === id)
  
  if (!sku) {
    return reply.code(404).send({
      success: false,
      message: 'SKU 未找到'
    })
  }
  
  return {
    success: true,
    data: sku
  }
})

// 获取推荐商品
fastify.get('/api/sku/:id/recommendations', async (request, reply) => {
  const { id } = request.params
  const currentSku = skuData.find(item => item.id === id)
  
  if (!currentSku) {
    return reply.code(404).send({
      success: false,
      message: 'SKU 未找到'
    })
  }
  
  let recommendations = []
  
  // 优先使用bundle_suggestions
  if (currentSku.bundle_suggestions && currentSku.bundle_suggestions.length > 0) {
    recommendations = currentSku.bundle_suggestions
      .map(suggestedId => skuData.find(item => item.id === suggestedId))
      .filter(Boolean) // 过滤掉找不到的商品
  }
  
  // 如果推荐不够，补充同类别商品
  if (recommendations.length < 4) {
    const sameCategoryItems = skuData
      .filter(item => 
        item.id !== id && 
        !recommendations.some(rec => rec.id === item.id) &&
        item.category.some(cat => currentSku.category.includes(cat))
      )
      .slice(0, 4 - recommendations.length)
    
    recommendations = [...recommendations, ...sameCategoryItems]
  }
  
  return {
    success: true,
    data: recommendations.slice(0, 4)
  }
})

// 报价计算接口
fastify.post('/api/quote', async (request, reply) => {
  const { 
    skuId, 
    duration, 
    durationUnit = 'month',  // 'week' | 'month'
    quantity = 1,
    services = []  // 可选服务数组
  } = request.body || {}
  
  if (!skuId || !duration) {
    return reply.code(400).send({
      success: false,
      message: '缺少必要参数：skuId 和 duration'
    })
  }
  
  const sku = skuData.find(item => item.id === skuId)
  if (!sku) {
    return reply.code(404).send({
      success: false,
      message: 'SKU 未找到'
    })
  }
  
  // 基础单价计算
  const baseMonthlyPrice = Math.ceil(sku.price / 50)
  let unitPrice = baseMonthlyPrice
  
  // 周租价格调整（周租通常更贵）
  if (durationUnit === 'week') {
    unitPrice = Math.ceil(baseMonthlyPrice / 4 * 1.2) // 周租价格为月租的1.2倍/4
  }
  
  // 计算基础租金
  const baseRent = unitPrice * duration * quantity
  
  // 可选服务费用计算
  const serviceDefinitions = {
    'delivery': { name: '送货到门', price: 50 },
    'installation': { name: '白手套安装', price: 150 },
    'upstairs': { name: '上楼服务', price: 80 },
    'insurance': { name: '租赁保险', price: Math.ceil(baseRent * 0.02) } // 2%保险费
  }
  
  let serviceTotal = 0
  const selectedServices = services.map(serviceId => {
    const service = serviceDefinitions[serviceId]
    if (service) {
      serviceTotal += service.price
      return {
        id: serviceId,
        name: service.name,
        price: service.price
      }
    }
    return null
  }).filter(Boolean)
  
  // 押金计算（通常为1-2个月租金）
  const depositMonths = Math.min(duration, 2)
  const deposit = unitPrice * depositMonths * quantity
  
  // 折扣计算（长期租赁折扣）
  let discount = 0
  let discountReason = null
  if (durationUnit === 'month' && duration >= 12) {
    discount = Math.ceil(baseRent * 0.1) // 年租9折
    discountReason = '年租优惠10%'
  } else if (durationUnit === 'month' && duration >= 6) {
    discount = Math.ceil(baseRent * 0.05) // 半年租95折
    discountReason = '半年租优惠5%'
  }
  
  // 最终计算
  const totalRent = baseRent + serviceTotal - discount
  const grandTotal = totalRent + deposit
  
  return {
    success: true,
    data: {
      // 基础信息
      skuId,
      quantity,
      duration,
      durationUnit,
      
      // 价格明细
      breakdown: {
        // 基础费用
        unitPrice,
        unitPriceLabel: `单价（${durationUnit === 'week' ? '周' : '月'}租）`,
        baseRent,
        baseRentLabel: `基础租金（${unitPrice} × ${duration} × ${quantity}）`,
        
        // 服务费用
        services: selectedServices,
        serviceTotal,
        serviceTotalLabel: '增值服务费',
        
        // 优惠折扣
        discount,
        discountReason,
        
        // 押金
        deposit,
        depositReason: `${depositMonths}个${durationUnit === 'week' ? '周' : '月'}租金作为押金`,
        
        // 合计
        totalRent,
        totalRentLabel: '租金小计',
        grandTotal,
        grandTotalLabel: '总计（含押金）'
      },
      
      // 计算说明
      calculation: {
        formula: `基础租金 ${baseRent} + 服务费 ${serviceTotal} - 优惠 ${discount} + 押金 ${deposit} = ${grandTotal}`,
        note: '押金在租期结束后无损退还，租金按实际使用天数计算'
      }
    }
  }
})

// 创建意向订单
fastify.post('/api/intent-order', async (request, reply) => {
  const { skuId, duration, startDate, userInfo } = request.body || {}
  
  if (!skuId || !duration || !startDate) {
    return reply.code(400).send({
      success: false,
      message: '缺少必要参数'
    })
  }
  
  const sku = skuData.find(item => item.id === skuId)
  if (!sku) {
    return reply.code(404).send({
      success: false,
      message: 'SKU 未找到'
    })
  }
  
  const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 计算月租价格（假设按商品价格的1/50计算月租）
  const monthlyPrice = Math.ceil(sku.price / 50)
  
  return {
    success: true,
    data: {
      orderId,
      skuId,
      duration,
      startDate,
      monthlyPrice,
      totalAmount: monthlyPrice * duration,
      status: 'pending',
      createdAt: new Date().toISOString(),
      sku: {
        id: sku.id,
        title: sku.title,
        brand: sku.brand,
        image: sku.images[0]?.url || '',
        price: sku.price
      }
    }
  }
})

// 健康检查
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// 启动服务
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 API 服务已启动在 http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
