// utils/mock-data.js - 模拟数据（无需后端服务）

const mockData = {
  // 筛选元数据
  filtersMeta: {
    success: true,
    data: {
      categories: [
        { id: '沙发', name: '沙发', count: 2 },
        { id: '床', name: '床', count: 1 },
        { id: '餐桌', name: '餐桌', count: 1 },
        { id: '椅子', name: '椅子', count: 2 },
        { id: '书桌', name: '书桌', count: 1 }
      ],
      priceRanges: [
        { id: 'low', name: '0-500元', min: 0, max: 500 },
        { id: 'mid', name: '500-1500元', min: 500, max: 1500 },
        { id: 'high', name: '1500-3000元', min: 1500, max: 3000 },
        { id: 'premium', name: '3000元以上', min: 3000, max: 999999 }
      ],
      brands: [
        { id: 'HomeNest', name: 'HomeNest', count: 1 },
        { id: 'Oak&Co', name: 'Oak&Co', count: 1 },
        { id: 'WoodCraft', name: 'WoodCraft', count: 1 },
        { id: 'ComfortSeats', name: 'ComfortSeats', count: 1 },
        { id: 'ErgoTech', name: 'ErgoTech', count: 1 },
        { id: 'MinimalWork', name: 'MinimalWork', count: 1 }
      ],
      styles: [
        { id: '现代', name: '现代', count: 4 },
        { id: '北欧', name: '北欧', count: 2 },
        { id: '原木', name: '原木', count: 1 },
        { id: '极简', name: '极简', count: 2 },
        { id: '工业风', name: '工业风', count: 1 },
        { id: '人体工学', name: '人体工学', count: 1 }
      ]
    }
  },

  // 商品列表
  products: {
    success: true,
    data: {
      items: [
        {
          id: "sku_sofa_001",
          spu_id: "spu_sofa_a",
          title: "Nappa 布艺三人沙发 2.1m",
          brand: "HomeNest",
          category: ["沙发","客厅"],
          style: ["现代","北欧"],
          material: ["布艺","实木框架"],
          color: ["灰"],
          width_mm: 2100,
          depth_mm: 890,
          height_mm: 840,
          package: { width_mm: 2150, depth_mm: 950, height_mm: 700, weight_kg: 55 },
          price: 3999,
          monthlyPrice: 80, // price/50
          stock: [{ city: "Durham", qty: 8 }],
          images: [
            { url: "https://picsum.photos/400/300?random=1", type: "main" },
            { url: "https://picsum.photos/400/300?random=11", type: "scene" }
          ],
          care: "可拆洗外套，低温水洗；木质部位用微湿布擦拭。",
          delivery: { modes: ["送货到门","白手套安装"], eta_days: [5,10], upstairs: true },
          variants: [{ name: "颜色", value: "灰" }],
          bundle_suggestions: ["sku_table_003","sku_rug_007"],
          faq: [
            { q: "沙发套可机洗吗？", a: "可机洗，建议低温柔洗。" }
          ]
        },
        {
          id: "sku_bed_002",
          spu_id: "spu_bed_b",
          title: "橡木平台床 1.5m",
          brand: "Oak&Co",
          category: ["床","卧室"],
          style: ["原木","极简"],
          material: ["实木","橡木"],
          color: ["原木"],
          width_mm: 2060,
          depth_mm: 1560,
          height_mm: 320,
          package: { width_mm: 2100, depth_mm: 300, height_mm: 260, weight_kg: 42 },
          price: 3299,
          monthlyPrice: 66,
          stock: [{ city: "Durham", qty: 5 }],
          images: [
            { url: "https://picsum.photos/400/300?random=2", type: "main" },
            { url: "https://picsum.photos/400/300?random=12", type: "scene" }
          ],
          care: "表面清洁使用干布或微湿布；避免长时日晒。",
          delivery: { modes: ["送货到门"], eta_days: [7,14], upstairs: true },
          variants: [{ name: "尺寸", value: "150x200cm" }],
          bundle_suggestions: ["sku_mattress_010","sku_nightstand_011"],
          faq: [
            { q: "是否需要自行安装？", a: "默认送货到门，可选加价安装服务。" }
          ]
        },
        {
          id: "sku_table_003",
          spu_id: "spu_table_c",
          title: "胡桃木餐桌 1.6m",
          brand: "WoodCraft",
          category: ["餐桌","餐厅"],
          style: ["现代","工业风"],
          material: ["胡桃木","金属腿"],
          color: ["胡桃木色"],
          width_mm: 1600,
          depth_mm: 800,
          height_mm: 750,
          package: { width_mm: 1650, depth_mm: 850, height_mm: 150, weight_kg: 38 },
          price: 2899,
          monthlyPrice: 58,
          stock: [{ city: "Durham", qty: 12 }],
          images: [
            { url: "https://picsum.photos/400/300?random=3", type: "main" },
            { url: "https://picsum.photos/400/300?random=13", type: "scene" }
          ],
          care: "定期使用木质护理油保养；避免尖锐物品划伤。",
          delivery: { modes: ["送货到门","白手套安装"], eta_days: [3,7], upstairs: true },
          variants: [{ name: "长度", value: "160cm" }],
          bundle_suggestions: ["sku_chair_004","sku_chair_005"],
          faq: [
            { q: "餐桌可承重多少？", a: "承重可达100kg，适合日常使用。" }
          ]
        },
        {
          id: "sku_chair_004",
          spu_id: "spu_chair_d",
          title: "软包餐椅 单椅",
          brand: "ComfortSeats",
          category: ["椅子","餐厅"],
          style: ["现代","简约"],
          material: ["PU皮","钢管"],
          color: ["米白"],
          width_mm: 450,
          depth_mm: 520,
          height_mm: 830,
          package: { width_mm: 500, depth_mm: 570, height_mm: 450, weight_kg: 8 },
          price: 599,
          monthlyPrice: 12,
          stock: [{ city: "Durham", qty: 20 }],
          images: [
            { url: "https://picsum.photos/400/300?random=4", type: "main" },
            { url: "https://picsum.photos/400/300?random=14", type: "scene" }
          ],
          care: "PU皮面用湿布擦拭；金属部位避免潮湿环境。",
          delivery: { modes: ["送货到门"], eta_days: [2,5], upstairs: true },
          variants: [{ name: "颜色", value: "米白" }],
          bundle_suggestions: ["sku_table_003","sku_chair_005"],
          faq: [
            { q: "椅子高度可调节吗？", a: "固定高度，座面高度46cm。" }
          ]
        },
        {
          id: "sku_chair_005",
          spu_id: "spu_chair_e",
          title: "人体工学办公椅",
          brand: "ErgoTech",
          category: ["椅子","办公室"],
          style: ["现代","人体工学"],
          material: ["网布","尼龙"],
          color: ["黑"],
          width_mm: 650,
          depth_mm: 650,
          height_mm: 1150,
          package: { width_mm: 700, depth_mm: 350, height_mm: 700, weight_kg: 18 },
          price: 1899,
          monthlyPrice: 38,
          stock: [{ city: "Durham", qty: 15 }],
          images: [
            { url: "https://picsum.photos/400/300?random=5", type: "main" },
            { url: "https://picsum.photos/400/300?random=15", type: "scene" }
          ],
          care: "网布可用吸尘器清洁；滑轮定期加润滑油。",
          delivery: { modes: ["送货到门","白手套安装"], eta_days: [3,7], upstairs: true },
          variants: [{ name: "功能", value: "可升降+腰托" }],
          bundle_suggestions: ["sku_desk_006","sku_lamp_015"],
          faq: [
            { q: "最大承重多少？", a: "最大承重120kg，通过SGS认证。" }
          ]
        },
        {
          id: "sku_desk_006",
          spu_id: "spu_desk_f",
          title: "简约书桌 1.2m",
          brand: "MinimalWork",
          category: ["书桌","办公室"],
          style: ["极简","现代"],
          material: ["密度板","钢管"],
          color: ["白"],
          width_mm: 1200,
          depth_mm: 600,
          height_mm: 750,
          package: { width_mm: 1250, depth_mm: 650, height_mm: 100, weight_kg: 25 },
          price: 1299,
          monthlyPrice: 26,
          stock: [{ city: "Durham", qty: 18 }],
          images: [
            { url: "https://picsum.photos/400/300?random=6", type: "main" },
            { url: "https://picsum.photos/400/300?random=16", type: "scene" }
          ],
          care: "表面防水处理，用湿布即可清洁；避免重物撞击。",
          delivery: { modes: ["送货到门"], eta_days: [2,5], upstairs: true },
          variants: [{ name: "尺寸", value: "120x60cm" }],
          bundle_suggestions: ["sku_chair_005","sku_organizer_016"],
          faq: [
            { q: "桌面承重如何？", a: "均匀承重30kg，适合放置电脑设备。" }
          ]
        }
      ],
      total: 6,
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
    const currentSku = mockData.products.data.items.find(item => item.id === id)
    
    let recommendations = []
    
    // 优先使用bundle_suggestions
    if (currentSku && currentSku.bundle_suggestions) {
      recommendations = currentSku.bundle_suggestions
        .map(suggestedId => mockData.products.data.items.find(item => item.id === suggestedId))
        .filter(Boolean)
        .slice(0, 4)
    }
    
    // 如果推荐不够，补充其他商品
    if (recommendations.length < 4) {
      const others = mockData.products.data.items
        .filter(item => item.id !== id && !recommendations.some(rec => rec.id === item.id))
        .slice(0, 4 - recommendations.length)
      recommendations = [...recommendations, ...others]
    }
    
    return Promise.resolve({
      success: true,
      data: recommendations
    })
  },

  createIntentOrder(orderData) {
    const sku = mockData.products.data.items.find(item => item.id === orderData.skuId)
    const monthlyPrice = sku ? sku.monthlyPrice : 50
    
    return Promise.resolve({
      success: true,
      data: {
        orderId: `ORDER_${Date.now()}`,
        ...orderData,
        monthlyPrice,
        totalAmount: monthlyPrice * (orderData.duration || 1),
        status: 'pending',
        createdAt: new Date().toISOString(),
        sku: sku ? {
          id: sku.id,
          title: sku.title,
          brand: sku.brand,
          image: sku.images[0]?.url || '',
          price: sku.price
        } : null
      }
    })
  }
}

module.exports = { mockData, mockApi }