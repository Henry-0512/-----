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
    internalSelected: []
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
        internalSelected: []
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
      const { internalSelected } = this.data
      
      console.log('🔍 应用单项筛选:', { type, selected: internalSelected })
      
      this.triggerEvent('apply', {
        type,
        values: internalSelected
      })
      
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
