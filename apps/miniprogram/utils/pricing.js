const CFG = require('../config/pricing.config.js')

function roundTo(x, step){ const s=step||0.01; return Math.round(x/s)*s }

function calcBaseRent(msrp, tier='mid'){
  const t = (CFG.tiers && CFG.tiers[tier]) || CFG.tiers.mid
  return roundTo(msrp * t.rentPct, CFG.priceRounding)
}

function calcDeposit(msrp, baseRent, tier='mid'){
  const t = (CFG.tiers && CFG.tiers[tier]) || CFG.tiers.mid
  const byPct = msrp * t.depositPct
  const byMonths = t.depositMonthsMin * baseRent
  return roundTo(Math.max(byPct, byMonths), CFG.priceRounding)
}

function applyTenureDiscount(rent, months){
  const disc = months>=12 ? CFG.tenureDiscount[12]
             : months>=6  ? CFG.tenureDiscount[6]
             : months>=3  ? CFG.tenureDiscount[3]
             : 1
  return roundTo(rent * disc, CFG.priceRounding)
}

function applyDamageWaiver({monthly, deposit, useWaiver}){
  if(!useWaiver) return { monthly, deposit, waiverMonthlyAddon: 0 }
  if(!CFG.damageWaiver.enabled) return { monthly, deposit, waiverMonthlyAddon: 0 }
  const addon = roundTo(monthly * CFG.damageWaiver.feePct, CFG.priceRounding)
  const newMonthly = roundTo(monthly + addon, CFG.priceRounding)
  const newDeposit = roundTo(deposit * CFG.damageWaiver.depositMultiplier, CFG.priceRounding)
  return { monthly: newMonthly, deposit: newDeposit, waiverMonthlyAddon: addon }
}

function calcShipping(months, orderAmount){
  const s = CFG.shipping
  if ((s.freeMonthThreshold && months >= s.freeMonthThreshold) || (s.freeOrderAmount && orderAmount >= s.freeOrderAmount)) return 0
  return (s.deliver || 0) + (s.collect || 0)
}

function computeOffer({ msrp, tier='mid', months=1, useWaiver=false, orderAmountForShipping=null }){
  const baseRent = calcBaseRent(msrp, tier)
  const deposit0 = calcDeposit(msrp, baseRent, tier)
  const monthly0 = applyTenureDiscount(baseRent, months)
  const { monthly, deposit, waiverMonthlyAddon } = applyDamageWaiver({ monthly: monthly0, deposit: deposit0, useWaiver })
  const shipping = calcShipping(months, orderAmountForShipping)

  const payAtStart = roundTo(deposit + monthly + shipping, CFG.priceRounding)
  const laterMonthly = monthly

  return {
    tier, months, msrp,
    baseRent, monthlyBeforeWaiver: monthly0,
    monthly, deposit,
    waiverMonthlyAddon,
    shipping,
    payAtStart,
    laterMonthly,
    meta: { waiverUserCopayCap: CFG.damageWaiver.userCopayCap }
  }
}

module.exports = {
  roundTo, calcBaseRent, calcDeposit, applyTenureDiscount,
  applyDamageWaiver, calcShipping, computeOffer
}


