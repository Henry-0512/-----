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

// 意向订单数据管理
const INTENT_ORDERS_FILE = path.join(__dirname, '../data/intent-orders.json')
const TRACKING_LOG_FILE = path.join(__dirname, '../data/tracking-logs.json')
const ADMIN_TOKEN = 'furniture_admin_2024'  // 管理员访问令牌

// WeChat订阅消息相关配置（通过环境变量注入）
const WX_APPID = process.env.WX_APPID || ''
const WX_SECRET = process.env.WX_SECRET || ''
const WX_TEMPLATE_INTENT = process.env.WX_TEMPLATE_INTENT || ''
let WX_ACCESS_TOKEN = ''
let WX_TOKEN_EXPIRES_AT = 0

// 管理员通知通道（任选其一或多个）
const SERVERCHAN_SENDKEY = process.env.SERVERCHAN_SENDKEY || '' // Server酱SendKey：sctapi.ftqq.com
const PUSHPLUS_TOKEN = process.env.PUSHPLUS_TOKEN || ''         // PushPlus token
const WECHAT_WORK_WEBHOOK = process.env.WECHAT_WORK_WEBHOOK || '' // 企业微信群机器人 webhook

async function getWechatAccessToken() {
  const now = Date.now()
  if (WX_ACCESS_TOKEN && WX_TOKEN_EXPIRES_AT - now > 60_000) {
    return WX_ACCESS_TOKEN
  }
  if (!WX_APPID || !WX_SECRET) {
    console.warn('[WeChat] 缺少 WX_APPID/WX_SECRET，跳过获取 access_token')
    return ''
  }
  try {
    const resp = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`)
    const data = await resp.json()
    if (data.access_token) {
      WX_ACCESS_TOKEN = data.access_token
      WX_TOKEN_EXPIRES_AT = Date.now() + (data.expires_in || 7000) * 1000
      return WX_ACCESS_TOKEN
    }
    console.error('[WeChat] 获取access_token失败:', data)
    return ''
  } catch (e) {
    console.error('[WeChat] 获取access_token异常:', e)
    return ''
  }
}

async function sendSubscribeMessage({ openid, template_id, page = 'pages/intent/success', data = {} }) {
  try {
    if (!openid || !(template_id || WX_TEMPLATE_INTENT)) {
      console.warn('[WeChat] openid或template_id缺失，跳过发送订阅消息')
      return { ok: false, skipped: true }
    }
    const token = await getWechatAccessToken()
    if (!token) return { ok: false, skipped: true }
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`
    const payload = {
      touser: openid,
      template_id: template_id || WX_TEMPLATE_INTENT,
      page,
      data
    }
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const resData = await resp.json()
    if (resData.errcode === 0) {
      console.log('[WeChat] 订阅消息发送成功:', { openid: openid?.slice(-6), template: payload.template_id })
      return { ok: true }
    }
    console.error('[WeChat] 订阅消息发送失败:', resData)
    return { ok: false, error: resData }
  } catch (e) {
    console.error('[WeChat] 订阅消息发送异常:', e)
    return { ok: false, error: e }
  }
}

// 统一管理员通知
async function notifyAdminOrder(savedOrder) {
  try {
    const title = '[新意向单] ' + (savedOrder?.sku?.title || (savedOrder?.items?.[0]?.title) || '未知商品')
    const totalItems = savedOrder?.items ? savedOrder.items.reduce((s,i)=> s + (i.qty||1), 0) : (savedOrder?.quantity || 1)
    const lines = []
    if (savedOrder.type === 'intent_list' && Array.isArray(savedOrder.items)) {
      lines.push('清单：')
      savedOrder.items.slice(0,5).forEach((it, idx) => {
        lines.push(`${idx+1}. ${it.title || it.sku_id} × ${it.qty||1}`)
      })
      if (savedOrder.items.length > 5) lines.push(`… 共 ${savedOrder.items.length} 项`)
    } else if (savedOrder.sku) {
      lines.push(`商品：${savedOrder.sku.title}`)
      lines.push(`数量：${savedOrder.quantity || 1}`)
      lines.push(`租期：${savedOrder.duration || '-'} ${savedOrder.durationUnit || ''}`)
    }
    lines.push(`用户：${(savedOrder.openid || '').slice(-8)}`)
    if (savedOrder.contact) {
      const { name, phone, wechat, email, preferred } = savedOrder.contact
      lines.push(`称呼：${name || '-'}`)
      lines.push(`手机：${phone || '-'}`)
      lines.push(`微信：${wechat || '-'}`)
      lines.push(`邮箱：${email || '-'}`)
      if (preferred) lines.push(`偏好联系：${preferred}`)
    }
    lines.push(`时间：${new Date().toLocaleString()}`)
    const md = lines.join('\n')

    // 1) Server酱
    if (SERVERCHAN_SENDKEY) {
      try {
        await fetch(`https://sctapi.ftqq.com/${SERVERCHAN_SENDKEY}.send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: new URLSearchParams({ title, desp: md })
        })
      } catch (e) { console.error('[AdminPush][ServerChan] 失败:', e) }
    }

    // 2) PushPlus
    if (PUSHPLUS_TOKEN) {
      try {
        await fetch('https://www.pushplus.plus/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: PUSHPLUS_TOKEN, title, content: md, template: 'markdown' })
        })
      } catch (e) { console.error('[AdminPush][PushPlus] 失败:', e) }
    }

    // 3) 企业微信机器人
    if (WECHAT_WORK_WEBHOOK) {
      try {
        await fetch(WECHAT_WORK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msgtype: 'markdown', markdown: { content: `**${title}**\n${md}` } })
        })
      } catch (e) { console.error('[AdminPush][WeCom] 失败:', e) }
    }
  } catch (e) {
    console.error('[AdminPush] 异常:', e)
  }
}

/**
 * 读取意向订单数据
 */
async function readIntentOrders() {
  try {
    const data = await fs.readFile(INTENT_ORDERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // 文件不存在时返回空数组
    return []
  }
}

/**
 * 写入意向订单数据
 */
async function writeIntentOrders(orders) {
  try {
    await fs.writeFile(INTENT_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('写入意向订单失败:', error)
    return false
  }
}

/**
 * 添加新的意向订单
 */
async function addIntentOrder(orderData) {
  try {
    const orders = await readIntentOrders()
    const newOrder = {
      ...orderData,
      id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    orders.push(newOrder)
    await writeIntentOrders(orders)
    return newOrder
  } catch (error) {
    console.error('添加意向订单失败:', error)
    throw error
  }
}

/**
 * 读取追踪日志
 */
async function readTrackingLogs() {
  try {
    const data = await fs.readFile(TRACKING_LOG_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // 文件不存在时返回空数组
    return []
  }
}

/**
 * 写入追踪日志
 */
async function writeTrackingLogs(logs) {
  try {
    await fs.writeFile(TRACKING_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('写入追踪日志失败:', error)
    return false
  }
}

/**
 * 添加追踪记录
 */
async function addTrackingRecord(trackData) {
  try {
    const logs = await readTrackingLogs()
    const newRecord = {
      ...trackData,
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0] // 便于按日期分析
    }
    
    logs.push(newRecord)
    await writeTrackingLogs(logs)
    return newRecord
  } catch (error) {
    console.error('添加追踪记录失败:', error)
    throw error
  }
}

// API 路由

// 微信登录认证接口
fastify.post('/api/auth/code2session', async (request, reply) => {
  const { code, appid = 'demo_appid', secret = 'demo_secret' } = request.body || {}
  
  if (!code) {
    return reply.code(400).send({
      success: false,
      message: '缺少必要参数：code'
    })
  }
  
  try {
    // 模拟微信code2session接口
    // 在真实环境中，这里应该调用微信官方接口
    // const wechatRes = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
    
    // 模拟返回数据
    const mockOpenid = `mock_openid_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const mockSessionKey = `mock_session_${Date.now()}`
    
    // 模拟微信接口响应
    const sessionData = {
      openid: mockOpenid,
      session_key: mockSessionKey,
      unionid: null, // 可选，如果用户绑定了开放平台
      errcode: 0,
      errmsg: 'ok'
    }
    
    // 记录用户登录信息（可选）
    const loginRecord = {
      openid: mockOpenid,
      code,
      loginTime: new Date().toISOString(),
      clientInfo: {
        userAgent: request.headers['user-agent'] || '',
        ip: request.ip || ''
      }
    }
    
    console.log('用户登录:', loginRecord)
    
    return {
      success: true,
      data: {
        openid: sessionData.openid,
        session_key: sessionData.session_key,
        unionid: sessionData.unionid,
        // 额外的用户信息
        userInfo: {
          isNewUser: true, // 可以根据openid查询数据库判断
          loginTime: loginRecord.loginTime
        }
      }
    }
  } catch (error) {
    console.error('code2session失败:', error)
    return reply.code(500).send({
      success: false,
      message: '登录认证失败，请稍后重试'
    })
  }
})

// 用户行为追踪接口
fastify.post('/api/track', async (request, reply) => {
  const { 
    event, 
    payload = {},
    openid = '',
    sessionId = '',
    timestamp = new Date().toISOString()
  } = request.body || {}
  
  if (!event) {
    return reply.code(400).send({
      success: false,
      message: '缺少必要参数：event'
    })
  }
  
  try {
    // 构建追踪数据
    const trackData = {
      event,
      payload,
      openid,
      sessionId,
      userTimestamp: timestamp,
      clientInfo: {
        userAgent: request.headers['user-agent'] || '',
        ip: request.ip || '',
        referer: request.headers['referer'] || ''
      }
    }
    
    // 写入追踪日志
    const savedRecord = await addTrackingRecord(trackData)
    
    // 控制台输出（便于开发调试）
    console.log(`📊 [${event}]`, {
      openid: openid ? openid.substr(-8) : 'anonymous',
      payload,
      timestamp: savedRecord.timestamp
    })
    
    return {
      success: true,
      data: {
        trackId: savedRecord.id,
        message: '追踪记录已保存'
      }
    }
  } catch (error) {
    console.error('追踪记录失败:', error)
    return reply.code(500).send({
      success: false,
      message: '追踪记录失败'
    })
  }
})

// 获取筛选元数据
fastify.get('/api/filters/meta', async (request, reply) => {
  // 动态生成分类统计
  const categoryStats = {}
  const brandStats = {}
  const styleStats = {}
  
  // 统计可配送城市（包含不可配送的城市）
  const cityStats = {}
  const allCities = new Set()
  
  skuData.forEach(sku => {
    // 统计分类（取第一个分类作为主分类）
    const categories = Array.isArray(sku?.category)
      ? sku.category
      : (sku?.category ? [sku.category] : [])
    const mainCategory = categories[0]
    if (mainCategory) {
      categoryStats[mainCategory] = (categoryStats[mainCategory] || 0) + 1
    }
    
    // 统计品牌
    const brand = sku?.brand || '未知品牌'
    brandStats[brand] = (brandStats[brand] || 0) + 1
    
    // 统计风格
    const styles = Array.isArray(sku?.style)
      ? sku.style
      : (sku?.style ? [sku.style] : [])
    styles.forEach(style => {
      if (!style) return
      styleStats[style] = (styleStats[style] || 0) + 1
    })
    
    // 收集所有城市信息
    if (sku.deliverable_cities) {
      sku.deliverable_cities.forEach(cityInfo => {
        allCities.add(JSON.stringify({
          city: cityInfo.city,
          deliverable: cityInfo.deliverable,
          eta_days: cityInfo.eta_days,
          region: cityInfo.region
        }))
        
        // 只统计可配送的城市
        if (cityInfo.deliverable) {
          cityStats[cityInfo.city] = (cityStats[cityInfo.city] || 0) + 1
        }
      })
    }
  })
  
  // 处理城市列表，包含配送状态
  const citiesWithStatus = Array.from(allCities).map(cityStr => {
    const cityInfo = JSON.parse(cityStr)
    return {
      id: cityInfo.city,
      name: cityInfo.city,
      deliverable: cityInfo.deliverable,
      eta_days: cityInfo.eta_days,
      region: cityInfo.region,
      count: cityStats[cityInfo.city] || 0
    }
  }).sort((a, b) => {
    // 排序：可配送的在前，按region排序
    if (a.deliverable && !b.deliverable) return -1
    if (!a.deliverable && b.deliverable) return 1
    if (a.region === 'primary') return -1
    if (b.region === 'primary') return 1
    return a.name.localeCompare(b.name)
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
      })),
      cities: citiesWithStatus
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
    cities,     // 可配送城市筛选
    page = 1,
    page_size = 10,
    sort = 'newest'
  } = request.body || {}
  
  let filteredData = [...skuData]
  
  // 按分类筛选
  if (categories && categories.length > 0) {
    filteredData = filteredData.filter(item => {
      const itemCats = Array.isArray(item?.category) ? item.category : (item?.category ? [item.category] : [])
      return itemCats.some(cat => categories.includes(cat))
    })
  }
  
  // 按价格筛选
  if (priceRange) {
    filteredData = filteredData.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    )
  }
  
  // 按品牌筛选
  if (brands && brands.length > 0) {
    filteredData = filteredData.filter(item => brands.includes(item?.brand || ''))
  }
  
  // 按风格筛选
  if (styles && styles.length > 0) {
    filteredData = filteredData.filter(item => {
      const itemStyles = Array.isArray(item?.style) ? item.style : (item?.style ? [item.style] : [])
      return itemStyles.some(style => styles.includes(style))
    })
  }
  
  // 按可配送城市筛选
  if (cities && cities.length > 0) {
    filteredData = filteredData.filter(item => 
      item.deliverable_cities && 
      item.deliverable_cities.some(cityInfo => cities.includes(cityInfo.city))
    )
  }
  
  // 排序处理
  switch (sort) {
    case 'price_asc':
      // 价格从低到高
      filteredData.sort((a, b) => (a.price || 0) - (b.price || 0))
      break
    case 'price_desc':
      // 价格从高到低
      filteredData.sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'condition_new':
      // 成色从新到旧（grade: 5=全新 > 1=七成新）
      filteredData.sort((a, b) => (b.condition_grade || 0) - (a.condition_grade || 0))
      break
    case 'condition_old':
      // 成色从旧到新（grade: 1=七成新 > 5=全新）
      filteredData.sort((a, b) => (a.condition_grade || 0) - (b.condition_grade || 0))
      break
    case 'newest':
      // 按ID倒序（假设ID越大越新）
      filteredData.sort((a, b) => b.id.localeCompare(a.id))
      break
    default:
      // 默认价格从高到低
      filteredData.sort((a, b) => (b.price || 0) - (a.price || 0))
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
      // 价格从低到高
      results.sort((a, b) => (a.price || 0) - (b.price || 0))
      break
    case 'price_desc':
      // 价格从高到低
      results.sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'condition_new':
      // 成色从新到旧（grade: 5=全新 > 1=七成新）
      results.sort((a, b) => (b.condition_grade || 0) - (a.condition_grade || 0))
      break
    case 'condition_old':
      // 成色从旧到新（grade: 1=七成新 > 5=全新）
      results.sort((a, b) => (a.condition_grade || 0) - (b.condition_grade || 0))
      break
    case 'newest':
      // 按ID倒序（假设ID越大越新）
      results.sort((a, b) => b.id.localeCompare(a.id))
      break
    default:
      // 默认价格从高到低
      results.sort((a, b) => (b.price || 0) - (a.price || 0))
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
    services = [],  // 可选服务数组
    city = '',      // 配送城市
    postcode = ''   // 邮政编码
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

  // 城市配送验证
  let deliveryInfo = null
  let isDeliverable = true
  let deliveryGuide = null

  if (city || postcode) {
    const deliverableCities = sku.deliverable_cities || []
    
    // 查找匹配的城市
    const matchedCity = deliverableCities.find(cityInfo => {
      if (city && cityInfo.city === city) return true
      if (postcode && cityInfo.postcode.some(code => postcode.startsWith(code))) return true
      return false
    })

    if (matchedCity) {
      if (matchedCity.deliverable) {
        deliveryInfo = matchedCity
        isDeliverable = true
      } else {
        isDeliverable = false
        deliveryGuide = {
          message: "目前仅支持 Durham 及周边，后续将逐步扩展",
          suggestions: [
            {
              type: 'contact_service',
              title: '联系客服',
              description: '了解配送扩展计划和预约服务',
              action: 'contact_customer_service'
            },
            {
              type: 'view_available',
              title: '查看可配送城市',
              description: '当前支持配送的城市列表',
              action: 'view_deliverable_cities',
              cities: deliverableCities.filter(c => c.deliverable).map(c => c.city)
            }
          ]
        }
      }
    } else {
      isDeliverable = false
      deliveryGuide = {
        message: "目前仅支持 Durham 及周边，后续将逐步扩展",
        suggestions: [
          {
            type: 'contact_service',
            title: '联系客服',
            description: '了解配送扩展计划和预约服务',
            action: 'contact_customer_service'
          },
          {
            type: 'view_available',
            title: '查看可配送城市',
            description: '当前支持配送的城市列表',
            action: 'view_deliverable_cities',
            cities: deliverableCities.filter(c => c.deliverable).map(c => c.city)
          }
        ]
      }
    }
  }
  
  // 如果不可配送，直接返回引导信息
  if (!isDeliverable) {
    return {
      success: false,
      error_type: 'delivery_unavailable',
      message: deliveryGuide.message,
      data: {
        deliveryGuide,
        availableCities: sku.deliverable_cities || []
      }
    }
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
      
      // 配送信息
      delivery: {
        city: city || deliveryInfo?.city || '',
        postcode: postcode || '',
        isDeliverable,
        etaDays: deliveryInfo?.eta_days || sku.delivery?.eta_days || [7, 14],
        deliveryModes: sku.delivery?.modes || ['送货到门']
      },
      
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

// 获取意向订单列表（管理员接口）
fastify.get('/api/intent-order/list', async (request, reply) => {
  const { token, status, page = 1, limit = 20 } = request.query
  
  // 验证管理员令牌
  if (token !== ADMIN_TOKEN) {
    return reply.code(401).send({
      success: false,
      message: '访问令牌无效'
    })
  }
  
  try {
    let orders = await readIntentOrders()
    
    // 按状态筛选
    if (status && status !== 'all') {
      orders = orders.filter(order => order.status === status)
    }
    
    // 按创建时间倒序排列
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    // 分页处理
    const total = orders.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const paginatedOrders = orders.slice(startIndex, endIndex)
    
    // 统计信息
    const allOrders = await readIntentOrders()
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      contacted: allOrders.filter(o => o.status === 'contacted').length,
      done: allOrders.filter(o => o.status === 'done').length
    }
    
    return {
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats
      }
    }
  } catch (error) {
    console.error('获取意向订单列表失败:', error)
    return reply.code(500).send({
      success: false,
      message: '获取订单列表失败'
    })
  }
})

// 更新意向订单状态（管理员接口）
fastify.put('/api/intent-order/:id/status', async (request, reply) => {
  const { id } = request.params
  const { token, status, note = '' } = request.body || {}
  
  // 验证管理员令牌
  if (token !== ADMIN_TOKEN) {
    return reply.code(401).send({
      success: false,
      message: '访问令牌无效'
    })
  }
  
  // 验证状态值
  const validStatuses = ['pending', 'contacted', 'done']
  if (!validStatuses.includes(status)) {
    return reply.code(400).send({
      success: false,
      message: `无效的状态值，支持的状态：${validStatuses.join(', ')}`
    })
  }
  
  try {
    const orders = await readIntentOrders()
    const orderIndex = orders.findIndex(order => order.id === id)
    
    if (orderIndex === -1) {
      return reply.code(404).send({
        success: false,
        message: '订单未找到'
      })
    }
    
    // 更新订单状态
    orders[orderIndex] = {
      ...orders[orderIndex],
      status,
      note,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(orders[orderIndex].statusHistory || []),
        {
          status,
          note,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    await writeIntentOrders(orders)
    
    return {
      success: true,
      data: {
        message: '订单状态更新成功',
        order: orders[orderIndex]
      }
    }
  } catch (error) {
    console.error('更新订单状态失败:', error)
    return reply.code(500).send({
      success: false,
      message: '更新订单状态失败'
    })
  }
})

// 创建意向订单
fastify.post('/api/intent-order', async (request, reply) => {
  const body = request.body || {}
  console.log('[IntentOrder] 请求体:', JSON.stringify(body))
  const {
    skuId,
    duration,
    durationUnit = 'month',
    quantity = 1,
    services = [],
    startDate,
    userInfo = {},
    quoteData = null,
    openid = '', // 用户openid
    // 新增兼容：从意向单列表提交
    items = null,
    subscribe = null,
    contact = null
  } = body

  try {
    let orderData = null
    if (items && Array.isArray(items) && items.length > 0) {
      // 兼容意向单批量提交（无需skuId/duration）
      orderData = {
        type: 'intent_list',
        items,
        openid,
        userInfo,
        contact,
        clientInfo: {
          userAgent: request.headers['user-agent'] || '',
          ip: request.ip || '',
          timestamp: new Date().toISOString()
        },
        subscribe
      }
    } else {
      // 原有单SKU意向提交校验
      if (!skuId || !duration || !startDate) {
        return reply.code(400).send({ success: false, message: '缺少必要参数' })
      }
      const sku = skuData.find(item => item.id === skuId)
      if (!sku) {
        return reply.code(404).send({ success: false, message: 'SKU 未找到' })
      }
      const monthlyPrice = Math.ceil(sku.price / 50)
      orderData = {
        type: 'single',
        skuId,
        duration,
        durationUnit,
        quantity,
        services,
        startDate,
        monthlyPrice,
        totalAmount: monthlyPrice * duration * quantity,
        openid,
        contact,
        sku: {
          id: sku.id,
          title: sku.title,
          brand: sku.brand,
          price: sku.price,
          image: sku.images?.[0]?.url || '',
          images: sku.images?.slice(0, 1) || []
        },
        userInfo,
        quoteData,
        clientInfo: {
          userAgent: request.headers['user-agent'] || '',
          ip: request.ip || '',
          timestamp: new Date().toISOString()
        },
        subscribe
      }
    }

    const savedOrder = await addIntentOrder(orderData)
    console.log('[IntentOrder] 已保存:', { id: savedOrder.id, hasContact: Boolean(savedOrder.contact), contact: savedOrder.contact })

    // 若用户同意订阅并配置了公众号信息，则尝试发送订阅消息
    if (subscribe && subscribe.accepted && openid) {
      const tplId = subscribe.template_id || WX_TEMPLATE_INTENT
      if (tplId) {
        // 简单兜底：若未传data则构造基础数据
        const basicData = subscribe.data || {
          thing1: { value: '意向提交成功' },
          date2: { value: new Date().toLocaleString() },
          thing3: { value: '我们会尽快与您联系' }
        }
        sendSubscribeMessage({ openid, template_id: tplId, data: basicData, page: 'pages/intent/success' })
      }
    }

    // 管理员通知
    notifyAdminOrder(savedOrder)

    return {
      success: true,
      data: {
        orderId: savedOrder.id,
        status: savedOrder.status,
        message: '意向订单提交成功，我们会尽快联系您'
      }
    }
  } catch (error) {
    console.error('创建意向订单失败:', error)
    return reply.code(500).send({ success: false, message: '订单创建失败，请稍后重试' })
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
