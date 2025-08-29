# TabBar 图标说明

由于微信小程序要求 tabBar 图标必须是本地图片文件，您需要准备以下8个图标文件：

## 图标规格要求：
- 格式：PNG
- 尺寸：78px × 78px
- 普通状态：灰色或深色
- 选中状态：蓝色或彩色

## 需要的图标文件：
1. home.png - 首页图标（普通状态）
2. home-active.png - 首页图标（选中状态）
3. category.png - 分类图标（普通状态）
4. category-active.png - 分类图标（选中状态）
5. search.png - 搜索图标（普通状态）
6. search-active.png - 搜索图标（选中状态）
7. profile.png - 我的图标（普通状态）
8. profile-active.png - 我的图标（选中状态）

## 临时解决方案：
如果暂时没有图标，可以从 app.json 中删除 iconPath 配置，使用纯文字 tabBar。
