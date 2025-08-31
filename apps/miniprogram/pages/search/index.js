const app = getApp()
let debounceTimer = null

// 可选配置
const config = (() => {
  try {
    const c = require('../../config/index.js')
    return c.default || c
  } catch (e) {
    return { BASE_URL: '', USE_API: false }
  }
})()

const HISTORY_KEY = 'SEARCH_HISTORY'
const PAGE_SIZE = 20

const DEMO_LIST = [
  { id: 'd1', title: '双人床架（灰）', cover: 'https://dummyimage.com/300x300', price: 19.9 },
  { id: 'd2', title: '独立弹簧床垫', cover: 'https://dummyimage.com/300x300', price: 24.9 },
  { id: 'd3', title: '三人位沙发', cover: 'https://dummyimage.com/300x300', price: 39.9 },
  { id: 'd4', title: '学习书桌', cover: 'https://dummyimage.com/300x300', price: 12.9 },
  { id: 'd5', title: '五门衣柜', cover: 'https://dummyimage.com/300x300', price: 29.9 }
]

Page({
  data: {
    keyword: '',
    suggestions: [],
    showSuggest: false,
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    searched: false,
    history: [],
    _filteredAll: []
  },

  onLoad() {
    const h = wx.getStorageSync(HISTORY_KEY) || []
    this.setData({ history: h })
  },

  onInput(e) {
    const keyword = (e.detail.value || '').trim()
    this.setData({ keyword, showSuggest: !!keyword })
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => this.fetchSuggest(keyword), 200)
  },

  onConfirm(e) {
    const q = (e.detail.value || this.data.keyword || '').trim()
    if (!q) return
    this.doSearch(q)
  },

  tapSuggest(e) { this.doSearch(e.currentTarget.dataset.k) },
  tapHistory(e) { this.doSearch(e.currentTarget.dataset.k) },

  onCancel() { wx.navigateBack() },

  clearHistory() {
    wx.removeStorageSync(HISTORY_KEY)
    this.setData({ history: [] })
  },

  tapItem(e) {
    const id = e.currentTarget.dataset.id
    // 这里仅保留占位逻辑，避免破坏现有路由
    wx.showToast({ icon: 'none', title: `ID: ${id}` })
  },

  doSearch(q) {
    let h = wx.getStorageSync(HISTORY_KEY) || []
    h = [q, ...h.filter(x => x !== q)].slice(0, 10)
    wx.setStorageSync(HISTORY_KEY, h)

    this.setData({
      keyword: q,
      searched: true,
      list: [],
      page: 1,
      hasMore: true,
      showSuggest: false,
      history: h,
      _filteredAll: []
    })
    this.fetchList()
  },

  onReachBottom() { this.fetchList() },

  // ===== 数据层 =====
  fetchSuggest(q) {
    if (!q) { this.setData({ suggestions: [] }); return }
    if (config.BASE_URL && config.USE_API) {
      wx.request({
        url: `${config.BASE_URL}/api/products/suggest`,
        method: 'GET',
        data: { q },
        success: res => this.setData({ suggestions: res.data || [] }),
        fail: () => this.setData({ suggestions: [] })
      })
      return
    }
    const seeds = ['床', '床架', '床垫', '沙发', '书桌', '衣柜', '餐椅', '茶几', '书柜', '电视柜']
    this.setData({ suggestions: seeds.filter(k => k.includes(q)) })
  },

  fetchList() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })

    const q = this.data.keyword
    const page = this.data.page

    if (config.BASE_URL && config.USE_API) {
      wx.request({
        url: `${config.BASE_URL}/api/products/search`,
        method: 'GET',
        data: { q, page, pageSize: PAGE_SIZE },
        success: (res) => {
          const items = (res.data && res.data.items) || []
          const hasMore = items.length === PAGE_SIZE
          this.setData({
            list: this.data.list.concat(items),
            page: page + 1,
            hasMore
          })
        },
        fail: () => wx.showToast({ icon: 'none', title: '搜索失败' }),
        complete: () => this.setData({ loading: false })
      })
      return
    }

    const all = this.getLocalDataset().filter(it => (it.title || '').toLowerCase().includes((q || '').toLowerCase()))
    const filteredAll = this.data._filteredAll.length ? this.data._filteredAll : all
    const start = (page - 1) * PAGE_SIZE
    const next = filteredAll.slice(start, start + PAGE_SIZE)
    const hasMore = start + PAGE_SIZE < filteredAll.length

    this.setData({
      _filteredAll: filteredAll,
      list: this.data.list.concat(next),
      page: page + 1,
      hasMore,
      loading: false
    })
  },

  getLocalDataset() {
    if (app && Array.isArray(app.globalData?.products) && app.globalData.products.length) return app.globalData.products
    const st = wx.getStorageSync('PRODUCTS') || []
    if (Array.isArray(st) && st.length) return st
    return DEMO_LIST
  }
})


