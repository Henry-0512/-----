const PRICING_CFG = {
  tiers: {
    low:    { rentPct: 0.055, depositPct: 0.25, depositMonthsMin: 2 },
    mid:    { rentPct: 0.070, depositPct: 0.30, depositMonthsMin: 3 },
    high:   { rentPct: 0.090, depositPct: 0.55, depositMonthsMin: 4 },
    premium:{ rentPct: 0.110, depositPct: 0.70, depositMonthsMin: 4 }
  },
  tenureDiscount: { 3: 0.95, 6: 0.90, 12: 0.85 },
  damageWaiver: { enabled: true, feePct: 0.12, depositMultiplier: 0.5, userCopayCap: 20 },
  shipping: { deliver: 15, collect: 15, freeMonthThreshold: 6, freeOrderAmount: null },
  priceRounding: 0.1
}
module.exports = PRICING_CFG


