# 家具租赁小程序 MVP

一个基于微信小程序的家具租赁平台最小可行产品（MVP），采用 mono-repo 架构。

## 📁 项目结构

```
家具租赁/
├── apps/
│   └── miniprogram/           # 微信小程序前端
│       ├── pages/             # 页面目录
│       │   ├── index/         # 首页
│       │   ├── category/      # 分类页
│       │   ├── list/          # 列表页（含筛选）
│       │   ├── detail/        # 商品详情页（PDP）
│       │   └── profile/       # 我的页面
│       ├── config/            # 配置目录
│       │   ├── env.js         # 环境配置（DEV/PROD）
│       │   └── README.md      # 环境配置说明
│       ├── utils/             # 工具类
│       │   ├── request.js     # 网络请求封装
│       │   └── config.js      # 全局配置
│       ├── app.js             # 小程序入口
│       ├── app.json           # 小程序配置
│       └── app.wxss           # 全局样式
├── services/
│   └── api/                   # 后端 API 服务
│       ├── src/
│       │   └── index.js       # API 入口文件
│       ├── seed/
│       │   └── sku.json       # 样例数据（20条家具数据）
│       ├── package.json       # 依赖配置
│       └── Dockerfile         # Docker 构建文件
├── packages/
│   └── types/                 # 共享类型定义
│       ├── index.d.ts         # TypeScript 类型定义
│       └── package.json       # 包配置
├── infra/                     # 基础设施配置
│   └── nginx.conf             # Nginx 配置文件
├── docker-compose.yml         # Docker Compose 配置
├── package.json               # 根目录包配置
└── README.md                  # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Docker & Docker Compose (可选)
- 微信开发者工具

### 环境配置

项目支持 DEV/PROD 两套环境配置，在 `apps/miniprogram/project.private.config.json` 中设置：

```json
{
  "env": "DEV"    // 开发环境（默认）
  // 或
  "env": "PROD"   // 生产环境
}
```

- **DEV环境**: `http://localhost:3000` + Mock数据 + 调试日志
- **PROD环境**: `https://api.furniture-rent.com` + 性能优化

详细说明请查看：`apps/miniprogram/config/README.md`

### 本地开发

#### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装 API 服务依赖
cd services/api
npm install
```

#### 2. 启动后端 API

```bash
# 在项目根目录
npm run dev:api

# 或者直接在 services/api 目录
cd services/api
npm run dev
```

API 服务将在 `http://localhost:3000` 启动

#### 3. 启动微信小程序

1. 打开微信开发者工具
2. 导入项目，选择 `apps/miniprogram` 目录
3. 配置 AppID（测试可使用测试号）
4. 点击编译运行

#### 4. 同时启动（推荐）

```bash
# 在项目根目录运行，同时启动 API 和小程序开发
npm run dev
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📚 API 接口文档

### 基础 URL
- 开发环境: `http://localhost:3000`
- 生产环境: 根据部署配置

### 接口列表

#### 1. 获取筛选元数据
```http
GET /api/filters/meta
```

返回分类、价格区间、品牌等筛选条件。

#### 2. 筛选商品
```http
POST /api/filter
Content-Type: application/json

{
  "categories": ["sofa", "chair"],
  "priceRange": {"min": 100, "max": 500},
  "brands": ["ikea", "muji"]
}
```

#### 3. 搜索商品
```http
GET /api/search?q=沙发&page=1&limit=10
```

#### 4. 获取商品详情
```http
GET /api/sku/:id
```

#### 5. 获取推荐商品
```http
GET /api/sku/:id/recommendations
```

#### 6. 创建意向订单
```http
POST /api/intent-order
Content-Type: application/json

{
  "skuId": "sku_001",
  "duration": 3,
  "startDate": "2024-02-01",
  "userInfo": {
    "name": "张三",
    "phone": "13800138000"
  }
}
```

## 📱 小程序页面

### 1. 首页 (pages/index)
- 轮播广告位
- 分类导航
- 热门商品展示
- 搜索入口

### 2. 分类页 (pages/category)
- 左侧分类列表
- 右侧商品网格
- 分类商品展示

### 3. 列表页 (pages/list)
- 搜索功能
- 筛选抽屉（分类、价格、品牌）
- 商品列表展示
- 上拉加载更多

### 4. 商品详情页 (pages/detail)
- 商品图片轮播
- 基本信息展示
- 尺寸信息 + 示意图占位
- 租赁时长选择
- 相关推荐
- 立即租赁

### 5. 我的页面 (pages/profile)
- 用户信息
- 订单列表
- 设置选项
- 客服联系

## 💾 数据说明

### 样例数据导入

项目包含 20 条样例家具数据，位于 `services/api/seed/sku.json`：

- 包含沙发、椅子、桌子、床等4个分类
- 涵盖 IKEA、无印良品、H&M Home 三个品牌
- 每个商品包含完整的属性信息（价格、尺寸、材质等）

### 数据结构

```typescript
interface SKU {
  id: string              // 商品ID
  name: string            // 商品名称
  description: string     // 商品描述
  category: string        // 分类
  brand: string          // 品牌
  monthlyPrice: number   // 月租价格
  originalPrice: number  // 原价
  images: string[]       // 图片URL数组
  dimensions: {          // 尺寸信息
    length: number
    width: number
    height: number
  }
  color: string          // 颜色
  material: string       // 材质
  available: boolean     // 是否可租
  tags: string[]         // 标签
}
```

## 🛠️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Fastify** - Web 框架
- **JSON** - 数据存储（MVP 阶段）

### 前端
- **微信小程序原生** - 前端框架
- **WXSS** - 样式
- **JavaScript** - 逻辑

### 基础设施
- **Docker** - 容器化
- **Nginx** - 反向代理
- **Docker Compose** - 容器编排

### 开发工具
- **TypeScript** - 类型定义
- **Nodemon** - 开发热重载
- **Concurrently** - 并行任务

## 🔄 开发工作流

### 添加新功能

1. 在 `packages/types` 中定义相关类型
2. 在 `services/api` 中实现 API 接口
3. 在 `apps/miniprogram` 中开发页面功能
4. 更新文档

### 调试技巧

1. **API 调试**: 使用浏览器访问 `http://localhost:3000/health` 检查服务状态
2. **小程序调试**: 使用微信开发者工具的调试面板
3. **日志查看**: 检查终端输出和微信开发者工具控制台

## 📋 待扩展功能

- [ ] 用户认证系统
- [ ] 支付集成
- [ ] 订单管理系统
- [ ] 库存管理
- [ ] 数据库集成
- [ ] 图片上传功能
- [ ] 推送通知
- [ ] 评价系统
- [ ] 地址管理
- [ ] 物流追踪

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: your.email@example.com
- 项目链接: [GitHub Repository URL]

---

**注意**: 这是一个 MVP 版本，仅包含核心功能的基础实现。生产环境部署前请完善安全性、性能优化和错误处理。
