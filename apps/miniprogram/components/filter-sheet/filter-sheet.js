// components/filter-sheet/filter-sheet.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示筛选抽屉
    visible: {
      type: Boolean,
      value: false
    },
    // 筛选选项数据
    filterOptions: {
      type: Object,
      value: {
        categories: [],
        priceRanges: [],
        brands: []
      }
    },
    // 当前选中的筛选条件
    selectedFilters: {
      type: Object,
      value: {
        categories: [],
        priceRange: null,
        brands: []
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 临时筛选条件（用于确认前的预选）
    tempFilters: {
      categories: [],
      priceRange: null,
      brands: []
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'visible': function(visible) {
      if (visible) {
        // 显示时重置临时筛选条件为当前选中的条件
        this.setData({
          tempFilters: JSON.parse(JSON.stringify(this.data.selectedFilters))
        })
      }
    },
    'selectedFilters': function(selectedFilters) {
      // 同步更新临时筛选条件
      this.setData({
        tempFilters: JSON.parse(JSON.stringify(selectedFilters))
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭筛选抽屉
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 阻止事件冒泡
     */
    onContentTap() {
      // 阻止点击内容区域时关闭抽屉
    },

    /**
     * 切换分类选择
     */
    onCategoryTap(e) {
      const { category } = e.currentTarget.dataset
      const { tempFilters } = this.data
      const categories = [...tempFilters.categories]
      
      const index = categories.indexOf(category.id)
      if (index > -1) {
        categories.splice(index, 1)
      } else {
        categories.push(category.id)
      }
      
      this.setData({
        'tempFilters.categories': categories
      })
    },

    /**
     * 选择价格区间
     */
    onPriceRangeTap(e) {
      const { range } = e.currentTarget.dataset
      const { tempFilters } = this.data
      
      // 如果点击的是已选中的价格区间，则取消选择
      if (tempFilters.priceRange && tempFilters.priceRange.id === range.id) {
        this.setData({
          'tempFilters.priceRange': null
        })
      } else {
        this.setData({
          'tempFilters.priceRange': range
        })
      }
    },

    /**
     * 切换品牌选择
     */
    onBrandTap(e) {
      const { brand } = e.currentTarget.dataset
      const { tempFilters } = this.data
      const brands = [...tempFilters.brands]
      
      const index = brands.indexOf(brand.id)
      if (index > -1) {
        brands.splice(index, 1)
      } else {
        brands.push(brand.id)
      }
      
      this.setData({
        'tempFilters.brands': brands
      })
    },

    /**
     * 清空所有筛选条件
     */
    onClearAll() {
      this.setData({
        tempFilters: {
          categories: [],
          priceRange: null,
          brands: []
        }
      })
    },

    /**
     * 确认应用筛选条件
     */
    onConfirm() {
      const { tempFilters } = this.data
      
      // 触发筛选变化事件
      this.triggerEvent('filterchange', {
        filters: tempFilters
      })
      
      // 关闭抽屉
      this.triggerEvent('close')
    },

    /**
     * 检查分类是否被选中
     */
    isCategorySelected(categoryId) {
      const { tempFilters } = this.data
      return tempFilters.categories.includes(categoryId)
    },

    /**
     * 检查价格区间是否被选中
     */
    isPriceRangeSelected(rangeId) {
      const { tempFilters } = this.data
      return tempFilters.priceRange && tempFilters.priceRange.id === rangeId
    },

    /**
     * 检查品牌是否被选中
     */
    isBrandSelected(brandId) {
      const { tempFilters } = this.data
      return tempFilters.brands.includes(brandId)
    },

    /**
     * 获取选中的筛选条件数量
     */
    getSelectedCount() {
      const { tempFilters } = this.data
      let count = 0
      
      count += tempFilters.categories.length
      if (tempFilters.priceRange) count += 1
      count += tempFilters.brands.length
      
      return count
    }
  }
})
