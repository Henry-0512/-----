// components/AskPriceButton/index.js
const { track, TrackEvents } = require('../../utils/track.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    label: {
      type: String,
      value: '咨询价格'
    },
    fullWidth: {
      type: Boolean,
      value: true
    },
    size: {
      type: String,
      value: 'md' // 'md' | 'sm'
    },
    variant: {
      type: String,
      value: 'solid' // 'solid' | 'outline'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    data: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    sizeClass: '',
    variantClass: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateClasses()
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'size,variant': function(size, variant) {
      this.updateClasses()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新样式类
     */
    updateClasses() {
      const { size, variant } = this.properties
      this.setData({
        sizeClass: `size-${size}`,
        variantClass: `variant-${variant}`
      })
    },

    /**
     * 点击事件
     */
    onTap(e) {
      const { disabled, loading, data } = this.properties
      
      if (disabled || loading) {
        return
      }

      // 埋点追踪
      try {
        track(TrackEvents.ASK_PRICE_CLICK, {
          ...data,
          timestamp: new Date().toISOString(),
          component: 'AskPriceButton'
        })
      } catch (error) {
        console.warn('埋点失败:', error)
      }

      // 触发自定义事件
      this.triggerEvent('tap', {
        data: data,
        timestamp: Date.now()
      })
    }
  }
})
