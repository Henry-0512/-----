/**
 * 修复图片URL，替换不稳定的picsum.photos
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 稳定的图片URL列表
const STABLE_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', // 现代沙发
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', // 床
  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop', // 餐桌
  'https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop', // 椅子
  'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop', // 书桌
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', // 茶几
  'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop', // 衣柜
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', // 书架
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', // 床垫
  'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop', // 床头柜
  'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop', // 梳妆台
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // 台灯
  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop', // 地毯
  'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop', // 收纳
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop', // 枕头
  'https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop', // 凳子
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // 镜子
  'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=400&h=300&fit=crop', // 鞋柜
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', // 额外1
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop'  // 额外2
]

// 备用简单图片（如果Unsplash也不可用）
const FALLBACK_URLS = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWutuWFt+WbvueJhzwvdGV4dD4KICA8L3N2Zz4K'
]

function fixImageUrls() {
  const skuPath = path.join(__dirname, '../seed/sku.json')
  
  try {
    // 读取现有SKU数据
    const skuData = JSON.parse(fs.readFileSync(skuPath, 'utf8'))
    console.log(`🖼️ 开始修复 ${skuData.length} 个SKU的图片URL...`)
    
    // 替换图片URL
    const fixedSKUs = skuData.map((sku, index) => {
      const newImageUrl = STABLE_IMAGE_URLS[index % STABLE_IMAGE_URLS.length]
      
      return {
        ...sku,
        images: [
          { url: newImageUrl, type: 'main' }
        ],
        image: newImageUrl // 保持兼容性
      }
    })
    
    // 写回文件
    fs.writeFileSync(skuPath, JSON.stringify(fixedSKUs, null, 2))
    
    console.log(`✅ 图片URL修复完成！`)
    console.log('新图片源: Unsplash (更稳定)')
    
    return fixedSKUs
    
  } catch (error) {
    console.error('❌ 图片URL修复失败:', error)
    return null
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  fixImageUrls()
}

export { fixImageUrls }
