// pages/index/index.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    // 页面状态
    loading: true,
    error: null,
    isEmpty: false,
    banners: [
      {
        id: '1',
        image: 'https://picsum.photos/750/400?random=10',
        title: '精品家具租赁',
        link: '/pages/list/list'
      },
      {
        id: '2', 
        image: 'https://picsum.photos/750/400?random=11',
        title: '灵活租期',
        link: '/pages/category/category'
      },
      {
        id: '3',
        image: 'https://picsum.photos/750/400?random=12',
        title: '品质保证',
        link: '/pages/list/list?category=sofa'
      }
    ],
    categories: [],
    hotItems: [],
    searchKeyword: '',
    error: null
  },

  onLoad() {
    this.loadHomeData()
  },

  onShow() {
    // 每次显示时检查是否需要刷新数据
    if (!this.data.hotItems.length) {
      this.loadHomeData()
    }
  },

  /**
   * 加载首页数据
   */
  async loadHomeData() {
    try {
      this.setData({ 
        loading: true, 
        error: null,
        isEmpty: false 
      })
      
      // 并行加载分类数据和热门商品
      const [filterRes, hotItemsRes] = await Promise.all([
        api.getFiltersMeta(),
        api.filterProducts({ limit: 6, sortBy: 'popular' })
      ])
      
      const categories = filterRes.data?.categories || filterRes.data || []
      const hotItems = hotItemsRes.data?.items || hotItemsRes.data || []
      
      this.setData({
        categories,
        hotItems,
        loading: false,
        isEmpty: categories.length === 0 && hotItems.length === 0
      })
    } catch (error) {
      console.error('加载首页数据失败：', error)
      
      this.setData({
        loading: false,
        error: {
          type: error.type || ERROR_TYPES.NETWORK,
          message: error.message || '加载失败，请重试',
          canRetry: error.canRetry !== false,
          onRetry: error.onRetry || (() => this.loadHomeData())
        }
      })
    }
  },

  /**
   * 重试加载
   */
  onRetryLoad() {
    const { error } = this.data
    if (error && error.onRetry) {
      error.onRetry()
    } else {
      this.loadHomeData()
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  /**
   * 执行搜索
   */
  onSearchConfirm() {
    const { searchKeyword } = this.data
    if (searchKeyword.trim()) {
      wx.navigateTo({
        url: `/pages/list/list?q=${encodeURIComponent(searchKeyword.trim())}`
      })
    }
  },

  /**
   * 点击搜索框
   */
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/list/list'
    })
  },

  /**
   * 轮播图点击
   */
  onBannerTap(e) {
    const { banner } = e.currentTarget.dataset
    if (banner.link) {
      if (banner.link.startsWith('/pages/')) {
        wx.navigateTo({
          url: banner.link
        })
      } else {
        wx.switchTab({
          url: banner.link
        })
      }
    }
  },

  /**
   * 分类点击
   */
  onCategoryTap(e) {
    const { category } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/list/list?category=${category.id}`
    })
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
   * 查看更多热门商品
   */
  onViewMoreHot() {
    wx.navigateTo({
      url: '/pages/list/list?sort=hot'
    })
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadHomeData()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadHomeData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '家具租赁 - 让生活更美好',
      path: '/pages/index/index',
      imageUrl: '/images/share-home.png'
    }
  }
})
