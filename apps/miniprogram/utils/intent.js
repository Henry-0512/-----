// utils/intent.js - 意向单本地清单工具
const { isMockEnabled } = require('../config/env.js')
const { storage } = isMockEnabled()
  ? require('./request-mock.js')
  : require('./request.js')

const STORAGE_KEY = 'intent_items'

function get() {
  const items = storage.get(STORAGE_KEY, [])
  return Array.isArray(items) ? items : []
}

function set(items) {
  if (!Array.isArray(items)) return
  storage.set(STORAGE_KEY, items)
}

function add(item) {
  if (!item || !item.sku_id) return
  const items = get()
  const idx = items.findIndex(i => i.sku_id === item.sku_id)
  if (idx > -1) {
    const qty = Math.max(1, parseInt(items[idx].qty || 1) + (parseInt(item.qty || 1) || 1))
    items[idx] = { ...items[idx], ...item, qty }
  } else {
    items.unshift({
      sku_id: item.sku_id,
      qty: Math.max(1, parseInt(item.qty || 1) || 1),
      title: item.title || '',
      cover: item.cover || '',
      rent_monthly_gbp: parseInt(item.rent_monthly_gbp || 0) || 0,
      condition_grade: parseInt(item.condition_grade || 0) || 0,
      addedAt: new Date().toISOString()
    })
  }
  set(items)
}

function remove(sku_id) {
  if (!sku_id) return
  const items = get().filter(i => i.sku_id !== sku_id)
  set(items)
}

function updateQty(sku_id, step) {
  if (!sku_id || !step) return
  const items = get()
  const idx = items.findIndex(i => i.sku_id === sku_id)
  if (idx > -1) {
    const next = Math.max(1, (parseInt(items[idx].qty || 1) + parseInt(step)))
    items[idx].qty = next
    set(items)
  }
}

module.exports = {
  get,
  set,
  add,
  remove,
  updateQty
}


