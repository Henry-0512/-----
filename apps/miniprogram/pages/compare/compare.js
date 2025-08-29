// pages/compare/compare.js
const { USE_MOCK_DATA } = require('../../utils/config.js')

const { storage } = USE_MOCK_DATA 
  ? require('../../utils/request-mock.js')
  : require('../../utils/request.js')

Page({
  data: {
    compareList: [],
    compareFields: [
      { key: 'title', label: '商品名称', type: 'text' },
      { key: 'brand', label: '品牌', type: 'text' },
      { key: 'monthlyPrice', label: '月租价格', type: 'price' },
      { key: 'price', label: '原价', type: 'price' },
      { key: 'style', label: '风格', type: 'array' },
      { key: 'material', label: '材质', type: 'array' },
      { key: 'color', label: '颜色', type: 'array' },
      { key: 'dimensions', label: '尺寸', type: 'dimensions' }
    ]
  },

  onLoad() {
    this.loadCompareList()
  },

  onShow() {
    this.loadCompareList()
  },

  /**
   * 加载对比列表
   */
  loadCompareList() {
    const compareList = storage.get('compareList', [])
    
    // 处理尺寸信息
    const processedList = compareList.map(item => ({
      ...item,
      dimensions: `${item.width_mm/10}×${item.depth_mm/10}×${item.height_mm/10}cm`
    }))
    
    this.setData({ compareList: processedList })
  },

  /**
   * 移除对比商品
   */
  onRemoveCompare(e) {
    const { index } = e.currentTarget.dataset
    const { compareList } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从对比列表中移除这件商品吗？',
      success: (res) => {
        if (res.confirm) {
          const newCompareList = compareList.filter((_, i) => i !== index)
          storage.set('compareList', newCompareList)
          this.setData({ compareList: newCompareList })
          
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 清空对比列表
   */
  onClearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有对比商品吗？',
      success: (res) => {
        if (res.confirm) {
          storage.set('compareList', [])
          this.setData({ compareList: [] })
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 查看商品详情
   */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  /**
   * 获取字段值
   */
  getFieldValue(item, field) {
    const value = item[field.key]
    
    if (!value) return '-'
    
    switch (field.type) {
      case 'price':
        return `¥${value}`
      case 'array':
        return Array.isArray(value) ? value.join('、') : value
      case 'dimensions':
        return value
      default:
        return value
    }
  },

  /**
   * 检查字段是否有差异
   */
  hasFieldDifference(field) {
    const { compareList } = this.data
    if (compareList.length <= 1) return false
    
    const values = compareList.map(item => this.getFieldValue(item, field))
    const uniqueValues = [...new Set(values)]
    return uniqueValues.length > 1
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  }
})
