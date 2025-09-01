// 分类图标映射 - 使用深色图标确保在白色背景上清晰可见
const categoryIcons = {
  '沙发': '🛋️',
  '床': '🛏️',
  '餐桌': '🍽️',
  '椅子': '🪑',
  '书桌': '📚',
  '柜子': '🗄️',
  '装饰': '🎨',
  '灯具': '💡',
  '地毯': '🟫',
  '桌子': '🪑',
  '茶几': '☕',
  '床头柜': '🛏️',
  '衣柜': '👔',
  '鞋柜': '👟',
  '电视柜': '📺',
  '书架': '📖',
  '餐椅': '🍴',
  '办公椅': '💼',
  '休闲椅': '☕',
  '沙发床': '🛋️',
  '折叠床': '🛏️',
  '双人床': '🛏️',
  '单人床': '🛏️',
  '儿童床': '🧸',
  '餐桌椅': '🍽️',
  '书桌椅': '📚',
  '梳妆台': '💄',
  '鞋架': '👟',
  '衣架': '👔',
  '置物架': '📦',
  '花架': '🌸',
  '镜子': '🪞',
  '挂画': '🖼️',
  '花瓶': '🌺',
  '抱枕': '🛋️',
  '窗帘': '🪟',
  '床品': '🛏️',
  '毛巾': '🧺',
  '浴巾': '🛁',
  '厨房用品': '🍳',
  '卫浴用品': '🚿',
  '客厅': '🛋️',
  '卧室': '🛏️',
  '餐厅': '🍽️',
  '书房': '📚',
  '厨房': '🍳',
  '卫生间': '🚿',
  '阳台': '🌞',
  '儿童房': '🧸',
  '老人房': '👴',
  '客房': '🛏️'
}

// 获取分类图标
function getCategoryIcon(categoryName) {
  return categoryIcons[categoryName] || '📦' // 默认图标
}

// 获取分类图标和名称
function getCategoryDisplay(category) {
  const icon = getCategoryIcon(category.name || category)
  const name = category.name || category
  return { icon, name }
}

module.exports = {
  categoryIcons,
  getCategoryIcon,
  getCategoryDisplay
}
