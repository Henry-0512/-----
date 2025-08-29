// components/size-sketch/size-sketch.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示
    visible: {
      type: Boolean,
      value: false
    },
    // 商品信息
    product: {
      type: Object,
      value: {}
    },
    // 显示模式：modal（弹窗） | inline（内联）
    mode: {
      type: String,
      value: 'modal'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 当前旋转角度 0° 或 90°
    rotation: 0,
    // 画布尺寸
    canvasWidth: 300,
    canvasHeight: 300,
    // 缩放比例
    scale: 1,
    // 最小和最大缩放比例
    minScale: 0.5,
    maxScale: 3,
    // 缩放百分比（用于显示）
    scalePercent: 100,
    // 参照格尺寸（1米 = 1000mm）
    gridSize: 1000
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 关闭弹窗
     */
    onClose() {
      this.triggerEvent('close')
    },

    /**
     * 旋转视角
     */
    onRotate() {
      const newRotation = this.data.rotation === 0 ? 90 : 0
      this.setData({ rotation: newRotation })
      this.drawSketch()
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
      this.drawSketch()
    },

    /**
     * 绘制示意图
     */
    drawSketch() {
      const { product, rotation, scale, canvasWidth, canvasHeight, gridSize } = this.data
      
      if (!product || !product.width_mm || !product.depth_mm) {
        return
      }

      const query = this.createSelectorQuery()
      query.select('#sketchCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return
          
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          
          // 设置画布物理尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = canvasWidth * dpr
          canvas.height = canvasHeight * dpr
          ctx.scale(dpr, dpr)
          
          // 清空画布
          ctx.clearRect(0, 0, canvasWidth, canvasHeight)
          
          // 计算尺寸（考虑旋转）
          let width = product.width_mm
          let depth = product.depth_mm
          
          if (rotation === 90) {
            [width, depth] = [depth, width]
          }
          
          // 计算缩放比例，确保图形适合画布
          const maxDimension = Math.max(width, depth, gridSize)
          const baseScale = Math.min(canvasWidth * 0.6, canvasHeight * 0.6) / maxDimension
          const finalScale = baseScale * scale
          
          // 计算中心点
          const centerX = canvasWidth / 2
          const centerY = canvasHeight / 2
          
          // 绘制参照格（1米网格）
          this.drawGrid(ctx, centerX, centerY, finalScale, gridSize)
          
          // 绘制家具矩形
          this.drawFurniture(ctx, centerX, centerY, width, depth, finalScale)
          
          // 绘制尺寸标注
          this.drawDimensions(ctx, centerX, centerY, width, depth, finalScale)
        })
    },

    /**
     * 绘制参照网格
     */
    drawGrid(ctx, centerX, centerY, scale, gridSize) {
      const gridPixelSize = gridSize * scale
      const gridCount = 3 // 3x3网格
      
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      // 绘制网格线
      for (let i = -gridCount; i <= gridCount; i++) {
        // 垂直线
        const x = centerX + i * gridPixelSize
        ctx.beginPath()
        ctx.moveTo(x, centerY - gridCount * gridPixelSize)
        ctx.lineTo(x, centerY + gridCount * gridPixelSize)
        ctx.stroke()
        
        // 水平线
        const y = centerY + i * gridPixelSize
        ctx.beginPath()
        ctx.moveTo(centerX - gridCount * gridPixelSize, y)
        ctx.lineTo(centerX + gridCount * gridPixelSize, y)
        ctx.stroke()
      }
      
      // 绘制1米标识
      ctx.setLineDash([])
      ctx.fillStyle = '#999'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('1m', centerX + gridPixelSize, centerY - gridPixelSize - 5)
    },

    /**
     * 绘制家具矩形
     */
    drawFurniture(ctx, centerX, centerY, width, depth, scale) {
      const pixelWidth = width * scale
      const pixelDepth = depth * scale
      
      // 绘制主体矩形
      ctx.fillStyle = 'rgba(0, 122, 255, 0.2)'
      ctx.strokeStyle = '#007AFF'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      
      const rectX = centerX - pixelWidth / 2
      const rectY = centerY - pixelDepth / 2
      
      ctx.fillRect(rectX, rectY, pixelWidth, pixelDepth)
      ctx.strokeRect(rectX, rectY, pixelWidth, pixelDepth)
      
      // 绘制方向指示（小箭头表示正面）
      ctx.fillStyle = '#007AFF'
      ctx.beginPath()
      ctx.moveTo(centerX, rectY + 10)
      ctx.lineTo(centerX - 5, rectY + 20)
      ctx.lineTo(centerX + 5, rectY + 20)
      ctx.closePath()
      ctx.fill()
    },

    /**
     * 绘制尺寸标注
     */
    drawDimensions(ctx, centerX, centerY, width, depth, scale) {
      const pixelWidth = width * scale
      const pixelDepth = depth * scale
      
      ctx.fillStyle = '#333'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const rectX = centerX - pixelWidth / 2
      const rectY = centerY - pixelDepth / 2
      
      // 宽度标注（底部）
      const widthText = `${(width / 10).toFixed(0)}cm`
      ctx.fillText(widthText, centerX, rectY + pixelDepth + 20)
      
      // 深度标注（右侧）
      ctx.save()
      ctx.translate(rectX + pixelWidth + 20, centerY)
      ctx.rotate(-Math.PI / 2)
      const depthText = `${(depth / 10).toFixed(0)}cm`
      ctx.fillText(depthText, 0, 0)
      ctx.restore()
    },

    /**
     * 初始化画布
     */
    initCanvas() {
      // 延迟执行，确保DOM已渲染
      setTimeout(() => {
        this.drawSketch()
      }, 100)
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initCanvas()
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'visible': function(visible) {
      if (visible) {
        // 重置状态
        this.setData({
          rotation: 0,
          scale: 1,
          scalePercent: 100
        })
        this.initCanvas()
      }
    },
    
    'product': function(product) {
      if (product && this.data.visible) {
        this.initCanvas()
      }
    }
  }
})