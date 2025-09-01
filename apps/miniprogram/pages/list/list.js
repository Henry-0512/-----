// pages/list/list.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { track, TrackEvents } = require('../../utils/track.js')
const { deriveConditionText } = require('../../utils/condition.js')
const { getCategoryDisplay } = require('../../utils/category-icons.js')

// 统一两列卡片宽高（rpx）
const PAGE_PAD = 24
const GUTTER = 16
const CARD_W = Math.floor((750 - PAGE_PAD*2 - GUTTER)/2) // ≈343 → 用 342 更稳
const IMG_RATIO = 0.85 // 图片更"长"更好看（宜家风），想短就降到 0.78
const IMG_H = Math.round(CARD_W * IMG_RATIO)

// 大图列表尺寸配置
const LV_CARD_W = 750 - PAGE_PAD*2   // 单列卡片宽度
const LV_IMG_RATIO = 0.86            // 大图比例（更长更好看，0.80~0.90 皆可）
const LV_IMG_H = Math.round(LV_CARD_W * LV_IMG_RATIO)

function attachConditionText(list){
  return (list || []).map(it => ({
    ...it,
    _conditionText: deriveConditionText(it)
  }))
}



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
    
    error: null,
    cardW: 342, // 固定使用 342 更稳
    imgH: IMG_H,
    
    // 大图列表视图配置
    viewMode: 'list',    // 'list' | 'grid'；默认 list
    lvCardW: LV_CARD_W,
    lvImgH: LV_IMG_H
  },

  onLoad(options) {
    console.log('🔍 列表页onLoad被调用:', options)
    
    // 调试：检查滚动区域
    setTimeout(() => {
      const query = this.createSelectorQuery()
      query.select('.filter-scroll').boundingClientRect()
      query.selectAll('.filter-tag').boundingClientRect()
      query.exec((res) => {
        console.log('🔍 滚动容器尺寸:', res[0])
        console.log('🔍 标签数量:', res[1] ? res[1].length : 0)
        if (res[1] && res[1].length > 0) {
          const tagWidths = res[1].reduce((sum, tag) => sum + tag.width, 0)
          const gaps = (res[1].length - 1) * 20 // gap: 20rpx
          const padding = 48 // 左右padding各24rpx
          const totalWidth = tagWidths + gaps + padding
          
          console.log('🔍 标签总宽度:', tagWidths)
          console.log('🔍 间距总宽度:', gaps)
          console.log('🔍 内边距宽度:', padding)
          console.log('🔍 内容总宽度:', totalWidth)
          console.log('🔍 平均标签宽度:', tagWidths / res[1].length)
          
          if (res[0]) {
            console.log('🔍 容器宽度:', res[0].width)
            console.log('🔍 是否需要滚动:', totalWidth > res[0].width)
            console.log('🔍 宽度差:', totalWidth - res[0].width)
            
            if (totalWidth > res[0].width) {
              console.log('✅ 内容超出', totalWidth - res[0].width, 'rpx，应该可以滚动')
            } else {
              console.log('❌ 内容没有超出，需要增加更多内容')
            }
          }
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
    
    // 根据入口分类初始化筛选
    const initialCurrentFilters = {}
    const initialSelectedFilters = {}
    if (category) {
      const decoded = decodeURIComponent(category)
      initialCurrentFilters.category = [decoded]
      initialSelectedFilters.categories = [decoded]
    }

    // 加载用户保存的视图模式
    const { storage } = require('../../utils/request.js')
    const savedViewMode = storage.get('viewMode') || 'list'
    
    this.setData({ 
      pageTitle,
      loading: false,
      currentFilters: initialCurrentFilters,
      selectedFilters: initialSelectedFilters,
      hasActiveFilters: Object.keys(initialCurrentFilters).length > 0,
      filterCount: initialCurrentFilters.category ? initialCurrentFilters.category.length : 0,
      viewMode: savedViewMode
    })
    
    // 更新筛选状态
    this.updateFilterStatus()
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: pageTitle
    })
    
    console.log('🔍 列表页onLoad完成')
    
    // 恢复数据加载（带入初始分类）
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
      
      // 处理分类图标
      const categoriesWithIcons = (res.data.categories || []).map(cat => ({
        ...cat,
        ...getCategoryDisplay(cat)
      }))
      
      this.setData({
        filterOptions: {
          ...res.data,
          categories: categoriesWithIcons
        },
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
        
        // 去重处理并添加成色样式
        const uniqueItems = newItems.filter(item => {
          if (loadedIds.includes(item.id)) {
            return false
          }
          loadedIds.push(item.id)
          return true
        }).map(item => ({
          ...item,
          conditionClass: this.mapBadgeClass(item.condition_grade || item.condition),
          conditionText: item.condition_grade || item.condition || '全新'
        }))
        
        // 合并数据
        let rawItems = page === 1 ? uniqueItems : [...this.data.items, ...uniqueItems]
        
        // 前端排序处理（兜底，防止后端未按预期排序）
        if (rawItems.length > 0) {
          if (currentSort === 'condition_new') {
            // 成色从新到旧：全新 > 九五新 > 九成新 > 八成新 > 七成新
            const conditionOrder = { '全新': 5, '九五新': 4, '九成新': 3, '八成新': 2, '七成新': 1 }
            rawItems.sort((a, b) => {
              const aCondition = deriveConditionText(a)
              const bCondition = deriveConditionText(b)
              const aOrder = conditionOrder[aCondition] || 0
              const bOrder = conditionOrder[bCondition] || 0
              return bOrder - aOrder // 从新到旧，所以是降序
            })
          } else if (currentSort === 'condition_old') {
            // 成色从旧到新：七成新 > 八成新 > 九成新 > 九五新 > 全新
            const conditionOrder = { '全新': 5, '九五新': 4, '九成新': 3, '八成新': 2, '七成新': 1 }
            rawItems.sort((a, b) => {
              const aCondition = deriveConditionText(a)
              const bCondition = deriveConditionText(b)
              const aOrder = conditionOrder[aCondition] || 0
              const bOrder = conditionOrder[bCondition] || 0
              return aOrder - bOrder // 从旧到新，所以是升序
            })
          }
        }
        
        const items = attachConditionText(rawItems)
        
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
      
      // 详细调试排序结果（兜底前端排序，防止后端/Mock未按预期排）
      if (newItems.length > 0) {
        const getRent = (x) => {
          const v = x.rent_monthly_gbp != null ? x.rent_monthly_gbp : x.monthlyPrice
          const n = Number(v)
          return Number.isNaN(n) ? 0 : n
        }

        if (currentSort === 'rent_asc') {
          newItems.sort((a, b) => getRent(a) - getRent(b))
          console.log('🔍 前端月租升序排序后:', newItems.slice(0, 5).map(i => ({ id: i.id, rent: getRent(i) })))
        } else if (currentSort === 'rent_desc') {
          newItems.sort((a, b) => getRent(b) - getRent(a))
          console.log('🔍 前端月租降序排序后:', newItems.slice(0, 5).map(i => ({ id: i.id, rent: getRent(i) })))
        } else if (currentSort === 'condition_new') {
          // 成色从新到旧：全新 > 九五新 > 九成新 > 八成新 > 七成新
          const conditionOrder = { '全新': 5, '九五新': 4, '九成新': 3, '八成新': 2, '七成新': 1 }
          newItems.sort((a, b) => {
            const aCondition = deriveConditionText(a)
            const bCondition = deriveConditionText(b)
            const aOrder = conditionOrder[aCondition] || 0
            const bOrder = conditionOrder[bCondition] || 0
            return bOrder - aOrder // 从新到旧，所以是降序
          })
          console.log('🔍 前端成色从新到旧排序后:', newItems.slice(0, 5).map(i => ({ id: i.id, condition: deriveConditionText(i) })))
        } else if (currentSort === 'condition_old') {
          // 成色从旧到新：七成新 > 八成新 > 九成新 > 九五新 > 全新
          const conditionOrder = { '全新': 5, '九五新': 4, '九成新': 3, '八成新': 2, '七成新': 1 }
          newItems.sort((a, b) => {
            const aCondition = deriveConditionText(a)
            const bCondition = deriveConditionText(b)
            const aOrder = conditionOrder[aCondition] || 0
            const bOrder = conditionOrder[bCondition] || 0
            return aOrder - bOrder // 从旧到新，所以是升序
          })
          console.log('🔍 前端成色从旧到新排序后:', newItems.slice(0, 5).map(i => ({ id: i.id, condition: deriveConditionText(i) })))
        }
      }
      
      const rawItems = reset ? newItems : [...this.data.items, ...newItems]
      const items = attachConditionText(rawItems)
      
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
    
    // 根据筛选类型应用不同的筛选逻辑
    switch (type) {
      case 'category':
        this.applyCategoryFilter()
        break
      case 'material':
        this.applyMaterialFilter()
        break
      case 'color':
        this.applyColorFilter()
        break
      case 'style':
        this.applyStyleFilter()
        break
      case 'brand':
        this.applyBrandFilter()
        break
      case 'condition':
        this.applyConditionFilter()
        break
      default:
        // 其他筛选类型打开对应的单项筛选器
        this.showSpecificFilter(type)
    }
  },

  /**
   * 应用分类筛选
   */
  applyCategoryFilter() {
    const { items } = this.data
    const categories = ['沙发', '床', '桌子', '椅子', '柜子', '装饰', '灯具', '地毯']
    
    // 显示分类选择弹窗
    wx.showActionSheet({
      itemList: categories,
      success: (res) => {
        const selectedCategory = categories[res.tapIndex]
        console.log('🔍 选择分类:', selectedCategory)
        
        this.applyFilter('category', [selectedCategory], selectedCategory)
      }
    })
  },

  /**
   * 应用材质筛选
   */
  applyMaterialFilter() {
    const materials = ['布艺', '皮质', '实木', '金属', '玻璃', '塑料', '藤编', '大理石']
    
    wx.showActionSheet({
      itemList: materials,
      success: (res) => {
        const selectedMaterial = materials[res.tapIndex]
        this.applyFilter('material', [selectedMaterial], selectedMaterial)
      }
    })
  },

  /**
   * 应用颜色筛选
   */
  applyColorFilter() {
    const colors = ['白色', '黑色', '灰色', '棕色', '米色', '蓝色', '绿色', '红色', '黄色', '粉色']
    
    wx.showActionSheet({
      itemList: colors,
      success: (res) => {
        const selectedColor = colors[res.tapIndex]
        this.applyFilter('color', [selectedColor], selectedColor)
      }
    })
  },

  /**
   * 应用风格筛选
   */
  applyStyleFilter() {
    const styles = ['现代', '北欧', '极简', '工业', '简约', '复古', '田园', '中式', '美式']
    
    wx.showActionSheet({
      itemList: styles,
      success: (res) => {
        const selectedStyle = styles[res.tapIndex]
        this.applyFilter('style', [selectedStyle], selectedStyle)
      }
    })
  },

  /**
   * 应用品牌筛选
   */
  applyBrandFilter() {
    const brands = ['HomeNest', 'Oak&Co', 'WoodCraft', 'ComfortSeats', 'IKEA', '宜家', '无印良品', 'HAY']
    
    wx.showActionSheet({
      itemList: brands,
      success: (res) => {
        const selectedBrand = brands[res.tapIndex]
        this.applyFilter('brand', [selectedBrand], selectedBrand)
      }
    })
  },

  /**
   * 应用成色筛选
   */
  applyConditionFilter() {
    const conditions = ['全新', '九五新', '九成新', '八成新', '七成新']
    
    wx.showActionSheet({
      itemList: conditions,
      success: (res) => {
        const selectedCondition = conditions[res.tapIndex]
        this.applyFilter('condition', [selectedCondition], selectedCondition)
      }
    })
  },

  /**
   * 通用筛选方法
   */
  applyFilter(filterType, filterValues, displayName) {
    const { items } = this.data
    
    // 筛选商品
    const filteredItems = items.filter(item => {
      switch (filterType) {
        case 'category':
          const itemCategory = item.category || item.categories || []
          const categoryArray = Array.isArray(itemCategory) ? itemCategory : [itemCategory]
          return categoryArray.some(cat => 
            cat && filterValues.some(val => cat.includes(val) || val.includes(cat))
          )
        
        case 'material':
          const itemMaterial = item.material || []
          const materialArray = Array.isArray(itemMaterial) ? itemMaterial : [itemMaterial]
          return materialArray.some(mat => 
            mat && filterValues.some(val => mat.includes(val) || val.includes(mat))
          )
        
        case 'color':
          const itemColor = item.color || []
          const colorArray = Array.isArray(itemColor) ? itemColor : [itemColor]
          return colorArray.some(col => 
            col && filterValues.some(val => col.includes(val) || val.includes(col))
          )
        
        case 'style':
          const itemStyle = item.style || []
          const styleArray = Array.isArray(itemStyle) ? itemStyle : [itemStyle]
          return styleArray.some(sty => 
            sty && filterValues.some(val => sty.includes(val) || val.includes(sty))
          )
        
        case 'brand':
          const itemBrand = item.brand || ''
          return filterValues.some(val => 
            itemBrand && (itemBrand.includes(val) || val.includes(itemBrand))
          )
        
        case 'condition':
          const itemCondition = item.condition_grade || item.condition || ''
          return filterValues.some(val => 
            itemCondition && (itemCondition.includes(val) || val.includes(itemCondition))
          )
        
        default:
          return true
      }
    })
    
    // 更新筛选状态
    const currentFilters = { ...this.data.currentFilters }
    currentFilters[filterType] = filterValues
    
    this.setData({
      items: filteredItems,
      currentFilters,
      hasActiveFilters: true,
      filterCount: Object.keys(currentFilters).length,
      isEmpty: filteredItems.length === 0
    })
    
    // 显示筛选结果提示
    wx.showToast({
      title: `已筛选${filteredItems.length}件商品`,
      icon: 'success'
    })
  },

  /**
   * 清除所有筛选
   */
  clearAllFilters() {
    this.setData({
      currentFilters: {},
      hasActiveFilters: false,
      filterCount: 0,
      isEmpty: false
    })
    
    // 重新加载原始数据
    this.loadItems(true)
    
    wx.showToast({
      title: '已清除所有筛选',
      icon: 'success'
    })
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
      },
      room: {
        title: '房间类型',
        options: ["客厅","卧室","书房","餐厅","阳台","儿童房"]
      },
      feature: {
        title: '特殊功能',
        options: ["可折叠","可调节","带储物","防水","抗菌","智能"]
      },
      warranty: {
        title: '保修期限',
        options: ["1年","2年","3年","5年","终身保修"]
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
    try {
      const pages = getCurrentPages()
      if (pages && pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        // 无历史页面时，兜底回到首页
        if (wx.switchTab) {
          wx.switchTab({ url: '/pages/index/index' })
        } else {
          wx.reLaunch({ url: '/pages/index/index' })
        }
      }
    } catch (e) {
      // 发生异常时同样兜底回首页
      wx.reLaunch({ url: '/pages/index/index' })
    }
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
  },

  /**
   * 成色样式映射函数
   */
  mapBadgeClass(condition) {
    if (!condition) return ''
    const v = String(condition)
    if (v.includes('全新') || v === 'new') return 'badge-new'
    if (v.includes('95') || v.includes('九五')) return 'badge-95'
    if (v.includes('90') || v.includes('九成')) return 'badge-90'
    return ''
  },

  /**
   * 切换收藏状态
   */
  onToggleFav(e) {
    const { id } = e.currentTarget.dataset
    const { items } = this.data
    
    // 找到对应的商品
    const product = items.find(item => item.id === id)
    if (!product) {
      console.error('未找到商品:', id)
      return
    }
    
    // 获取当前收藏列表
    const { storage } = require('../../utils/request.js')
    let favorites = storage.get('favorites') || []
    
    // 检查是否已收藏
    const existingIndex = favorites.findIndex(item => item.id === id)
    
    if (existingIndex >= 0) {
      // 取消收藏
      favorites.splice(existingIndex, 1)
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      })
    } else {
      // 添加收藏
      const favoriteItem = {
        id: product.id,
        title: product.title || product.name,
        cover: product.cover || product.image || (product.images && product.images[0] ? product.images[0].url : ''),
        rent_monthly_gbp: product.rent_monthly_gbp || product.monthly || 8,
        purchase_price_gbp: product.purchase_price_gbp || product.msrp,
        brand: product.brand || 'LivingLux',
        material: product.material || '科技布',
        color: product.color || '灰色',
        condition_grade: product.condition_grade || product.condition,
        addedAt: new Date().toISOString()
      }
      favorites.push(favoriteItem)
      wx.showToast({
        title: '已添加到收藏',
        icon: 'success'
      })
    }
    
    // 保存到本地存储
    storage.set('favorites', favorites)
    
    // 更新页面数据
    const updatedItems = items.map(item => {
      if (item.id === id) {
        return { ...item, favored: existingIndex < 0 }
      }
      return item
    })
    
    this.setData({
      items: updatedItems
    })
    
    console.log('收藏状态已更新:', id, existingIndex < 0 ? '已收藏' : '已取消收藏')
  },

  /**
   * 添加购物车
   */
  onAddToCart(e) {
    const { id } = e.currentTarget.dataset
    const { items } = this.data
    
    // 找到对应的商品
    const product = items.find(item => item.id === id)
    if (!product) {
      console.error('未找到商品:', id)
      return
    }
    
    // 获取当前购物车列表
    const { storage } = require('../../utils/request.js')
    let cartItems = storage.get('cartItems') || []
    
    // 检查是否已在购物车中
    const existingIndex = cartItems.findIndex(item => item.id === id)
    
    if (existingIndex >= 0) {
      // 增加数量
      cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 1) + 1
      wx.showToast({
        title: '数量已增加',
        icon: 'success'
      })
    } else {
      // 添加到购物车
      const cartItem = {
        id: product.id,
        title: product.title || product.name,
        cover: product.cover || product.image || (product.images && product.images[0] ? product.images[0].url : ''),
        rent_monthly_gbp: product.rent_monthly_gbp || product.monthly || 8,
        purchase_price_gbp: product.purchase_price_gbp || product.msrp,
        brand: product.brand || 'LivingLux',
        material: product.material || '科技布',
        color: product.color || '灰色',
        condition_grade: product.condition_grade || product.condition,
        quantity: 1,
        selected: true,
        addedAt: new Date().toISOString()
      }
      cartItems.push(cartItem)
      wx.showToast({
        title: '已添加到购物车',
        icon: 'success'
      })
    }
    
    // 保存到本地存储
    storage.set('cartItems', cartItems)
    
    console.log('购物车已更新:', id, existingIndex >= 0 ? '数量增加' : '新添加')
  },

  /**
   * 查看选项
   */
  onOptions(e) {
    const { id } = e.currentTarget.dataset
    console.log('查看选项:', id)
    // TODO: 实现选项查看逻辑
  },

  /**
   * 商品卡片点击
   */
  onProductCardTap(e) {
    const { product } = e.currentTarget.dataset
    console.log('商品卡片点击:', product)
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}`
    })
  },

  /**
   * 切换视图模式
   */
  onToggleView(e) {
    const { mode } = e.currentTarget.dataset
    console.log('切换视图模式:', mode)
    
    // 显示切换提示
    wx.showToast({
      title: `切换到${mode === 'grid' ? '网格' : '大图'}视图`,
      icon: 'none',
      duration: 1000
    })
    
    this.setData({
      viewMode: mode
    })
    
    // 保存到本地存储，记住用户偏好
    const { storage } = require('../../utils/request.js')
    storage.set('viewMode', mode)
    
    console.log('视图模式已更新:', mode)
  }
})
