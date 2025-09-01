// pages/reviews/reviews.js
const { isMockEnabled } = require('../../config/env.js')
const { api, ERROR_TYPES, storage } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    productId: '',
    productName: '',
    loading: true,
    error: null,
    reviews: [],
    totalCount: 0,
    averageRating: 4.99,
    ratingDistribution: {
      5: 85,
      4: 12,
      3: 2,
      2: 1,
      1: 0
    }
  },

  onLoad(options) {
    const { productId, productName } = options
    this.setData({
      productId: productId || '',
      productName: decodeURIComponent(productName || '')
    })
    
    this.loadReviews()
  },

  /**
   * 加载评价数据
   */
  async loadReviews() {
    try {
      this.setData({ loading: true, error: null })
      
      // 模拟评价数据
      const mockReviews = [
        {
          id: 1,
          user: '张**',
          avatar: 'https://picsum.photos/60/60?random=1',
          rating: 5,
          date: '2024-01-15',
          content: '商品质量很好，配送也很及时，客服态度很棒！',
          images: ['https://picsum.photos/200/200?random=10'],
          helpful: 12
        },
        {
          id: 2,
          user: '李**',
          avatar: 'https://picsum.photos/60/60?random=2',
          rating: 5,
          date: '2024-01-10',
          content: '家具很漂亮，材质也很好，租期很灵活，推荐！',
          images: [],
          helpful: 8
        },
        {
          id: 3,
          user: '王**',
          avatar: 'https://picsum.photos/60/60?random=3',
          rating: 4,
          date: '2024-01-05',
          content: '整体不错，就是配送时间稍微有点长，其他都很好。',
          images: ['https://picsum.photos/200/200?random=11', 'https://picsum.photos/200/200?random=12'],
          helpful: 5
        },
        {
          id: 4,
          user: '陈**',
          avatar: 'https://picsum.photos/60/60?random=4',
          rating: 5,
          date: '2023-12-28',
          content: '第二次租赁了，服务一如既往的好，家具质量稳定。',
          images: [],
          helpful: 15
        },
        {
          id: 5,
          user: '刘**',
          avatar: 'https://picsum.photos/60/60?random=5',
          rating: 5,
          date: '2023-12-20',
          content: '客服很专业，帮我选择了合适的家具，很满意！',
          images: ['https://picsum.photos/200/200?random=13'],
          helpful: 9
        }
      ]

      this.setData({
        reviews: mockReviews,
        totalCount: mockReviews.length,
        loading: false
      })

    } catch (error) {
      console.error('加载评价失败:', error)
      this.setData({
        loading: false,
        error: '加载评价失败，请稍后重试'
      })
    }
  },

  /**
   * 点赞评价
   */
  onHelpfulTap(e) {
    const { id } = e.currentTarget.dataset
    const { reviews } = this.data
    
    const updatedReviews = reviews.map(review => {
      if (review.id === id) {
        return { ...review, helpful: review.helpful + 1 }
      }
      return review
    })
    
    this.setData({ reviews: updatedReviews })
    
    wx.showToast({
      title: '感谢您的反馈',
      icon: 'success'
    })
  },

  /**
   * 查看评价图片
   */
  onImageTap(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({
      urls: urls,
      current: current
    })
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadReviews().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { productName } = this.data
    return {
      title: `${productName} - 用户评价`,
      path: `/pages/reviews/reviews?productId=${this.data.productId}&productName=${encodeURIComponent(productName)}`
    }
  }
})
