// components/filter-sheet/filter-sheet.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示筛选器
    visible: {
      type: Boolean,
      value: false
    },
    // 筛选器配置schema
    schema: {
      type: Array,
      value: []
    },
    // 当前筛选值
    values: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 内部筛选值（用于实时更新，点击应用后才提交）
    internalValues: {},
    // 滑块值（用于range类型）
    sliderValues: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭筛选器
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 重置筛选条件
     */
    onReset() {
      const resetValues = {}
      const resetSliderValues = {}
      
      this.data.schema.forEach(item => {
        if (item.type === 'range') {
          resetValues[item.key] = { min: item.min, max: item.max }
          resetSliderValues[item.key] = [item.min, item.max]
        } else if (item.type === 'multi') {
          resetValues[item.key] = []
        } else if (item.type === 'bool') {
          resetValues[item.key] = false
        }
      })
      
      this.setData({
        internalValues: resetValues,
        sliderValues: resetSliderValues
      })
    },

    /**
     * 应用筛选条件
     */
    onApply() {
      const filterData = { ...this.data.internalValues }
      
      // 清理空值和默认值
      Object.keys(filterData).forEach(key => {
        const schemaItem = this.data.schema.find(item => item.key === key)
        if (!schemaItem) return
        
        if (schemaItem.type === 'multi' && (!filterData[key] || filterData[key].length === 0)) {
          delete filterData[key]
        } else if (schemaItem.type === 'range') {
          const value = filterData[key]
          if (value.min === schemaItem.min && value.max === schemaItem.max) {
            delete filterData[key]
          }
        } else if (schemaItem.type === 'bool' && !filterData[key]) {
          delete filterData[key]
        }
      })
      
      this.triggerEvent('apply', filterData)
      this.triggerEvent('close')
    },

    /**
     * 多选项切换
     */
    onMultiToggle(e) {
      const { key, option } = e.currentTarget.dataset
      const currentValues = this.data.internalValues[key] || []
      const index = currentValues.indexOf(option)
      
      let newValues
      if (index > -1) {
        // 取消选择
        newValues = currentValues.filter(item => item !== option)
      } else {
        // 添加选择
        newValues = [...currentValues, option]
      }
      
      this.setData({
        [`internalValues.${key}`]: newValues
      })
    },

    /**
     * 布尔值切换
     */
    onBoolToggle(e) {
      const { key } = e.currentTarget.dataset
      const currentValue = this.data.internalValues[key] || false
      
      this.setData({
        [`internalValues.${key}`]: !currentValue
      })
    },

    /**
     * 价格手动输入
     */
    onPriceInput(e) {
      const { key, type } = e.currentTarget.dataset
      const value = parseInt(e.detail.value) || 0
      const currentValues = this.data.internalValues[key] || { min: 0, max: 1000 }
      
      console.log('🔍 价格输入:', { key, type, value })
      
      if (type === 'min') {
        currentValues.min = Math.max(0, Math.min(value, currentValues.max))
      } else if (type === 'max') {
        currentValues.max = Math.max(currentValues.min, Math.min(value, 1000))
      }
      
      this.setData({
        [`internalValues.${key}`]: currentValues
      })
      
      console.log('🔍 价格范围更新:', currentValues)
    },

    /**
     * 范围滑块变化
     */
    onRangeChange(e) {
      const { key } = e.currentTarget.dataset
      const value = e.detail.value
      const schemaItem = this.data.schema.find(item => item.key === key)
      
      console.log('🔍 滑块变化:', { key, value })
      
      // 简化为单个滑块控制最大值
      const currentValues = this.data.internalValues[key] || { min: 0, max: 1000 }
      currentValues.max = value
      
      this.setData({
        [`internalValues.${key}`]: currentValues
      })
      
      console.log('🔍 滑块更新后价格范围:', currentValues)
    },

    /**
     * 获取活跃筛选项数量
     */
    getActiveFiltersCount() {
      let count = 0
      const values = this.data.internalValues
      
      this.data.schema.forEach(item => {
        const value = values[item.key]
        if (item.type === 'multi' && value && value.length > 0) {
          count += value.length
        } else if (item.type === 'bool' && value) {
          count += 1
        } else if (item.type === 'range' && value) {
          if (value.min !== item.min || value.max !== item.max) {
            count += 1
          }
        }
      })
      
      return count
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化内部值
      const internalValues = { ...this.data.values }
      const sliderValues = {}
      
      this.data.schema.forEach(item => {
        if (item.type === 'range') {
          const value = internalValues[item.key] || { min: item.min, max: item.max }
          internalValues[item.key] = value
          sliderValues[item.key] = [value.min, value.max]
        } else if (item.type === 'multi') {
          internalValues[item.key] = internalValues[item.key] || []
        } else if (item.type === 'bool') {
          internalValues[item.key] = internalValues[item.key] || false
        }
      })
      
      this.setData({
        internalValues,
        sliderValues
      })
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'values': function(newValues) {
      const internalValues = { ...newValues }
      const sliderValues = {}
      
      this.data.schema.forEach(item => {
        if (item.type === 'range') {
          const value = internalValues[item.key] || { min: item.min, max: item.max }
          internalValues[item.key] = value
          sliderValues[item.key] = [value.min, value.max]
        }
      })
      
      this.setData({
        internalValues,
        sliderValues
      })
    }
  }
})