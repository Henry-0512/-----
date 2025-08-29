# 环境配置说明

## 📋 概述

本项目支持 DEV（开发）和 PROD（生产）两套环境配置，可以通过简单的配置文件切换实现不同环境的自动化管理。

## 🔧 配置文件

### 1. 环境配置文件：`config/env.js`
- 定义了开发和生产环境的所有配置参数
- 支持 API 地址、超时时间、调试模式等配置
- 提供了完整的工具函数和日志系统

### 2. 项目配置文件：`project.private.config.json`
- 控制当前使用哪个环境
- 通过 `env` 字段设置环境名称

## 🚀 环境切换方法

### 方法1：修改配置文件（推荐）
在 `project.private.config.json` 中设置 `env` 字段：

```json
{
  "env": "DEV",  // 开发环境
  // 或
  "env": "PROD"  // 生产环境
}
```

### 方法2：代码中动态判断
```javascript
const { getCurrentEnv, isDev, isProd } = require('./config/env.js')

if (isDev()) {
  // 开发环境逻辑
} else if (isProd()) {
  // 生产环境逻辑
}
```

## 🌍 环境配置详情

### 开发环境 (DEV)
- **API地址**: `http://localhost:3000`
- **超时时间**: 10秒
- **调试模式**: 开启
- **Mock数据**: 启用
- **日志级别**: debug

### 生产环境 (PROD)
- **API地址**: `https://api.furniture-rent.com`
- **超时时间**: 5秒
- **调试模式**: 关闭
- **Mock数据**: 禁用
- **日志级别**: error

## 📱 使用示例

### 1. 获取环境配置
```javascript
const { getBaseURL, getApiTimeout, isDebugEnabled } = require('../config/env.js')

console.log('API地址:', getBaseURL())
console.log('超时时间:', getApiTimeout())
console.log('调试模式:', isDebugEnabled())
```

### 2. 环境判断
```javascript
const { isDev, isProd, getCurrentEnv } = require('../config/env.js')

console.log('当前环境:', getCurrentEnv())

if (isDev()) {
  console.log('这是开发环境')
}

if (isProd()) {
  console.log('这是生产环境')
}
```

### 3. 日志记录
```javascript
const { log } = require('../config/env.js')

log.debug('调试信息')  // 仅开发环境显示
log.info('普通信息')   // 所有环境显示
log.warn('警告信息')   // 所有环境显示
log.error('错误信息')  // 所有环境显示
```

## 🔄 自动化集成

项目的网络请求模块 (`utils/request.js`) 已经自动集成环境配置：

- 自动使用对应环境的 API 地址
- 自动设置超时时间
- 开发环境自动打印请求日志
- 生产环境优化性能设置

## ⚙️ 高级配置

如需添加新的环境配置项，请修改 `config/env.js` 中的 `ENV_CONFIG` 对象：

```javascript
const ENV_CONFIG = {
  DEV: {
    BASE_URL: 'http://localhost:3000',
    API_TIMEOUT: 10000,
    DEBUG: true,
    // 添加新的配置项
    NEW_FEATURE: true
  },
  PROD: {
    BASE_URL: 'https://api.furniture-rent.com',
    API_TIMEOUT: 5000,
    DEBUG: false,
    // 添加新的配置项
    NEW_FEATURE: false
  }
}
```

## 🎯 最佳实践

1. **开发阶段**: 使用 DEV 环境，启用调试和 Mock 数据
2. **测试阶段**: 使用 PROD 环境，关闭调试和 Mock 数据
3. **生产发布**: 确保使用 PROD 环境配置
4. **配置修改**: 统一在 `config/env.js` 中修改，避免硬编码
5. **日志记录**: 使用环境配置的 log 工具，自动控制输出级别

## 🚨 注意事项

1. `project.private.config.json` 文件请不要提交到版本控制系统
2. 生产环境 API 地址需要根据实际情况修改
3. 环境切换后需要重新编译小程序
4. 调试日志在生产环境会自动关闭，提升性能
