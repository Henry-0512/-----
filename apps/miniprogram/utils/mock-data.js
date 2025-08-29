// utils/mock-data.js - 模拟数据（无需后端服务）

const mockData = {
  // 筛选元数据
  filtersMeta: {
    success: true,
    data: {
      categories: [
        { id: 'sofa', name: '沙发', count: 5 },
        { id: 'chair', name: '椅子', count: 8 },
        { id: 'table', name: '桌子', count: 4 },
        { id: 'bed', name: '床', count: 3 }
      ],
      priceRanges: [
        { id: 'low', name: '100-300元/月', min: 100, max: 300 },
        { id: 'mid', name: '300-600元/月', min: 300, max: 600 },
        { id: 'high', name: '600-1000元/月', min: 600, max: 1000 }
      ],
      brands: [
        { id: 'ikea', name: 'IKEA' },
        { id: 'muji', name: '无印良品' },
        { id: 'hm', name: 'H&M Home' }
      ]
    }
  },

  // 商品列表
  products: {
    success: true,
    data: {
      items: [
        {
          id: "sku_001",
          name: "IKEA EKTORP 三人沙发",
          description: "经典舒适的三人沙发，可拆洗套子，适合现代家居",
          category: "sofa",
          brand: "ikea",
          monthlyPrice: 450,
          originalPrice: 2399,
          images: [
            "https://via.placeholder.com/400x300/E8E8E8/666?text=EKTORP+沙发"
          ],
          dimensions: { length: 218, width: 88, height: 88 },
          color: "米白色",
          material: "棉麻混纺",
          available: true,
          tags: ["热门", "可拆洗", "现代风格"]
        },
        {
          id: "sku_002",
          name: "无印良品 橡木餐桌",
          description: "简约橡木餐桌，可容纳4-6人用餐，天然木纹质感",
          category: "table",
          brand: "muji",
          monthlyPrice: 380,
          originalPrice: 1899,
          images: [
            "https://via.placeholder.com/400x300/D4C5B5/666?text=橡木餐桌"
          ],
          dimensions: { length: 160, width: 80, height: 72 },
          color: "原木色",
          material: "橡木",
          available: true,
          tags: ["环保", "简约", "北欧风"]
        },
        {
          id: "sku_003",
          name: "Herman Miller Aeron 办公椅",
          description: "经典人体工学办公椅，透气网布，支撑腰部健康",
          category: "chair",
          brand: "hm",
          monthlyPrice: 680,
          originalPrice: 8999,
          images: [
            "https://via.placeholder.com/400x300/2C2C2C/FFF?text=Aeron+椅子"
          ],
          dimensions: { length: 60, width: 60, height: 120 },
          color: "石墨黑",
          material: "聚酯纤维网布",
          available: true,
          tags: ["人体工学", "透气", "高端"]
        }
      ],
      total: 3,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  }
}

// 模拟API接口
const mockApi = {
  getFiltersMeta() {
    return Promise.resolve(mockData.filtersMeta)
  },

  searchProducts(params = {}) {
    return Promise.resolve(mockData.products)
  },

  filterProducts(filters = {}) {
    return Promise.resolve(mockData.products)
  },

  getProductDetail(id) {
    const product = mockData.products.data.items.find(item => item.id === id)
    return Promise.resolve({
      success: true,
      data: product || mockData.products.data.items[0]
    })
  },

  getRecommendations(id) {
    return Promise.resolve({
      success: true,
      data: mockData.products.data.items.slice(0, 2)
    })
  },

  createIntentOrder(orderData) {
    return Promise.resolve({
      success: true,
      data: {
        orderId: `ORDER_${Date.now()}`,
        ...orderData,
        totalAmount: 450 * (orderData.duration || 1),
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    })
  }
}

module.exports = {
  mockApi,
  mockData
}
