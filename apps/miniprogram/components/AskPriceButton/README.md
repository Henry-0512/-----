# AskPriceButton 全局咨询价格按钮组件

## 📝 组件说明

统一全站"咨询价格"按钮的样式和行为，支持多种场景和尺寸变体。

## 🎯 使用场景

- ✅ **ProductCard**: 商品卡片中的价格咨询
- ✅ **列表页**: 商品列表项的咨询按钮  
- ✅ **详情页PDP**: 主要CTA按钮
- ✅ **搜索栏**: 小尺寸描边样式（预留）
- ✅ **弹窗**: 价格咨询弹窗（预留）

## 📋 Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `label` | String | `"咨询价格"` | 按钮文字 |
| `fullWidth` | Boolean | `true` | 是否占满容器宽度 |
| `size` | String | `"md"` | 尺寸大小：`"md"` \| `"sm"` |
| `variant` | String | `"solid"` | 样式变体：`"solid"` \| `"outline"` |
| `disabled` | Boolean | `false` | 是否禁用 |
| `loading` | Boolean | `false` | 是否显示加载状态 |
| `data` | Object | `{}` | 埋点上下文数据 |

## 🎨 样式规格

### 尺寸规格
- **md**: 高度 `72rpx`，字体 `28rpx`，内边距 `0 32rpx`
- **sm**: 高度 `56rpx`，字体 `24rpx`，内边距 `0 24rpx`

### 样式变体
- **solid**: 渐变背景 `linear-gradient(90deg, #6F7BF7 0%, #9B6DF3 100%)`
- **outline**: 透明背景 + `#6F7BF7` 边框

### 响应式适配
- 小屏幕 (≤375px): 减少高度和字体大小
- 大屏幕 (≥414px): 增加高度和字体大小

## 🔧 使用方法

### 1. 在页面JSON中注册组件

\`\`\`json
{
  "usingComponents": {
    "ask-price-button": "../../components/AskPriceButton/index"
  }
}
\`\`\`

### 2. 在WXML中使用

\`\`\`xml
<!-- 标准用法 -->
<ask-price-button 
  label="咨询价格"
  fullWidth="{{true}}"
  size="md"
  variant="solid"
  bind:tap="onAskPrice"
  data="{{buttonData}}"
/>

<!-- 小尺寸描边样式 -->
<ask-price-button 
  label="询价"
  fullWidth="{{false}}"
  size="sm"
  variant="outline"
  bind:tap="onAskPriceFromSearch"
  data="{{searchButtonData}}"
/>

<!-- 加载状态 -->
<ask-price-button 
  label="提交中..."
  loading="{{true}}"
  disabled="{{true}}"
/>
\`\`\`

### 3. 在JS中处理事件

\`\`\`javascript
Page({
  data: {
    buttonData: {
      sku_id: 'sku_001',
      product_name: '现代沙发',
      from_page: 'detail',
      price_mode: 'ask'
    }
  },

  onAskPrice(e) {
    const { data } = e.detail
    // 处理业务逻辑（埋点已由组件自动处理）
    wx.showModal({
      title: '价格咨询',
      content: '请联系客服获取详细报价...'
    })
  }
})
\`\`\`

## 📊 埋点追踪

组件会自动发送 `ASK_PRICE_CLICK` 埋点事件，包含以下数据：

\`\`\`javascript
{
  // 组件传入的data
  sku_id: 'sku_001',
  product_name: '现代沙发', 
  from_page: 'detail',
  price_mode: 'ask',
  
  // 组件自动添加
  timestamp: '2025-01-01T00:00:00.000Z',
  component: 'AskPriceButton'
}
\`\`\`

## 🎯 测试场景

### 必测场景
1. **首页商品卡片**: 价格模式为 `ask` 时显示按钮
2. **列表页商品**: 筛选结果中的咨询按钮
3. **详情页PDP**: 主要CTA按钮区域
4. **搜索结果**: 搜索结果项中的按钮
5. **弹窗场景**: 价格咨询相关弹窗

### 测试要点
- ✅ 按钮文字居中，不跑偏
- ✅ 在flex容器中宽度100%
- ✅ 在行内容器中自适应宽度
- ✅ 不同屏幕尺寸下显示正常
- ✅ 点击动画效果流畅
- ✅ 埋点数据正确发送

## 🔗 相关文件

- 组件文件: `components/AskPriceButton/`
- 全局样式: `app.wxss` (`.action-btn` 相关类)
- 埋点配置: `utils/track.js` (`ASK_PRICE_CLICK` 事件)
- 使用示例: `components/product-card/`, `pages/detail/`
