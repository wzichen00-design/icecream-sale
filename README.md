# 🍦 雪糕图片展示小程序

一款基于微信云开发的雪糕图片展示与管理小程序，支持雪糕展示、分类筛选、搜索、管理员后台管理等核心功能。

## 📱 功能特性

### 用户端功能
- 🏠 **雪糕展示**：瀑布流布局展示雪糕，支持图片预览
- 🔍 **雪糕搜索**：支持雪糕名称模糊搜索
- 📂 **分类筛选**：支持按雪糕、冰淇淋、冰棍等分类筛选
- 📱 **雪糕详情**：支持多图轮播展示

### 管理端功能
- 🔐 **权限管理**：基于 OpenID 的管理员权限验证
- ➕ **雪糕发布**：支持多图上传、雪糕信息编辑
- ✏️ **雪糕编辑**：修改雪糕信息、图片管理
- 🗑️ **雪糕删除**：支持软删除，数据可恢复
- 👥 **管理员设置**：可视化添加/移除管理员

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| 微信小程序 | 前端框架 |
| 微信云开发 | 后端服务 |
| 云数据库 | 数据存储 |
| 云函数 | 服务端逻辑 |
| 云存储 | 图片存储 |

## 📁 项目结构

```
icecream-sale/
├── cloudfunctions/          # 云函数目录
│   ├── getOpenid/          # 获取用户 OpenID
│   ├── manageAdmin/        # 管理员管理
│   └── productService/     # 雪糕服务
├── pages/                   # 页面目录
│   ├── index/              # 首页（雪糕列表）
│   ├── manage/             # 后台管理页
│   ├── admin/              # 发布雪糕页
│   └── adminSettings/      # 管理员设置页
├── utils/                   # 工具类
│   ├── api.js              # API 服务层
│   ├── config.js           # 配置管理
│   ├── error.js            # 错误处理
│   └── util.js             # 公共工具函数
├── images/                  # 图片资源
├── database/               # 数据库安全规则
├── docs/                   # 文档目录
├── app.js                  # 小程序入口
├── app.json                # 小程序配置
└── app.wxss                # 全局样式
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- 微信开发者工具 >= 1.05.0
- 微信小程序 AppID

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/icecream-sale.git
cd icecream-sale
```

2. **导入项目**
   - 打开微信开发者工具
   - 导入项目，选择项目目录
   - 填入你的 AppID

3. **配置云开发环境**
   - 开通云开发服务
   - 修改 `utils/config.js` 中的云环境 ID
   ```javascript
   const ENV = {
     dev: {
       cloudEnv: '你的云环境ID'
     },
     prod: {
       cloudEnv: '你的云环境ID'
     }
   };
   ```

4. **创建数据库集合**
   - 在云开发控制台创建 `products` 和 `config` 集合

5. **部署云函数**
   - 右键 `cloudfunctions` 文件夹选择云环境
   - 依次上传部署三个云函数

6. **初始化管理员**
   - 在 `config` 集合中添加管理员记录
   ```json
   {
     "_id": "admins",
     "adminList": ["你的openid"]
   }
   ```

7. **运行项目**
   - 点击「编译」预览小程序

## 📖 文档

- [开发文档](./docs/开发文档.md) - 详细的开发指南
- [上线部署文档](./docs/上线部署文档.md) - 上线流程说明
- [API 文档](./docs/API文档.md) - 云函数接口说明
- [常见问题](./docs/常见问题.md) - 问题解答

## 🔐 安全特性

- ✅ 后端权限验证（云函数层）
- ✅ 数据库安全规则
- ✅ 敏感信息配置化
- ✅ 软删除机制

## 📊 数据库设计

### products 集合（雪糕）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 雪糕ID |
| name | string | 雪糕名称 |
| spec | string | 雪糕规格 |
| description | string | 雪糕描述 |
| category | string | 雪糕分类 |
| fileID | string | 主图地址 |
| fileIDs | array | 图片列表 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |
| isDeleted | boolean | 是否删除 |

### config 集合（配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 固定为 "admins" |
| adminList | array | 管理员 OpenID 列表 |

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📮 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

⭐ 如果这个项目对你有帮助，欢迎 Star 支持！
