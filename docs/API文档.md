# API 文档

## 目录

- [概述](#概述)
- [云函数列表](#云函数列表)
- [getOpenid](#getopenid)
- [manageAdmin](#manageadmin)
- [productService](#productservice)
- [错误码说明](#错误码说明)

---

## 概述

本项目使用微信云开发，所有后端逻辑通过云函数实现。云函数统一返回以下格式：

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 失败响应

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "错误描述"
}
```

---

## 云函数列表

| 云函数名 | 说明 |
|----------|------|
| getOpenid | 获取用户 OpenID |
| manageAdmin | 管理员管理 |
| productService | 雪糕服务 |

---

## getOpenid

获取当前用户的 OpenID、AppID、UnionID。

### 请求参数

无需参数。

### 调用示例

```javascript
const { getOpenid } = require('../../utils/api');

const result = await getOpenid();
```

### 返回数据

```json
{
  "openid": "oXXXX-xxxxxxxxxxxxxxxx",
  "appid": "wxXXXXXXXXXXXXXXXX",
  "unionid": "oXXXX-xxxxxxxxxxxxxxxx"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| openid | string | 用户唯一标识 |
| appid | string | 小程序 AppID |
| unionid | string | 用户统一标识（需绑定开放平台） |

---

## manageAdmin

管理员管理相关操作。

### Actions

| Action | 说明 | 权限 |
|--------|------|------|
| init | 初始化管理员配置 | 无需权限 |
| check | 检查当前用户是否为管理员 | 无需权限 |
| list | 获取管理员列表 | 管理员 |
| add | 添加管理员 | 管理员 |
| remove | 移除管理员 | 管理员 |

---

### init - 初始化管理员配置

首次使用时初始化管理员配置，调用者自动成为管理员。

#### 请求参数

```json
{
  "action": "init"
}
```

#### 调用示例

```javascript
const { adminService } = require('../../utils/api');

const result = await adminService.init();
```

#### 返回数据

```json
{
  "success": true,
  "message": "初始化成功",
  "adminList": ["oXXXX-xxxxxxxxxxxxxxxx"]
}
```

---

### check - 检查管理员权限

检查当前用户是否为管理员。

#### 请求参数

```json
{
  "action": "check"
}
```

#### 调用示例

```javascript
const { adminService } = require('../../utils/api');

const result = await adminService.check();
```

#### 返回数据

```json
{
  "success": true,
  "isAdmin": true,
  "openid": "oXXXX-xxxxxxxxxxxxxxxx"
}
```

---

### list - 获取管理员列表

获取所有管理员的 OpenID 列表。

#### 请求参数

```json
{
  "action": "list"
}
```

#### 调用示例

```javascript
const { adminService } = require('../../utils/api');

const result = await adminService.list();
```

#### 返回数据

```json
{
  "success": true,
  "adminList": [
    "oXXXX-xxxxxxxxxxxxxxxx",
    "oYYYY-yyyyyyyyyyyyyyyy"
  ]
}
```

---

### add - 添加管理员

将指定用户添加为管理员。

#### 请求参数

```json
{
  "action": "add",
  "openid": "oXXXX-xxxxxxxxxxxxxxxx"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定为 "add" |
| openid | string | 是 | 要添加的用户 OpenID |

#### 调用示例

```javascript
const { adminService } = require('../../utils/api');

const result = await adminService.add('oXXXX-xxxxxxxxxxxxxxxx');
```

#### 返回数据

```json
{
  "success": true,
  "adminList": [
    "oXXXX-xxxxxxxxxxxxxxxx",
    "oYYYY-yyyyyyyyyyyyyyyy"
  ]
}
```

---

### remove - 移除管理员

移除指定管理员。

#### 请求参数

```json
{
  "action": "remove",
  "openid": "oXXXX-xxxxxxxxxxxxxxxx"
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定为 "remove" |
| openid | string | 是 | 要移除的用户 OpenID |

#### 调用示例

```javascript
const { adminService } = require('../../utils/api');

const result = await adminService.remove('oXXXX-xxxxxxxxxxxxxxxx');
```

#### 返回数据

```json
{
  "success": true,
  "adminList": [
    "oYYYY-yyyyyyyyyyyyyyyy"
  ]
}
```

---

## productService

雪糕相关操作。

### Actions

| Action | 说明 | 权限 |
|--------|------|------|
| getProducts | 获取雪糕列表 | 无需权限 |
| addProduct | 添加雪糕 | 管理员 |
| updateProduct | 更新雪糕 | 管理员 |
| deleteProduct | 删除雪糕 | 管理员 |
| checkPermission | 检查权限 | 无需权限 |

---

### getProducts - 获取雪糕列表

获取雪糕列表，支持分页、搜索、分类筛选。

#### 请求参数

```json
{
  "action": "getProducts",
  "data": {
    "category": "雪糕",
    "keyword": "老冰棍",
    "lastId": "xxx",
    "lastCreateTime": "2024-01-01T00:00:00.000Z",
    "pageSize": 10
  }
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 搜索关键词 |
| lastId | string | 否 | 分页游标：上一页最后一条记录 ID |
| lastCreateTime | string | 否 | 分页游标：上一页最后一条记录时间 |
| pageSize | number | 否 | 每页数量，默认 10 |

#### 调用示例

```javascript
const { productService } = require('../../utils/api');

// 首页加载
const result = await productService.getProducts({
  pageSize: 10
});

// 加载更多
const result = await productService.getProducts({
  lastId: lastId,
  lastCreateTime: lastCreateTime,
  pageSize: 10
});

// 搜索
const result = await productService.getProducts({
  keyword: '老冰棍',
  pageSize: 10
});

// 分类筛选
const result = await productService.getProducts({
  category: '雪糕',
  pageSize: 10
});
```

#### 返回数据

```json
{
  "products": [
    {
      "_id": "xxx",
      "name": "老冰棍",
      "spec": "10支/箱",
      "description": "经典老冰棍",
      "category": "雪糕",
      "fileID": "cloud://xxx",
      "fileIDs": ["cloud://xxx"],
      "createTime": { "$date": "2024-01-01T00:00:00.000Z" },
      "updateTime": { "$date": "2024-01-01T00:00:00.000Z" }
    }
  ],
  "hasMore": true,
  "lastId": "xxx",
  "lastCreateTime": { "$date": "2024-01-01T00:00:00.000Z" }
}
```

---

### addProduct - 添加雪糕

添加新雪糕。

#### 请求参数

```json
{
  "action": "addProduct",
  "data": {
    "name": "老冰棍",
    "spec": "10支/箱",
    "description": "经典老冰棍",
    "category": "雪糕",
    "fileIDs": ["cloud://xxx"]
  }
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 雪糕名称 |
| spec | string | 是 | 雪糕规格 |
| description | string | 否 | 雪糕描述 |
| category | string | 否 | 雪糕分类 |
| fileIDs | array | 是 | 图片地址列表 |

#### 调用示例

```javascript
const { productService } = require('../../utils/api');

const result = await productService.addProduct({
  name: '老冰棍',
  spec: '10支/箱',
  description: '经典老冰棍',
  category: '雪糕',
  fileIDs: ['cloud://xxx']
});
```

#### 返回数据

```json
{
  "success": true,
  "data": {
    "_id": "xxx"
  }
}
```

---

### updateProduct - 更新雪糕

更新雪糕信息。

#### 请求参数

```json
{
  "action": "updateProduct",
  "data": {
    "productId": "xxx",
    "name": "老冰棍",
    "spec": "10支/箱",
    "description": "经典老冰棍",
    "category": "雪糕",
    "fileIDs": ["cloud://xxx"]
  }
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 雪糕 ID |
| name | string | 是 | 雪糕名称 |
| spec | string | 是 | 雪糕规格 |
| description | string | 否 | 雪糕描述 |
| category | string | 否 | 雪糕分类 |
| fileIDs | array | 是 | 图片地址列表 |

#### 调用示例

```javascript
const { productService } = require('../../utils/api');

const result = await productService.updateProduct('xxx', {
  name: '老冰棍（更新）',
  spec: '20支/箱',
  description: '经典老冰棍，大包装',
  category: '雪糕',
  fileIDs: ['cloud://xxx']
});
```

#### 返回数据

```json
{
  "success": true
}
```

---

### deleteProduct - 删除雪糕

软删除雪糕。

#### 请求参数

```json
{
  "action": "deleteProduct",
  "data": {
    "productId": "xxx",
    "fileIDs": ["cloud://xxx"]
  }
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | string | 是 | 雪糕 ID |
| fileIDs | array | 否 | 要删除的图片地址列表 |

#### 调用示例

```javascript
const { productService } = require('../../utils/api');

const result = await productService.deleteProduct('xxx', ['cloud://xxx']);
```

#### 返回数据

```json
{
  "success": true
}
```

---

### checkPermission - 检查权限

检查当前用户是否有管理权限。

#### 请求参数

```json
{
  "action": "checkPermission"
}
```

#### 调用示例

```javascript
const { productService } = require('../../utils/api');

const result = await productService.checkPermission();
```

#### 返回数据

```json
{
  "success": true,
  "data": {
    "isAdmin": true,
    "openid": "oXXXX-xxxxxxxxxxxxxxxx"
  }
}
```

---

## 错误码说明

### 通用错误码

| 错误码 | 说明 |
|--------|------|
| SUCCESS | 成功 |
| INTERNAL_ERROR | 服务器内部错误 |
| UNKNOWN_ACTION | 未知操作 |

### 权限错误码

| 错误码 | 说明 |
|--------|------|
| PERMISSION_DENIED | 无权限执行此操作 |

### 参数错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_PARAM | 参数错误 |
| INVALID_OPERATION | 无效操作 |

### 云函数错误码

| 错误码 | 说明 |
|--------|------|
| CLOUD_FUNCTION_ERROR | 云函数调用失败 |

### 错误处理示例

```javascript
const { productService } = require('../../utils/api');
const { handleError } = require('../../utils/error');

try {
  const result = await productService.addProduct({ ... });
  // 处理成功结果
} catch (error) {
  // 统一错误处理
  handleError(error);
  
  // 或自定义处理
  if (error.code === 'PERMISSION_DENIED') {
    console.log('无权限');
  } else if (error.code === 'INVALID_PARAM') {
    console.log('参数错误');
  }
}
```

---

## 调用方式

### 方式一：使用 API 服务层（推荐）

```javascript
const { productService, adminService, getOpenid } = require('../../utils/api');

// 获取雪糕列表
const products = await productService.getProducts({ pageSize: 10 });

// 添加雪糕
await productService.addProduct({ name: 'xxx', ... });

// 检查权限
const { isAdmin } = await adminService.check();
```

### 方式二：直接调用云函数

```javascript
wx.cloud.callFunction({
  name: 'productService',
  data: {
    action: 'getProducts',
    data: { pageSize: 10 }
  },
  success: res => {
    console.log(res.result);
  },
  fail: err => {
    console.error(err);
  }
});
```

---

## 最佳实践

### 1. 使用 API 服务层

统一使用 `utils/api.js` 封装的方法，便于维护和错误处理。

### 2. 错误处理

所有 API 调用都应该进行错误处理：

```javascript
try {
  const result = await productService.getProducts({ ... });
  // 处理成功
} catch (error) {
  // 处理错误
  console.error(error);
  wx.showToast({
    title: error.message || '操作失败',
    icon: 'none'
  });
}
```

### 3. 分页加载

使用游标分页，避免使用 skip：

```javascript
// 首次加载
const firstPage = await productService.getProducts({ pageSize: 10 });

// 加载更多
const nextPage = await productService.getProducts({
  lastId: firstPage.lastId,
  lastCreateTime: firstPage.lastCreateTime,
  pageSize: 10
});
```

### 4. 图片上传

先上传图片获取 fileID，再调用添加雪糕接口：

```javascript
// 1. 上传图片
const uploadResult = await wx.cloud.uploadFile({
  cloudPath: `products/${Date.now()}.jpg`,
  filePath: tempFilePath
});

// 2. 添加雪糕
await productService.addProduct({
  name: 'xxx',
  fileIDs: [uploadResult.fileID]
});
```
