// pages/category/category.js
const { api } = require('../../utils/request.js')

Page({
  data: {
    loading: true,
    categories: [],
    selectedCategory: null,
    items: [],
    itemsLoading: false,
    error: null
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    // 每次显示时检查是否需要刷新数据
    if (!this.data.categories.length) {
      this.loadCategories()
    }
  },

  /**
   * 加载分类数据
   */
  async loadCategories() {
    try {
      this.setData({ loading: true, error: null })
      
      const res = await api.getFiltersMeta()
      const categories = res.data.categories || []
      
      this.setData({
        categories,
        selectedCategory: categories[0] || null,
        loading: false
      })
      
      // 加载第一个分类的商品
      if (categories.length > 0) {
        this.loadCategoryItems(categories[0].id)
      }
    } catch (error) {
      console.error('加载分类失败：', error)
      this.setData({
        error: '加载失败，请重试',
        loading: false
      })
    }
  },

  /**
   * 加载分类商品
   */
  async loadCategoryItems(categoryId) {
    if (!categoryId) return
    
    try {
      this.setData({ itemsLoading: true })
      
      const res = await api.filterProducts({
        categories: [categoryId]
      })
      
      // 只取前6个商品作为预览
      const items = (res.data.items || []).slice(0, 6)
      
      this.setData({
        items,
        itemsLoading: false
      })
    } catch (error) {
      console.error('加载分类商品失败：', error)
      this.setData({ itemsLoading: false })
      wx.showToast({
        title: '加载商品失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  /**
   * 选择分类
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset
    if (!category || category.id === this.data.selectedCategory?.id) return
    
    this.setData({ selectedCategory: category })
    this.loadCategoryItems(category.id)
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
   * 查看分类全部商品
   */
  onViewAllTap() {
    const { selectedCategory } = this.data
    if (selectedCategory) {
      wx.navigateTo({
        url: `/pages/list/list?category=${selectedCategory.id}`
      })
    }
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadCategories()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCategories().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
