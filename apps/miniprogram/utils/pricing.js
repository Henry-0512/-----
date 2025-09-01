const CFG = require('../config/pricing.config.js')

function roundTo(x, step){ const s=step||0.01; return Math.round((x||0)/s)*s }
function weeksToMonths(weeks){ return weeks / 4.345 }

function getBaseMonthly({ msrp, baseMonthly, tier='mid' }){
  const t = (CFG.tiers && CFG.tiers[tier]) || CFG.tiers.mid
  if (typeof baseMonthly === 'number' && baseMonthly > 0) return baseMonthly
  if (typeof msrp === 'number' && msrp > 0) return msrp * t.rentPct
  return 0
}

function calcDepositPerItem({ msrp, baseMonthly, tier='mid' }){
  const t = (CFG.tiers && CFG.tiers[tier]) || CFG.tiers.mid
  const byPct = (msrp || 0) * t.depositPct
  const byMonths = (baseMonthly || 0) * t.depositMonthsMin
  let d = Math.max(byPct, byMonths)
  if (msrp){
    const caps = CFG.depositCaps || []
    for (const cap of caps){
      if (msrp <= cap.maxPrice){ d = Math.min(d, cap.cap); break }
    }
  }
  return d
}

function applyTenureDiscount(monthly, months){
  const disc = months>=12 ? CFG.tenureDiscount[12]
             : months>=6  ? CFG.tenureDiscount[6]
             : months>=3  ? CFG.tenureDiscount[3]
             : 1
  return monthly * disc
}

function calcShippingByCity({ city, monthsEq }){
  if (CFG.freeMonthThreshold && monthsEq >= CFG.freeMonthThreshold) return 0
  if (city && CFG.shippingByCity && CFG.shippingByCity[city] != null) return CFG.shippingByCity[city]
  return CFG.defaultShipping || 0
}

function computeOneOffQuote(params){
  const {
    msrp, baseMonthly, tier='mid',
    termUnit='month', termCount=1, qty=1,
    city='', useWaiver=false, addonTotal=0
  } = params || {}

  let baseMonthlyPerItem = getBaseMonthly({ msrp, baseMonthly, tier })
  const monthsEq = termUnit === 'week' ? weeksToMonths(termCount) : termCount
  let monthlyPerItem = applyTenureDiscount(baseMonthlyPerItem, monthsEq)

  let rentTotal
  if (termUnit === 'week'){
    const weeklyPerItem = monthlyPerItem / 4.345
    rentTotal = weeklyPerItem * termCount * qty
  } else {
    rentTotal = monthlyPerItem * termCount * qty
  }

  let depositPerItem = calcDepositPerItem({ msrp, baseMonthly: baseMonthlyPerItem, tier })
  let depositTotal = depositPerItem * qty

  let waiverAddon = 0
  if (useWaiver && CFG.damageWaiver?.enabled){
    const monthAddonPerItem = monthlyPerItem * CFG.damageWaiver.feePct
    if (termUnit === 'week'){
      waiverAddon = (monthAddonPerItem/4.345) * termCount * qty
    } else {
      waiverAddon = monthAddonPerItem * termCount * qty
    }
    depositTotal = depositTotal * (CFG.damageWaiver.depositMultiplier || 1)
  }

  const shipping = calcShippingByCity({ city, monthsEq })
  const oneOffTotal = roundTo(rentTotal + waiverAddon + depositTotal + shipping + (addonTotal||0), CFG.rounding || CFG.priceRounding)

  return {
    msrp, tier, termUnit, termCount, qty, city,
    price: {
      baseMonthlyPerItem: roundTo(baseMonthlyPerItem, CFG.rounding || CFG.priceRounding),
      monthlyPerItem: roundTo(monthlyPerItem, CFG.rounding || CFG.priceRounding),
      rentTotal: roundTo(rentTotal, CFG.rounding || CFG.priceRounding),
      waiverAddon: roundTo(waiverAddon, CFG.rounding || CFG.priceRounding),
      depositPerItem: roundTo(depositPerItem, CFG.rounding || CFG.priceRounding),
      depositTotal: roundTo(depositTotal, CFG.rounding || CFG.priceRounding),
      shipping: roundTo(shipping, CFG.rounding || CFG.priceRounding),
      addonTotal: roundTo(addonTotal||0, CFG.rounding || CFG.priceRounding),
      oneOffTotal
    },
    meta: {
      discount: monthsEq>=12? '12个月85折' : monthsEq>=6? '6个月9折' : monthsEq>=3? '3个月95折' : '无折扣',
      waiverTip: CFG.damageWaiver?.enabled ? `损坏保障：月费+12%，押金减半；单次损坏你最多自付£${CFG.damageWaiver.userCopayCap}` : '',
      formula: '一次性付款 = 押金 + 全期租金(+保障加成) + 运费 + 增值服务'
    }
  }
}

module.exports = {
  computeOneOffQuote,
  // 兼容旧导出，留空壳避免报错（旧组件不再使用这些值时可逐步清理）
  roundTo: roundTo,
  calcBaseRent: () => {},
  calcDeposit: () => {},
  applyTenureDiscount: () => {},
  applyDamageWaiver: () => {},
  calcShipping: () => {},
  computeOffer: () => {}
}


