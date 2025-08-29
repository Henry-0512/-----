// 商品SKU相关类型
export interface SKU {
  id: string
  name: string
  description: string
  category: string
  brand: string
  monthlyPrice: number
  originalPrice: number
  images: string[]
  dimensions: {
    length: number
    width: number
    height: number
  }
  color: string
  material: string
  available: boolean
  tags: string[]
}

// 筛选相关类型
export interface FilterMeta {
  categories: CategoryFilter[]
  priceRanges: PriceRangeFilter[]
  brands: BrandFilter[]
}

export interface CategoryFilter {
  id: string
  name: string
  count: number
}

export interface PriceRangeFilter {
  id: string
  name: string
  min: number
  max: number
}

export interface BrandFilter {
  id: string
  name: string
}

export interface FilterRequest {
  categories?: string[]
  priceRange?: {
    min: number
    max: number
  }
  brands?: string[]
}

// 搜索相关类型
export interface SearchRequest {
  q?: string
  page?: number
  limit?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 订单相关类型
export interface IntentOrderRequest {
  skuId: string
  duration: number // 租赁月数
  startDate: string
  userInfo?: {
    name?: string
    phone?: string
    address?: string
  }
}

export interface IntentOrder {
  orderId: string
  skuId: string
  duration: number
  startDate: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

// API响应包装类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

// 小程序页面相关类型
export interface PageData {
  loading: boolean
  error?: string
}

export interface HomePageData extends PageData {
  banners: Banner[]
  categories: CategoryFilter[]
  hotItems: SKU[]
}

export interface Banner {
  id: string
  image: string
  title: string
  link?: string
}

export interface ListPageData extends PageData {
  items: SKU[]
  total: number
  hasMore: boolean
  filters: FilterMeta
  currentFilters: FilterRequest
  showFilterDrawer: boolean
}

export interface PDPPageData extends PageData {
  sku: SKU | null
  recommendations: SKU[]
  selectedImage: number
  showSizeGuide: boolean
}

export interface ProfilePageData extends PageData {
  userInfo: {
    avatar?: string
    nickname?: string
    phone?: string
  }
  orders: IntentOrder[]
  favoriteItems: SKU[]
}
