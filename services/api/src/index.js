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
  return {
    success: true,
    data: {
      categories: [
        { id: 'sofa', name: '沙发', count: 5 },
        { id: 'chair', name: '椅子', count: 8 },
        { id: 'table', name: '桌子', count: 4 },
        { id: 'bed', name: '床', count: 3 }
      ],
      priceRanges: [
        { id: 'low', name: '100-300元/月', min: 100, max: 300 },
        { id: 'mid', name: '300-600元/月', min: 300, max: 600 },
        { id: 'high', name: '600-1000元/月', min: 600, max: 1000 }
      ],
      brands: [
        { id: 'ikea', name: 'IKEA' },
        { id: 'muji', name: '无印良品' },
        { id: 'hm', name: 'H&M Home' }
      ]
    }
  }
})

// 筛选商品
fastify.post('/api/filter', async (request, reply) => {
  const { categories, priceRange, brands } = request.body || {}
  
  let filteredData = [...skuData]
  
  if (categories && categories.length > 0) {
    filteredData = filteredData.filter(item => 
      categories.includes(item.category)
    )
  }
  
  if (priceRange) {
    filteredData = filteredData.filter(item => 
      item.monthlyPrice >= priceRange.min && item.monthlyPrice <= priceRange.max
    )
  }
  
  if (brands && brands.length > 0) {
    filteredData = filteredData.filter(item => 
      brands.includes(item.brand)
    )
  }
  
  return {
    success: true,
    data: {
      items: filteredData,
      total: filteredData.length
    }
  }
})

// 搜索商品
fastify.get('/api/search', async (request, reply) => {
  const { q, page = 1, limit = 10 } = request.query
  
  let results = [...skuData]
  
  if (q) {
    const query = q.toLowerCase()
    results = results.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    )
  }
  
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedResults = results.slice(startIndex, endIndex)
  
  return {
    success: true,
    data: {
      items: paginatedResults,
      total: results.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(results.length / limit)
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
  
  // 简单推荐逻辑：同类别的其他商品
  const recommendations = skuData
    .filter(item => item.id !== id && item.category === currentSku.category)
    .slice(0, 4)
  
  return {
    success: true,
    data: recommendations
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
  
  return {
    success: true,
    data: {
      orderId,
      skuId,
      duration,
      startDate,
      totalAmount: sku.monthlyPrice * duration,
      status: 'pending',
      createdAt: new Date().toISOString()
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
