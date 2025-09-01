// pages/filter/filter.js
Page({
  data: {
    filterType: '',
    currentFilters: {},
    selectedOptions: [],
    filterOptions: {},
    filterTitle: '',
    loading: false
  },

  onLoad(options) {
    const { type, currentFilters } = options
    const filters = currentFilters ? JSON.parse(decodeURIComponent(currentFilters)) : {}
    
    this.setData({
      filterType: type,
      currentFilters: filters,
      selectedOptions: filters[type] || []
    })
    
    this.loadFilterOptions(type)
  },

  /**
   * 加载筛选选项
   */
  loadFilterOptions(type) {
    const filterConfig = {
      category: {
        title: '商品分类',
        options: [
          { value: '沙发', label: '沙发' },
          { value: '床', label: '床' },
          { value: '桌子', label: '桌子' },
          { value: '椅子', label: '椅子' },
          { value: '柜子', label: '柜子' },
          { value: '装饰', label: '装饰' },
          { value: '灯具', label: '灯具' },
          { value: '地毯', label: '地毯' }
        ]
      },
      material: {
        title: '材质选择',
        options: [
          { value: '布艺', label: '布艺' },
          { value: '皮质', label: '皮质' },
          { value: '实木', label: '实木' },
          { value: '金属', label: '金属' },
          { value: '玻璃', label: '玻璃' },
          { value: '塑料', label: '塑料' },
          { value: '藤编', label: '藤编' },
          { value: '大理石', label: '大理石' }
        ]
      },
      color: {
        title: '颜色选择',
        options: [
          { value: '白色', label: '白色' },
          { value: '黑色', label: '黑色' },
          { value: '灰色', label: '灰色' },
          { value: '棕色', label: '棕色' },
          { value: '米色', label: '米色' },
          { value: '蓝色', label: '蓝色' },
          { value: '绿色', label: '绿色' },
          { value: '红色', label: '红色' },
          { value: '黄色', label: '黄色' },
          { value: '粉色', label: '粉色' }
        ]
      },
      style: {
        title: '风格样式',
        options: [
          { value: '现代', label: '现代' },
          { value: '北欧', label: '北欧' },
          { value: '极简', label: '极简' },
          { value: '工业', label: '工业' },
          { value: '简约', label: '简约' },
          { value: '复古', label: '复古' },
          { value: '田园', label: '田园' },
          { value: '中式', label: '中式' },
          { value: '美式', label: '美式' }
        ]
      },
      brand: {
        title: '品牌选择',
        options: [
          { value: 'HomeNest', label: 'HomeNest' },
          { value: 'Oak&Co', label: 'Oak&Co' },
          { value: 'WoodCraft', label: 'WoodCraft' },
          { value: 'ComfortSeats', label: 'ComfortSeats' },
          { value: 'IKEA', label: 'IKEA' },
          { value: '宜家', label: '宜家' },
          { value: '无印良品', label: '无印良品' },
          { value: 'HAY', label: 'HAY' }
        ]
      },
      condition: {
        title: '成色等级',
        options: [
          { value: '全新', label: '全新' },
          { value: '九五新', label: '九五新' },
          { value: '九成新', label: '九成新' },
          { value: '八成新', label: '八成新' },
          { value: '七成新', label: '七成新' }
        ]
      }
    }

    const config = filterConfig[type]
    if (config) {
      this.setData({
        filterOptions: config.options,
        filterTitle: config.title
      })
    }
  },

  /**
   * 选择筛选选项
   */
  onOptionSelect(e) {
    const { value } = e.currentTarget.dataset
    const { selectedOptions } = this.data
    
    let newSelectedOptions = []
    if (selectedOptions.includes(value)) {
      // 取消选择
      newSelectedOptions = selectedOptions.filter(item => item !== value)
    } else {
      // 添加选择
      newSelectedOptions = [...selectedOptions, value]
    }
    
    this.setData({
      selectedOptions: newSelectedOptions
    })
  },

  /**
   * 确认筛选
   */
  onConfirmFilter() {
    const { filterType, selectedOptions } = this.data
    
    // 返回上一页并传递筛选结果
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage) {
      // 更新上一页的筛选条件
      const currentFilters = { ...prevPage.data.currentFilters }
      if (selectedOptions.length > 0) {
        currentFilters[filterType] = selectedOptions
      } else {
        delete currentFilters[filterType]
      }
      
      prevPage.setData({
        currentFilters,
        hasActiveFilters: Object.keys(currentFilters).length > 0,
        filterCount: Object.keys(currentFilters).length
      })
      
      // 应用筛选
      prevPage.applyFilterFromPage(filterType, selectedOptions)
    }
    
    wx.navigateBack()
  },

  /**
   * 重置筛选
   */
  onResetFilter() {
    this.setData({
      selectedOptions: []
    })
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  }
})
