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
    totalCount: 0,
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
      
      // 并行加载分类数据和热门商品（默认价格从高到低）
      const [filterRes, hotItemsRes] = await Promise.all([
        api.getFiltersMeta(),
        api.filterProducts({}, { page: 1, page_size: 8, sort: 'price_desc' })
      ])
      
      const categories = filterRes.data?.categories || filterRes.data || []
      const hotItems = hotItemsRes.data?.items || hotItemsRes.data || []
      
      this.setData({
        categories,
        hotItems,
        totalCount: hotItemsRes.data?.total || hotItems.length || 137,
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
   * 管理员入口（隐藏功能）
   */
  onAdminAccess() {
    wx.showModal({
      title: '管理员入口',
      content: '确定要进入管理系统吗？',
      confirmText: '进入',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/admin/intents'
          })
        }
      }
    })
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
  onTapCategory(e) {
    const name = e.currentTarget.dataset.name
    console.log('🔍 分类点击:', name)
    
    if (!name) {
      wx.showToast({
        title: '分类数据错误',
        icon: 'none'
      })
      return
    }
    
    console.log('🔍 准备跳转到:', `/pages/list/list?category=${encodeURIComponent(name)}&sort=price_desc`)
    
    // 直接跳转，不用弹窗
    wx.navigateTo({
      url: `/pages/list/list?category=${encodeURIComponent(name)}&sort=price_desc&title=${encodeURIComponent(name)}`
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
    console.log('🔍 查看更多被点击')
    
    // 直接跳转
    wx.navigateTo({
      url: '/pages/list/list?all=1&sort=price_desc&title=全部商品'
    })
  },

  /**
   * 显示排序选项
   */
  onShowSort() {
    wx.showActionSheet({
      itemList: ['价格从低到高', '价格从高到低', '成色从新到旧', '成色从旧到新'],
      success: (res) => {
        const sortOptions = ['price_asc', 'price_desc', 'condition_new', 'condition_old']
        const selectedSort = sortOptions[res.tapIndex]
        const sortNames = ['价格从低到高', '价格从高到低', '成色从新到旧', '成色从旧到新']
        
        // 埋点追踪
        try {
          const { track, TrackEvents } = require('../../utils/track.js')
          track(TrackEvents.SORT_CHANGE, {
            sort_type: selectedSort,
            sort_name: sortNames[res.tapIndex],
            from_page: 'homepage'
          })
        } catch (error) {
          console.warn('埋点失败:', error)
        }
        
        wx.navigateTo({
          url: `/pages/list/list?sort=${selectedSort}&title=${encodeURIComponent(sortNames[res.tapIndex])}`
        })
      }
    })
  },

  /**
   * 显示筛选器
   */
  onShowFilter() {
    wx.navigateTo({
      url: '/pages/list/list?showFilter=true'
    })
  },

  /**
   * 清除筛选
   */
  onClearFilter() {
    wx.showToast({
      title: '已清除筛选条件',
      icon: 'success'
    })
    
    // 重新加载数据
    this.loadHomeData()
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
