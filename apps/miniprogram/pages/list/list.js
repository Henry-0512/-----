// pages/list/list.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    // 页面状态
    loading: true,
    error: null,
    isEmpty: false,
    
    // 数据状态
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
    hasMore: true,
    searchQuery: '',
    pageTitle: '',
    hasActiveFilters: false,
    filterCount: 0,
    
    // 排序状态
    currentSort: 'newest',
    currentSortName: '综合排序',
    sortOptions: [
      { key: 'newest', name: '综合排序' },
      { key: 'price_asc', name: '价格从低到高' },
      { key: 'price_desc', name: '价格从高到低' },
      { key: 'newest', name: '最新上架' }
    ],
    
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
    
    // 新版筛选器配置
    filterSchema: [
      { key: "price", type: "range", label: "价格", unit: "¥", min: 0, max: 20000, step: 100 },
      { key: "width_mm", type: "range", label: "宽度", unit: "mm", min: 400, max: 3000, step: 10 },
      { key: "material", type: "multi", label: "材质", options: ["布艺","皮质","实木","金属","玻璃"] },
      { key: "style", type: "multi", label: "风格", options: ["现代","北欧","原木","极简","工业"] },
      { key: "color", type: "multi", label: "颜色", options: ["灰","米白","原木","黑","棕"] },
      { key: "upstairs", type: "bool", label: "可上楼" }
    ],
    currentFilters: {},
    
    error: null
  },

  onLoad(options) {
    const { category, q, sort, department, title } = options
    
    // 设置页面标题
    let pageTitle = '商品列表'
    if (title) {
      pageTitle = decodeURIComponent(title)
    } else if (category) {
      pageTitle = decodeURIComponent(category)
    } else if (q) {
      pageTitle = `搜索: ${decodeURIComponent(q)}`
    } else if (department) {
      pageTitle = decodeURIComponent(department)
    }
    
    this.setData({ pageTitle })
    
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
      this.setData({ 
        loading: true, 
        error: null,
        isEmpty: false 
      })
      
      const currentPage = reset ? 1 : this.data.page
      const { searchQuery, selectedFilters, page_size, currentSort } = this.data
      
      let res
      if (searchQuery.trim()) {
        // 搜索模式
        res = await api.searchProducts(searchQuery.trim(), {
          page: currentPage,
          page_size,
          sort: currentSort
        })
      } else {
        // 筛选模式
        const filterData = this.formatFiltersForAPI(selectedFilters)
        res = await api.filterProducts(filterData, {
          page: currentPage,
          page_size,
          sort: currentSort
        })
      }
      
      const newItems = res.data?.items || []
      const items = reset ? newItems : [...this.data.items, ...newItems]
      
      this.setData({
        items,
        total: res.data?.total || 0,
        page: res.data?.page || currentPage,
        page_size: res.data?.page_size || page_size,
        total_pages: res.data?.total_pages || 0,
        hasMore: res.data?.has_more || false,
        loading: false,
        isEmpty: items.length === 0
      })
    } catch (error) {
      console.error('加载商品列表失败：', error)
      
      this.setData({
        loading: false,
        error: {
          type: error.type || ERROR_TYPES.NETWORK,
          message: error.message || '加载失败，请重试',
          canRetry: error.canRetry !== false,
          onRetry: error.onRetry || (() => this.loadItems(reset))
        }
      })
    }
  },

  /**
   * 重试加载
   */
  onRetryLoad() {
    const { error } = this.data
    if (error && error.onRetry) {
      error.onRetry()
    } else {
      this.loadItems(true)
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
   * 筛选条件变化（旧版）
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
   * 新筛选器应用
   */
  onFilterApply(e) {
    const filters = e.detail
    console.log('应用筛选条件:', filters)
    
    this.setData({ 
      currentFilters: filters,
      page: 1,
      hasMore: true
    })
    this.loadItems(true)
  },

  /**
   * 筛选器关闭
   */
  onFilterClose() {
    this.setData({ showFilterSheet: false })
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
    const { hasMore, loading, page, total_pages } = this.data
    
    // 检查是否可以加载更多
    if (!hasMore || loading || page >= total_pages) {
      return
    }
    
    // 增加页码并加载下一页
    this.setData({ page: page + 1 })
    this.loadItems(false)  // 追加模式，不重置数据
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ page: 1 })
    this.loadItems(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 返回上一页
   */
  onGoBack() {
    wx.navigateBack()
  },

  /**
   * 显示排序选项
   */
  onShowSort() {
    const { sortOptions, currentSort } = this.data
    const itemList = sortOptions.map(option => option.name)
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedSort = sortOptions[res.tapIndex]
        if (selectedSort && selectedSort.key !== currentSort) {
          this.setData({
            currentSort: selectedSort.key,
            currentSortName: selectedSort.name,
            page: 1,  // 重置分页
            items: []  // 清空当前数据
          })
          this.loadItems(true)  // 重新加载第一页
        }
      }
    })
  },

  /**
   * 更新筛选状态
   */
  updateFilterStatus() {
    const { currentFilters } = this.data
    let hasActiveFilters = false
    let filterCount = 0

    // 检查是否有活跃的筛选条件
    if (currentFilters) {
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key] && 
            (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : currentFilters[key])) {
          hasActiveFilters = true
          filterCount++
        }
      })
    }

    this.setData({
      hasActiveFilters,
      filterCount
    })
  }
})
