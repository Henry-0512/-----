#!/usr/bin/env node
// One-off migration: add msrp to sample/mock product data files (idempotent)
// - Backup original file to .bak
// - Only touches local mock/sample data files actually used by the app

const fs = require('fs')
const path = require('path')

// Resolve repo root based on this script location
const ROOT = path.resolve(__dirname, '..')

// Pricing config to fetch rentPct per tier
const CFG = require(path.join(ROOT, 'apps/miniprogram/config/pricing.config.js'))
const RENT_PCT = (tier) => {
  const t = (CFG.tiers && CFG.tiers[tier]) || CFG.tiers?.mid
  return (t && typeof t.rentPct === 'number') ? t.rentPct : 0.07
}

// Candidate files detected in this repo (Step 1 findings)
// Confirmed source of sample data used by request-mock: utils/mock-data.js
const FILES = [
  path.join(ROOT, 'apps/miniprogram/utils/mock-data.js')
]

const MONTHLY_KEYS = [
  'monthly', 'rentMonthly', 'pricePerMonth', 'perMonth', 'per_month', 'rent_per_month',
  // project-specific aliases
  'rent_monthly_gbp', 'monthlyPrice'
]

function inferMsrp(item){
  if (item && typeof item.msrp === 'number' && item.msrp > 0) return null // keep existing
  const tier = item?.tier || 'mid'
  const pct = RENT_PCT(tier)
  let monthly
  for (const k of MONTHLY_KEYS){
    if (typeof item?.[k] === 'number' && item[k] > 0){ monthly = item[k]; break }
  }
  if (typeof monthly === 'number' && monthly > 0 && pct > 0){
    return Math.max(10, Math.round(monthly / pct))
  }
  if (typeof item?.price === 'number' && item.price >= 50 && item.price <= 10000){
    return Math.round(item.price)
  }
  return 100
}

function backupFile(absPath){
  const bak = absPath + '.bak'
  if (!fs.existsSync(bak)){
    fs.copyFileSync(absPath, bak)
  }
}

function replaceItemsArrayInJs(filePath, newItems){
  const src = fs.readFileSync(filePath, 'utf8')
  const marker = 'items:'
  const pos = src.indexOf(marker)
  if (pos === -1) throw new Error('items: array not found in ' + filePath)
  const startBracket = src.indexOf('[', pos)
  if (startBracket === -1) throw new Error('[ after items: not found in ' + filePath)
  let i = startBracket, depth = 0
  for (; i < src.length; i++){
    const ch = src[i]
    if (ch === '[') depth++
    else if (ch === ']'){
      depth--
      if (depth === 0) { i++; break }
    }
  }
  const endBracket = i // position after closing ]
  const before = src.slice(0, startBracket)
  const after = src.slice(endBracket)

  // Preserve original indentation on the line where items: begins
  const lineStart = src.lastIndexOf('\n', pos) + 1
  const indent = src.slice(lineStart, pos)
  const innerIndent = indent + '  '

  // Stringify with 2-space indent, then indent each line to match original
  const json = JSON.stringify(newItems, null, 2)
  const indented = json.split('\n').map((ln, idx) => (idx === 0 ? ln : innerIndent + ln)).join('\n')

  const result = before + indented + after
  fs.writeFileSync(filePath, result, 'utf8')
}

function processMockDataJs(absPath){
  // Load current items via require to avoid complex parsing
  const mod = require(absPath)
  const items = mod?.mockData?.products?.data?.items
  if (!Array.isArray(items)){
    console.warn('[skip] items array not found in', absPath)
    return { added:0, skipped:0, defaulted:0 }
  }
  let added = 0, skipped = 0, defaulted = 0
  const newItems = items.map((it) => {
    const copy = { ...it }
    const msrp = inferMsrp(copy)
    if (msrp === null){ skipped++ }
    else {
      if (msrp === 100) defaulted++
      copy.msrp = msrp
      added++
    }
    return copy
  })

  // Write back by replacing the items array literal in source text
  backupFile(absPath)
  replaceItemsArrayInJs(absPath, newItems)
  return { added, skipped, defaulted }
}

function run(){
  let total = { added:0, skipped:0, defaulted:0 }
  console.log('MSRP migration started...')
  for (const f of FILES){
    try{
      const ext = path.extname(f)
      let stats = { added:0, skipped:0, defaulted:0 }
      if (ext === '.js' || ext === '.ts') stats = processMockDataJs(f)
      else if (ext === '.json'){
        // Not used in this repo for products; keep here for completeness
        console.warn('[skip] JSON product dataset not found:', f)
      } else {
        console.warn('[skip] Unsupported file type:', f)
      }
      total.added += stats.added
      total.skipped += stats.skipped
      total.defaulted += stats.defaulted
      console.log(`- ${f}\n  added: ${stats.added}, skipped: ${stats.skipped}, default: ${stats.defaulted}`)
    } catch (e){
      console.error('[error]', f, e.message)
    }
  }
  console.log(`Summary => added: ${total.added}, skipped: ${total.skipped}, default: ${total.defaulted}`)
}

if (require.main === module){
  run()
}


