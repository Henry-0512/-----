// pages/category/category.js
const { isMockEnabled } = require('../../config/env.js')
const { api } = isMockEnabled() 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')
const { getCategoryDisplay } = require('../../utils/category-icons.js')

Page({
  data: {
    loading: true,
    categories: [],
    selectedCategory: null,
    items: [],
    itemsLoading: false,
    error: null,
    searchKeyword: '',
    departments: [
      {
        id: 'home_garden',
        name: '家居园艺',
        cover: 'https://picsum.photos/400/300?random=10'
      },
      {
        id: 'furniture_lights',
        name: '家具灯饰',
        cover: 'https://picsum.photos/400/300?random=11'
      },
      {
        id: 'electricals',
        name: '电器设备',
        cover: 'https://picsum.photos/400/300?random=12'
      },
      {
        id: 'women',
        name: '女士用品',
        cover: 'https://picsum.photos/400/300?random=13'
      },
      {
        id: 'men',
        name: '男士用品',
        cover: 'https://picsum.photos/400/300?random=14'
      },
      {
        id: 'beauty',
        name: '美妆护理',
        cover: 'https://picsum.photos/400/300?random=15'
      },
      {
        id: 'baby_kids',
        name: '母婴儿童',
        cover: 'https://picsum.photos/400/300?random=16'
      },
      {
        id: 'sport_travel',
        name: '运动旅行',
        cover: 'https://picsum.photos/400/300?random=17'
      },
      {
        id: 'gifts',
        name: '礼品精选',
        cover: 'https://picsum.photos/400/300?random=18'
      },
      {
        id: 'holiday',
        name: '节日专区',
        cover: 'https://picsum.photos/400/300?random=19'
      }
    ]
  },

  onLoad() {
    this.loadCategories()
  },

  onShow() {
    // 页面显示时刷新数据
  },

  /**
   * 加载分类数据
   */
  async loadCategories() {
    try {
      this.setData({ loading: true, error: null })
      
      const result = await api.getFiltersMeta()
      if (result.success) {
        const rawCategories = result.data.categories || []
        const categories = rawCategories.map(cat => ({
          ...cat,
          ...getCategoryDisplay(cat)
        }))
        this.setData({
          categories,
          loading: false
        })
      } else {
        throw new Error(result.message || '加载分类失败')
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      this.setData({
        loading: false,
        error: error.message || '网络连接失败'
      })
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 点击部门卡片
   */
  onTapDept(e) {
    const { item, id } = e.detail
    
    if (item && item.id) {
      // 跳转到列表页并带上分类参数
      wx.navigateTo({
        url: `/pages/list/list?dept=${item.id}&title=${encodeURIComponent(item.name)}`
      })
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 搜索确认
   */
  onSearch(e) {
    const keyword = e.detail.value.trim()
    if (keyword) {
      wx.navigateTo({
        url: `/pages/list/list?keyword=${encodeURIComponent(keyword)}`
      })
    }
  },

  /**
   * 点击分类
   */
  onDepartmentTap(e) {
    const { id } = e.currentTarget.dataset
    const dept = this.data.departments.find(item => item.id === id)
    
    if (dept) {
      wx.navigateTo({
        url: `/pages/list/list?category=${id}&title=${encodeURIComponent(dept.name)}`
      })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCategories().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '家具租赁 - 商品分类',
      path: '/pages/category/category'
    }
  }
})