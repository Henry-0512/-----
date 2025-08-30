// scripts/analyze-tracking.js - 追踪数据分析工具
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function analyzeTrackingData() {
  try {
    // 读取追踪日志
    const logPath = path.join(__dirname, '../data/tracking-logs.json')
    const data = await fs.readFile(logPath, 'utf8')
    const logs = JSON.parse(data)
    
    console.log('📊 用户行为追踪分析报告')
    console.log('=' * 50)
    
    // 基础统计
    console.log(`📈 基础统计：`)
    console.log(`   总事件数：${logs.length}`)
    console.log(`   独立用户：${new Set(logs.map(log => log.openid)).size}`)
    console.log(`   独立会话：${new Set(logs.map(log => log.sessionId)).size}`)
    
    // 按事件类型统计
    const eventStats = {}
    logs.forEach(log => {
      eventStats[log.event] = (eventStats[log.event] || 0) + 1
    })
    
    console.log(`\n🎯 事件统计：`)
    Object.entries(eventStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([event, count]) => {
        console.log(`   ${event}: ${count}次`)
      })
    
    // 按日期统计
    const dateStats = {}
    logs.forEach(log => {
      dateStats[log.date] = (dateStats[log.date] || 0) + 1
    })
    
    console.log(`\n📅 日期统计：`)
    Object.entries(dateStats)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, count]) => {
        console.log(`   ${date}: ${count}次`)
      })
    
    // 用户行为分析
    const userBehavior = {}
    logs.forEach(log => {
      if (!userBehavior[log.openid]) {
        userBehavior[log.openid] = []
      }
      userBehavior[log.openid].push({
        event: log.event,
        timestamp: log.timestamp,
        payload: log.payload
      })
    })
    
    console.log(`\n👤 用户行为分析：`)
    Object.entries(userBehavior).forEach(([openid, events]) => {
      const displayId = openid.substr(-8) || 'anonymous'
      console.log(`   用户 ${displayId}: ${events.length}个事件`)
      
      // 显示用户的事件序列
      const eventSequence = events
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(e => e.event)
        .join(' → ')
      console.log(`     行为路径: ${eventSequence}`)
    })
    
    // 转化漏斗分析
    console.log(`\n🎯 转化漏斗分析：`)
    const funnelEvents = ['pdp_view', 'quote_submit', 'intent_submit_success']
    funnelEvents.forEach((event, index) => {
      const count = eventStats[event] || 0
      const prevCount = index > 0 ? (eventStats[funnelEvents[index - 1]] || 0) : count
      const conversionRate = prevCount > 0 ? ((count / prevCount) * 100).toFixed(1) : '0.0'
      
      console.log(`   ${index + 1}. ${event}: ${count}次 (转化率: ${conversionRate}%)`)
    })
    
    // 最近事件
    console.log(`\n⏰ 最近事件（最新5条）：`)
    logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .forEach(log => {
        const time = new Date(log.timestamp).toLocaleString()
        const userId = log.openid.substr(-8) || 'anonymous'
        console.log(`   ${time} - ${log.event} (用户: ${userId})`)
      })
    
  } catch (error) {
    console.error('❌ 分析失败:', error)
  }
}

// 执行分析
analyzeTrackingData()
