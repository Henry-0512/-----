// pages/list/list.js
const { api } = require('../../utils/request.js')

Page({
  data: {
    loading: true,
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    hasMore: true,
    searchQuery: '',
    
    // 筛选相关
    filterOptions: {
      categories: [],
      priceRanges: [],
      brands: []
    },
    selectedFilters: {
      categories: [],
      priceRange: null,
      brands: []
    },
    showFilterSheet: false,
    
    error: null
  },

  onLoad(options) {
    const { category, q, sort } = options
    
    // 处理URL参数
    if (category) {
      this.setData({
        'selectedFilters.categories': [category]
      })
    }
    
    if (q) {
      this.setData({ searchQuery: decodeURIComponent(q) })
    }
    
    // 初始化数据
    this.loadFilterOptions()
    this.loadItems(true)
  },

  onShow() {
    // 每次显示时检查是否需要刷新
    if (!this.data.items.length && !this.data.loading) {
      this.loadItems(true)
    }
  },

  /**
   * 加载筛选选项
   */
  async loadFilterOptions() {
    try {
      const res = await api.getFiltersMeta()
      this.setData({
        filterOptions: res.data
      })
    } catch (error) {
      console.error('加载筛选条件失败：', error)
    }
  },

  /**
   * 加载商品列表
   */
  async loadItems(reset = false) {
    if (this.data.loading && !reset) return
    
    try {
      this.setData({ loading: true, error: null })
      
      const page = reset ? 1 : this.data.page
      const { searchQuery, selectedFilters, limit } = this.data
      
      let res
      if (searchQuery.trim()) {
        // 搜索模式
        res = await api.searchProducts({
          q: searchQuery.trim(),
          page,
          limit
        })
      } else {
        // 筛选模式
        const filterData = this.formatFiltersForAPI(selectedFilters)
        res = await api.filterProducts(filterData)
        
        // 手动实现分页（因为API返回全部数据）
        res = this.paginateResults(res, page, limit)
      }
      
      const newItems = res.data.items || []
      const items = reset ? newItems : [...this.data.items, ...newItems]
      
      this.setData({
        items,
        total: res.data.total || 0,
        page: res.data.page || page,
        hasMore: (res.data.page || page) < (res.data.totalPages || 1),
        loading: false
      })
    } catch (error) {
      console.error('加载商品列表失败：', error)
      this.setData({
        error: '加载失败，请重试',
        loading: false
      })
    }
  },

  /**
   * 格式化筛选条件用于API调用
   */
  formatFiltersForAPI(filters) {
    const apiFilters = {}
    
    if (filters.categories && filters.categories.length > 0) {
      apiFilters.categories = filters.categories
    }
    
    if (filters.priceRange) {
      apiFilters.priceRange = {
        min: filters.priceRange.min,
        max: filters.priceRange.max
      }
    }
    
    if (filters.brands && filters.brands.length > 0) {
      apiFilters.brands = filters.brands
    }
    
    return apiFilters
  },

  /**
   * 对结果进行分页处理
   */
  paginateResults(res, page, limit) {
    const allItems = res.data.items || []
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = allItems.slice(startIndex, endIndex)
    
    return {
      ...res,
      data: {
        ...res.data,
        items: paginatedItems,
        page,
        limit,
        totalPages: Math.ceil(allItems.length / limit)
      }
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value })
  },

  /**
   * 搜索确认
   */
  onSearchConfirm() {
    this.setData({ page: 1 })
    this.loadItems(true)
  },

  /**
   * 显示筛选抽屉
   */
  onShowFilter() {
    this.setData({ showFilterSheet: true })
  },

  /**
   * 隐藏筛选抽屉
   */
  onHideFilter() {
    this.setData({ showFilterSheet: false })
  },

  /**
   * 筛选条件变化
   */
  onFilterChange(e) {
    const { filters } = e.detail
    this.setData({ 
      selectedFilters: filters,
      page: 1 
    })
    this.loadItems(true)
  },

  /**
   * 商品卡片点击
   */
  onProductCardTap(e) {
    const { product } = e.detail
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}`
    })
  },

  /**
   * 收藏状态变化
   */
  onFavoriteChange(e) {
    console.log('收藏状态变化:', e.detail)
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadItems(true)
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({ 
      searchQuery: '',
      page: 1 
    })
    this.loadItems(true)
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadItems()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ page: 1 })
    this.loadItems(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
