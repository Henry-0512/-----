// pages/list/list.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { track, TrackEvents } = require('../../utils/track.js')

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
    currentSort: 'rent_desc',
    currentSortName: '月租从高到低',
    sortOptions: [
      { key: 'rent_asc', name: '月租从低到高' },
      { key: 'rent_desc', name: '月租从高到低' },
      { key: 'condition_new', name: '成色从新到旧' },
      { key: 'condition_old', name: '成色从旧到新' }
    ],
    
    // 去重相关
    loadedIds: [],
    
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
      { key: "price", type: "range", label: "月租（£/月）", unit: "£/mo", min: 8, max: 15, step: 1 },
      { key: "category", type: "multi", label: "分类", options: ["沙发","床","桌子","椅子","柜子","装饰","灯具","地毯"] },
      { key: "material", type: "multi", label: "材质", options: ["布艺","皮质","实木","金属","玻璃","塑料","藤编","大理石"] },
      { key: "color", type: "multi", label: "颜色", options: ["白色","黑色","灰色","棕色","米色","蓝色","绿色","红色","黄色","粉色"] },
      { key: "style", type: "multi", label: "风格", options: ["现代","北欧","极简","工业","简约","复古","田园","中式","美式"] },
      { key: "size", type: "multi", label: "尺寸", options: ["小型","中型","大型","超大型"] }
    ],
    currentFilters: {},
    
    // 单项筛选器状态
    showSingleFilter: false,
    singleFilterType: '',
    singleFilterTitle: '',
    singleFilterOptions: [],
    singleFilterSelected: [],
    
    error: null
  },

  onLoad(options) {
    console.log('🔍 列表页onLoad被调用:', options)
    
    // 调试：检查滚动区域
    setTimeout(() => {
      const query = this.createSelectorQuery()
      query.select('.filter-scroll').boundingClientRect()
      query.select('.filter-tags-container').boundingClientRect()
      query.selectAll('.filter-tag').boundingClientRect()
      query.exec((res) => {
        console.log('🔍 滚动区域尺寸:', res[0])
        console.log('🔍 内容区域尺寸:', res[1])
        console.log('🔍 标签数量:', res[2] ? res[2].length : 0)
        if (res[2] && res[2].length > 0) {
          const totalTagsWidth = res[2].reduce((sum, tag) => sum + tag.width, 0)
          console.log('🔍 所有标签总宽度:', totalTagsWidth)
          console.log('🔍 平均标签宽度:', totalTagsWidth / res[2].length)
        }
        if (res[1] && res[0]) {
          console.log('🔍 是否需要滚动:', res[1].width > res[0].width)
          console.log('🔍 内容宽度:', res[1].width, '容器宽度:', res[0].width)
        }
      })
    }, 1000)
    
    // 最简单的实现，避免复杂逻辑导致错误
    const { category, title } = options
    
    let pageTitle = '商品列表'
    if (category) {
      pageTitle = decodeURIComponent(category)
    } else if (title) {
      pageTitle = decodeURIComponent(title)
    }
    
    console.log('🔍 设置页面标题:', pageTitle)
    console.log('🔍 scroll-view应该支持横向滚动')
    
    this.setData({ 
      pageTitle,
      loading: false,
      currentFilters: {}, // 初始化为空对象
      hasActiveFilters: false,
      filterCount: 0
    })
    
    // 更新筛选状态
    this.updateFilterStatus()
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: pageTitle
    })
    
    console.log('🔍 列表页onLoad完成')
    
    // 恢复数据加载
    console.log('🔍 开始加载商品数据')
    this.loadItems(true)
  },

  onReady() {
    // 记录列表顶部位置（用于排序后回到顶端）
    wx.createSelectorQuery().select('#listTop').boundingClientRect(rect => {
      this.setData({ listTop: rect ? rect.top : 0 })
    }).exec()
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
      
      // 更新筛选器配置中的城市选项
      const updatedFilterSchema = this.data.filterSchema.map(filter => {
        if (filter.key === 'cities') {
          return {
            ...filter,
            options: (res.data.cities || []).map(city => ({
              value: city.name || city.id,
              label: city.name || city.id,
              disabled: !city.deliverable,
              note: city.deliverable ? null : '暂不支持'
            }))
          }
        }
        return filter
      })
      
      this.setData({
        filterOptions: res.data,
        filterSchema: updatedFilterSchema
      })
    } catch (error) {
      console.error('加载筛选条件失败：', error)
    }
  },

  /**
   * 统一的数据获取方法
   */
  async fetchList() {
    try {
      console.log('🔍 fetchList 开始调用:', {
        currentFilters: this.data.currentFilters,
        currentSort: this.data.currentSort,
        page: this.data.page,
        searchQuery: this.data.searchQuery
      })
      
      this.setData({ loading: true, error: null })
      
      const { currentFilters, currentSort, page, page_size, searchQuery } = this.data
      
      let result
      if (searchQuery) {
        // 搜索模式
        result = await api.searchProducts(searchQuery, {
          page,
          page_size,
          sort: currentSort
        })
      } else {
        // 筛选模式
        result = await api.filterProducts(currentFilters, {
          page,
          page_size,
          sort: currentSort
        })
      }
      
      if (result.success) {
        const newItems = result.data.items || []
        const { loadedIds } = this.data
        
        // 去重处理
        const uniqueItems = newItems.filter(item => {
          if (loadedIds.includes(item.id)) {
            return false
          }
          loadedIds.push(item.id)
          return true
        })
        
        // 合并数据
        const items = page === 1 ? uniqueItems : [...this.data.items, ...uniqueItems]
        
        this.setData({
          items,
          total: result.data.total || 0,
          total_pages: result.data.total_pages || 0,
          hasMore: result.data.has_more !== false,
          loading: false,
          loadedIds
        })
      } else {
        throw new Error(result.message || '加载失败')
      }
    } catch (error) {
      console.error('fetchList失败:', error)
      this.setData({
        loading: false,
        error: {
          type: 'NETWORK',
          message: '加载失败，请检查网络',
          canRetry: true,
          onRetry: () => this.fetchList()
        }
      })
    }
  },

  /**
   * 加载商品列表（保持兼容）
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
      
      console.log('🔍 loadItems调用参数:', {
        currentPage,
        searchQuery,
        selectedFilters,
        currentSort,
        reset
      })
      
      let res
      if (searchQuery && searchQuery.trim()) {
        // 搜索模式
        console.log('🔍 使用搜索模式')
        res = await api.searchProducts(searchQuery.trim(), {
          page: currentPage,
          page_size,
          sort: currentSort
        })
      } else {
        // 筛选模式
        console.log('🔍 使用筛选模式')
        const filterData = this.formatFiltersForAPI(selectedFilters)
        console.log('🔍 筛选数据:', filterData)
        
        res = await api.filterProducts(filterData, {
          page: currentPage,
          page_size,
          sort: currentSort
        })
      }
      
      console.log('🔍 API返回结果:', res)
      
      const newItems = res.data?.items || []
      
      // 详细调试排序结果
      if (newItems.length > 0) {
        console.log('🔍 排序前商品价格:', newItems.map(item => ({ id: item.id, price: item.price, title: item.title })))
        
        // 前端再次排序（确保排序生效）
        if (currentSort === 'price_asc') {
          newItems.sort((a, b) => (a.price || 0) - (b.price || 0))
          console.log('🔍 前端价格升序排序后:', newItems.map(item => ({ id: item.id, price: item.price })))
        } else if (currentSort === 'price_desc') {
          newItems.sort((a, b) => (b.price || 0) - (a.price || 0))
          console.log('🔍 前端价格降序排序后:', newItems.map(item => ({ id: item.id, price: item.price })))
        }
      }
      
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
    console.log('🔍 formatFiltersForAPI输入:', filters)
    
    const apiFilters = {}
    
    if (filters.categories && filters.categories.length > 0) {
      apiFilters.categories = filters.categories
    }
    
    // 处理月租金筛选（支持price和monthlyPrice字段名）
    if (filters.price) {
      apiFilters.monthlyPrice = {
        min: filters.price.min,
        max: filters.price.max
      }
    } else if (filters.monthlyPrice) {
      apiFilters.monthlyPrice = {
        min: filters.monthlyPrice.min,
        max: filters.monthlyPrice.max
      }
    }
    
    // 处理材质筛选
    if (filters.material && filters.material.length > 0) {
      apiFilters.material = filters.material
    }
    
    // 处理风格筛选
    if (filters.style && filters.style.length > 0) {
      apiFilters.style = filters.style
    }
    
    if (filters.brands && filters.brands.length > 0) {
      apiFilters.brands = filters.brands
    }
    
    console.log('🔍 formatFiltersForAPI输出:', apiFilters)
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
    console.log('🔍 打开筛选器，当前筛选条件:', this.data.currentFilters)
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
    console.log('🔍 应用筛选条件:', filters)
    
    // 格式化筛选条件
    const formattedFilters = {}
    
    // 处理价格范围（使用月租金）
    if (filters.price && (filters.price.min !== undefined || filters.price.max !== undefined)) {
      formattedFilters.monthlyPrice = {
        min: filters.price.min || 0,
        max: filters.price.max || 1000
      }
      console.log('🔍 价格筛选:', formattedFilters.monthlyPrice)
    }
    
    // 处理材质筛选
    if (filters.material && filters.material.length > 0) {
      formattedFilters.material = filters.material
      console.log('🔍 材质筛选:', formattedFilters.material)
    }
    
    // 处理风格筛选
    if (filters.style && filters.style.length > 0) {
      formattedFilters.style = filters.style
      console.log('🔍 风格筛选:', formattedFilters.style)
    }
    
    // 追踪筛选应用行为
    try {
      const { track, TrackEvents } = require('../../utils/track.js')
      track(TrackEvents.FILTER_APPLY, {
        filters: formattedFilters,
        filterCount: Object.keys(formattedFilters).length,
        page: 'list'
      })
    } catch (error) {
      console.warn('埋点失败:', error)
    }
    
    this.setData({ 
      selectedFilters: formattedFilters,
      currentFilters: filters, // 保存原始筛选条件用于FilterSheet显示
      showFilterSheet: false,
      page: 1,
      items: [],
      loadedIds: [] // 重置去重数组
    })
    
    console.log('🔍 筛选后重新加载数据，筛选条件:', formattedFilters)
    this.updateFilterStatus()
    this.loadItems(true)
  },

  /**
   * 筛选器关闭
   */
  onFilterClose() {
    this.setData({ showFilterSheet: false })
  },

  /**
   * 重置筛选条件
   */
  onResetFilters() {
    console.log('🔍 重置所有筛选条件')
    
    this.setData({
      currentFilters: {},
      selectedFilters: {},
      hasActiveFilters: false,
      filterCount: 0,
      page: 1,
      items: [],
      loadedIds: []
    })
    
    this.updateFilterStatus()
    this.loadItems(true)
  },

  /**
   * 快速筛选标签点击
   */
  onQuickFilter(e) {
    const { type } = e.currentTarget.dataset
    console.log('🔍 快速筛选点击:', type)
    
    // 所有标签都打开对应的单项筛选器
    this.showSpecificFilter(type)
  },

  /**
   * 显示特定筛选器
   */
  showSpecificFilter(filterType) {
    const filterConfig = {
      category: {
        title: '分类',
        options: ["沙发","床","桌子","椅子","柜子","装饰","灯具","地毯"]
      },
      size: {
        title: '尺寸',
        options: ["小型","中型","大型","超大型"]
      },
      color: {
        title: '颜色',
        options: ["白色","黑色","灰色","棕色","米色","蓝色","绿色","红色","黄色","粉色"]
      },
      style: {
        title: '风格',
        options: ["现代","北欧","极简","工业","简约","复古","田园","中式","美式"]
      },
      material: {
        title: '材质选择',
        options: ["布艺","皮质","实木","金属","玻璃","塑料","藤编","大理石"]
      },
      brand: {
        title: '品牌选择',
        options: ["HomeNest","Oak&Co","WoodCraft","ComfortSeats","IKEA","宜家","无印良品","HAY"]
      },
      condition: {
        title: '成色等级',
        options: ["全新","九五新","九成新","八成新","七成新"]
      },
      price: {
        title: '价格范围',
        options: [] // 价格使用完整筛选器
      },
      delivery: {
        title: '配送方式',
        options: ["送货到门","白手套安装","自提","快递配送"]
      },
      availability: {
        title: '库存状态',
        options: ["现货","预订","缺货"]
      },
      discount: {
        title: '优惠活动',
        options: ["限时特价","买一送一","新用户优惠","会员专享"]
      }
    }

    const config = filterConfig[filterType]
    if (!config) {
      console.error('未知的筛选类型:', filterType)
      return
    }

    // 价格筛选也使用单项筛选器
    // 不需要特殊处理，和其他筛选一样

    // 获取当前选中的值
    const currentSelected = this.data.currentFilters[filterType] || []

    this.setData({
      showSingleFilter: true,
      singleFilterType: filterType,
      singleFilterTitle: config.title,
      singleFilterOptions: config.options,
      singleFilterSelected: currentSelected
    })
  },

  /**
   * 选择邮编
   */
  onSelectPostcode() {
    wx.showToast({
      title: '邮编选择功能开发中',
      icon: 'none'
    })
  },

  /**
   * 选择门店
   */
  onSelectStore() {
    wx.showToast({
      title: '门店选择功能开发中',
      icon: 'none'
    })
  },

  /**
   * 单项筛选器应用
   */
  onSingleFilterApply(e) {
    const { type, values, priceRange } = e.detail
    console.log('🔍 单项筛选器应用:', { type, values, priceRange })

    // 更新筛选条件
    const newFilters = { ...this.data.currentFilters }
    
    if (type === 'price') {
      // 价格筛选处理
      if (priceRange) {
        newFilters.price = {
          min: priceRange.min,
          max: priceRange.max
        }
      } else {
        delete newFilters.price
      }
    } else {
      // 其他筛选处理
      if (values && values.length > 0) {
        newFilters[type] = values
      } else {
        delete newFilters[type]
      }
    }

    this.setData({
      currentFilters: newFilters,
      selectedFilters: this.formatFiltersForAPI(newFilters),
      page: 1,
      items: [],
      loadedIds: []
    })

    this.updateFilterStatus()
    this.loadItems(true)
  },

  /**
   * 单项筛选器关闭
   */
  onSingleFilterClose() {
    this.setData({
      showSingleFilter: false,
      singleFilterType: '',
      singleFilterTitle: '',
      singleFilterOptions: [],
      singleFilterSelected: []
    })
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
    const { hasMore, loading, page, total_pages, total, currentSort } = this.data
    
    // 检查是否可以加载更多
    if (!hasMore || loading || page >= total_pages) {
      return
    }
    
    // 追踪加载更多行为
    track(TrackEvents.LIST_LOAD_MORE, {
      page: page + 1,
      currentTotal: this.data.items.length,
      totalAvailable: total,
      sort: currentSort,
      hasFilters: Object.keys(this.data.currentFilters).length > 0
    })
    
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
          // 即选即用排序
          this.setData({
            currentSort: selectedSort.key,
            currentSortName: selectedSort.name,
            page: 1,
            items: [],
            loadedIds: [] // 重置去重集合
          })
          
          // 立即重新获取数据
          this.loadItems(true)
          
          // 滚动到列表顶部
          wx.pageScrollTo({ 
            scrollTop: this.data.listTop || 0, 
            duration: 300 
          })
          
          // 埋点追踪
          try {
            const { track, TrackEvents } = require('../../utils/track.js')
            track(TrackEvents.SORT_CHANGE, {
              old_sort: currentSort,
              new_sort: selectedSort.key,
              sort_name: selectedSort.name,
              from_page: 'list'
            })
          } catch (error) {
            console.warn('埋点失败:', error)
          }
        }
      }
    })
  },

  /**
   * 更新筛选状态
   */
  updateFilterStatus() {
    const { currentFilters } = this.data
    console.log('🔍 更新筛选状态，currentFilters:', currentFilters)
    
    let hasActiveFilters = false
    let filterCount = 0

    // 检查是否有活跃的筛选条件
    if (currentFilters && typeof currentFilters === 'object') {
      Object.keys(currentFilters).forEach(key => {
        const value = currentFilters[key]
        console.log('🔍 检查筛选项:', key, value)
        
        if (key === 'price' && value) {
          // 价格范围筛选：检查是否不是默认值
          if (value.min !== 8 || value.max !== 15) {
            hasActiveFilters = true
            filterCount++
            console.log('🔍 价格筛选生效:', value)
          }
        } else if (Array.isArray(value) && value.length > 0) {
          // 多选筛选：数组不为空
          hasActiveFilters = true
          filterCount += value.length
          console.log('🔍 多选筛选生效:', key, value.length)
        } else if (typeof value === 'boolean' && value) {
          // 布尔筛选：为true
          hasActiveFilters = true
          filterCount++
          console.log('🔍 布尔筛选生效:', key)
        }
      })
    }

    console.log('🔍 最终筛选状态:', { hasActiveFilters, filterCount })

    this.setData({
      hasActiveFilters,
      filterCount
    })
  }
})
