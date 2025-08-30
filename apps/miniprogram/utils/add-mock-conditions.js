/**
 * 为Mock数据添加成色字段的脚本
 */

const fs = require('fs')
const path = require('path')

// 成色选项
const CONDITIONS = [
  { label: '全新', value: 'new', grade: 5, discount: 0 },
  { label: '九五新', value: '95_new', grade: 4, discount: 0.05 },
  { label: '九成新', value: '90_new', grade: 3, discount: 0.1 },
  { label: '八成新', value: '80_new', grade: 2, discount: 0.2 },
  { label: '七成新', value: '70_new', grade: 1, discount: 0.3 }
]

function addConditionsToMockData() {
  const mockDataPath = path.join(__dirname, 'mock-data.js')
  
  try {
    // 读取mock-data.js文件
    let content = fs.readFileSync(mockDataPath, 'utf8')
    
    // 为每个商品添加成色字段（简单的字符串替换）
    CONDITIONS.forEach((condition, index) => {
      const gradePattern = `"monthlyPrice": (\\d+),`
      const replacement = `"monthlyPrice": $1,
          condition: { label: '${condition.label}', value: '${condition.value}', grade: ${condition.grade}, discount: ${condition.discount} },
          condition_grade: ${condition.grade},`
      
      // 只替换还没有condition字段的商品
      if (!content.includes(`condition_grade: ${condition.grade}`)) {
        content = content.replace(new RegExp(gradePattern), replacement)
      }
    })
    
    // 写回文件
    fs.writeFileSync(mockDataPath, content)
    
    console.log('✅ Mock数据成色字段添加完成')
    
  } catch (error) {
    console.error('❌ 添加成色字段失败:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addConditionsToMockData()
}

module.exports = { addConditionsToMockData }
