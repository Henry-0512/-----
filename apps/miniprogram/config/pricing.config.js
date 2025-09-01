const PRICING_CFG = {
  // 风险档：默认 mid
  tiers: {
    low:    { rentPct: 0.055, depositPct: 0.20, depositMonthsMin: 2 },
    mid:    { rentPct: 0.070, depositPct: 0.25, depositMonthsMin: 2 },
    high:   { rentPct: 0.090, depositPct: 0.55, depositMonthsMin: 4 },
    // 兼容历史 premium 档（若使用到）
    premium:{ rentPct: 0.110, depositPct: 0.70, depositMonthsMin: 4 }
  },

  // 押金封顶（按单件 MSRP）
  depositCaps: [
    { maxPrice: 500, cap: 120 },
    { maxPrice: 1000, cap: 200 }
  ],

  // 长租折扣（以“月”为单位触发）
  tenureDiscount: { 3: 0.95, 6: 0.90, 12: 0.85 },

  // 损坏保障
  damageWaiver: { enabled: true, feePct: 0.12, depositMultiplier: 0.5, userCopayCap: 20 },

  // 运费：城市定价 + 兜底价；默认不免运
  shippingByCity: {
    "Durham": 5,
    "Newcastle": 10,
    "Sunderland": 10
  },
  defaultShipping: 15,
  freeMonthThreshold: null,

  // 新引擎四舍五入步长
  rounding: 0.1,

  // 兼容旧引擎字段（price-box 等旧组件仍可能使用）
  shipping: { deliver: 15, collect: 15, freeMonthThreshold: 6, freeOrderAmount: null },
  priceRounding: 0.1
}
module.exports = PRICING_CFG


