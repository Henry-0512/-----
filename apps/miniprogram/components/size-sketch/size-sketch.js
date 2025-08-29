// components/size-sketch/size-sketch.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示尺寸示意图
    visible: {
      type: Boolean,
      value: false
    },
    // 商品信息
    product: {
      type: Object,
      value: {}
    },
    // 显示模式: 'modal' | 'inline'
    mode: {
      type: String,
      value: 'modal'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 当前显示的视角: 'front' | 'side' | 'top'
    currentView: 'front',
    // 是否显示尺寸标注
    showDimensions: true,
    // 比例尺
    scale: 1,
    // 缩放百分比（用于显示）
    scalePercent: 100,
    // 最小和最大缩放比例
    minScale: 0.5,
    maxScale: 3
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭尺寸示意图
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 阻止事件冒泡
     */
    onContentTap() {
      // 阻止点击内容区域时关闭
    },

    /**
     * 切换视角
     */
    onViewChange(e) {
      const { view } = e.currentTarget.dataset
      this.setData({ currentView: view })
    },

    /**
     * 切换尺寸标注显示
     */
    onToggleDimensions() {
      this.setData({ 
        showDimensions: !this.data.showDimensions 
      })
    },

    /**
     * 缩放控制
     */
    onScaleChange(e) {
      const { type } = e.currentTarget.dataset
      let { scale, minScale, maxScale } = this.data
      
      if (type === 'in' && scale < maxScale) {
        scale = Math.min(scale + 0.2, maxScale)
      } else if (type === 'out' && scale > minScale) {
        scale = Math.max(scale - 0.2, minScale)
      } else if (type === 'reset') {
        scale = 1
      }
      
      this.setData({ 
        scale,
        scalePercent: Math.round(scale * 100)
      })
    },

    /**
     * 获取尺寸文本
     */
    getDimensionText(dimension, value) {
      const dimensionMap = {
        length: '长',
        width: '宽', 
        height: '高'
      }
      return `${dimensionMap[dimension] || dimension}: ${value}cm`
    },

    /**
     * 获取当前视角的样式
     */
    getCurrentViewStyle() {
      const { product, currentView, scale } = this.data
      if (!product.dimensions) return {}

      const { length, width, height } = product.dimensions
      let viewStyle = {}

      // 基础样式
      const baseStyle = {
        transform: `scale(${scale})`,
        transition: 'transform 0.3s ease'
      }

      switch (currentView) {
        case 'front':
          // 正面视图 (宽 x 高)
          viewStyle = {
            ...baseStyle,
            width: `${Math.min(width * 2, 400)}rpx`,
            height: `${Math.min(height * 2, 300)}rpx`
          }
          break
        case 'side':
          // 侧面视图 (长 x 高)
          viewStyle = {
            ...baseStyle,
            width: `${Math.min(length * 2, 400)}rpx`,
            height: `${Math.min(height * 2, 300)}rpx`
          }
          break
        case 'top':
          // 俯视图 (长 x 宽)
          viewStyle = {
            ...baseStyle,
            width: `${Math.min(length * 2, 400)}rpx`,
            height: `${Math.min(width * 2, 300)}rpx`
          }
          break
      }

      return viewStyle
    },

    /**
     * 获取尺寸标注位置
     */
    getDimensionPositions() {
      const { product, currentView } = this.data
      if (!product.dimensions) return []

      const { length, width, height } = product.dimensions
      let positions = []

      switch (currentView) {
        case 'front':
          positions = [
            { type: 'width', value: width, position: 'bottom' },
            { type: 'height', value: height, position: 'right' }
          ]
          break
        case 'side':
          positions = [
            { type: 'length', value: length, position: 'bottom' },
            { type: 'height', value: height, position: 'right' }
          ]
          break
        case 'top':
          positions = [
            { type: 'length', value: length, position: 'bottom' },
            { type: 'width', value: width, position: 'right' }
          ]
          break
      }

      return positions
    }
  }
})
