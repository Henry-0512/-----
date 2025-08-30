// components/product-card/product-card.js
const { storage } = require('../../utils/request.js')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 商品数据
    product: {
      type: Object,
      value: {}
    },
    // 卡片样式类型: 'grid' | 'list'
    cardType: {
      type: String,
      value: 'grid'
    },
    // 是否显示收藏按钮
    showFavorite: {
      type: Boolean,
      value: true
    },
    // 是否显示对比按钮
    showCompare: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isFavorited: false,
    isCompared: false
  },

  /**
   * 组件生命周期函数
   */
  lifetimes: {
    attached() {
      this.checkFavoriteStatus()
      this.checkCompareStatus()
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'product.id': function(productId) {
      if (productId) {
        this.checkFavoriteStatus()
        this.checkCompareStatus()
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 检查收藏状态
     */
    checkFavoriteStatus() {
      const { product } = this.data
      if (!product || !product.id) return

      const favorites = storage.get('favorites') || []
      const isFavorited = Array.isArray(favorites) && favorites.some(item => item && item.id === product.id)
      this.setData({ isFavorited })
    },

    /**
     * 检查对比状态
     */
    checkCompareStatus() {
      const { product } = this.data
      if (!product || !product.id) return

      const compareList = storage.get('compareList') || []
      const isCompared = Array.isArray(compareList) && compareList.some(item => item && item.id === product.id)
      this.setData({ isCompared })
    },

    /**
     * 点击卡片事件
     */
    onCardTap() {
      const { product } = this.data
      this.triggerEvent('cardtap', { product })
    },

    /**
     * 切换收藏状态
     */
    onFavoriteTap() {
      const { product, isFavorited } = this.data
      if (!product.id) return

      let favorites = storage.get('favorites', [])
      
      if (isFavorited) {
        // 取消收藏
        favorites = favorites.filter(item => item.id !== product.id)
        wx.showToast({
          title: '已取消收藏',
          icon: 'none',
          duration: 1500
        })
      } else {
        // 添加收藏
        favorites.push(product)
        wx.showToast({
          title: '已添加收藏',
          icon: 'success',
          duration: 1500
        })
      }

      storage.set('favorites', favorites)
      this.setData({ isFavorited: !isFavorited })
      
      // 触发收藏状态变化事件
      this.triggerEvent('favoritechange', { 
        product, 
        isFavorited: !isFavorited 
      })
    },

    /**
     * 切换对比状态
     */
    onCompareTap() {
      const { product, isCompared } = this.data
      if (!product.id) return

      let compareList = storage.get('compareList', [])
      
      if (isCompared) {
        // 移除对比
        compareList = compareList.filter(item => item.id !== product.id)
        wx.showToast({
          title: '已移除对比',
          icon: 'none',
          duration: 1500
        })
      } else {
        // 检查对比列表数量限制
        if (compareList.length >= 3) {
          wx.showToast({
            title: '最多只能对比3个商品',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        // 添加对比
        compareList.push(product)
        wx.showToast({
          title: '已添加对比',
          icon: 'success',
          duration: 1500
        })
      }

      storage.set('compareList', compareList)
      this.setData({ isCompared: !isCompared })
      
      // 触发对比状态变化事件
      this.triggerEvent('comparechange', { 
        product, 
        isCompared: !isCompared 
      })
    },

    /**
     * 格式化价格显示
     */
    formatPrice(price) {
      return price ? `¥${price}` : '价格面议'
    },

    /**
     * 预览图片
     */
    onImageTap() {
      const { product } = this.data
      if (product.images && product.images.length > 0) {
        wx.previewImage({
          urls: product.images,
          current: product.images[0]
        })
      }
    }
  }
})
