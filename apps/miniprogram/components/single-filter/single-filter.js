// components/single-filter/single-filter.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'category' // category, size, color, style, material
    },
    title: {
      type: String,
      value: '筛选'
    },
    options: {
      type: Array,
      value: []
    },
    selectedValues: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    internalSelected: [],
    selectedPriceRange: '',
    priceRanges: [
      { label: '£0 - 9', min: 0, max: 9, count: 366 },
      { label: '£10 - 19', min: 10, max: 19, count: 205 },
      { label: '£20 - 29', min: 20, max: 29, count: 118 },
      { label: '£30 - 39', min: 30, max: 39, count: 106 },
      { label: '£40+', min: 40, max: 999, count: 1274 }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取颜色代码
     */
    getColorCode(colorName) {
      const colorMap = {
        '白色': '#FFFFFF',
        '黑色': '#000000',
        '灰色': '#808080',
        '棕色': '#8B4513',
        '米色': '#F5F5DC',
        '蓝色': '#0066CC',
        '绿色': '#228B22',
        '红色': '#DC143C',
        '黄色': '#FFD700',
        '粉色': '#FF69B4'
      }
      return colorMap[colorName] || '#E0E0E0'
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡
    },

    /**
     * 遮罩点击
     */
    onMaskTap() {
      this.onClose()
    },

    /**
     * 关闭筛选器
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 重置选择
     */
    onReset() {
      this.setData({
        internalSelected: [],
        selectedPriceRange: ''
      })
    },

    /**
     * 选择价格区间
     */
    onSelectPriceRange(e) {
      const { range } = e.currentTarget.dataset
      console.log('🔍 选择价格区间:', range)
      
      // 单选模式，选择新的取消旧的
      const newRange = this.data.selectedPriceRange === range ? '' : range
      
      this.setData({
        selectedPriceRange: newRange
      })
    },

    /**
     * 切换选项
     */
    onToggleOption(e) {
      const { value } = e.currentTarget.dataset
      const { internalSelected } = this.data
      const index = internalSelected.indexOf(value)
      
      let newSelected
      if (index > -1) {
        // 取消选择
        newSelected = internalSelected.filter(item => item !== value)
      } else {
        // 添加选择
        newSelected = [...internalSelected, value]
      }
      
      console.log('🔍 单项筛选器选择:', { type: this.data.type, value, newSelected })
      
      this.setData({
        internalSelected: newSelected
      })
    },

    /**
     * 应用筛选
     */
    onApply() {
      const { type } = this.data
      
      if (type === 'price') {
        // 价格筛选处理
        const { selectedPriceRange } = this.data
        if (selectedPriceRange) {
          const priceRange = this.data.priceRanges.find(range => range.label === selectedPriceRange)
          console.log('🔍 应用价格筛选:', { range: selectedPriceRange, priceRange })
          
          this.triggerEvent('apply', {
            type,
            priceRange: {
              min: priceRange.min,
              max: priceRange.max,
              label: priceRange.label
            }
          })
        } else {
          this.triggerEvent('apply', { type, priceRange: null })
        }
      } else {
        // 其他筛选处理
        const { internalSelected } = this.data
        console.log('🔍 应用单项筛选:', { type, selected: internalSelected })
        
        this.triggerEvent('apply', {
          type,
          values: internalSelected
        })
      }
      
      this.onClose()
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'selectedValues': function(newValues) {
      this.setData({
        internalSelected: [...(newValues || [])]
      })
    }
  }
})
