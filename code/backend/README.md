# Yee Note 后端服务

Yee Note 是一款轻量级笔记应用，该项目为Yee Note 的后端服务，提供RESTful API接口，支持用户认证、笔记管理、分类管理和云端同步等功能。

## 技术栈

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- Multer (文件上传)
- Bcrypt (密码加密)

## 项目结构

```
backend/
├── models/            # 数据模型
│   ├── User.js        # 用户模型
│   ├── Note.js        # 笔记模型
│   ├── Category.js    # 分类模型
│   └── SyncRecord.js  # 同步记录模型
├── routes/            # API路由
│   ├── userRoutes.js  # 用户相关路由
│   ├── noteRoutes.js  # 笔记相关路由
│   ├── categoryRoutes.js # 分类相关路由
│   └── syncRoutes.js  # 同步相关路由
├── middleware/        # 中间件
│   ├── auth.js        # 认证中间件
│   └── upload.js      # 文件上传中间件
├── uploads/           # 上传文件存储目录
├── server.js          # 应用入口文件
├── package.json       # 项目配置和依赖
├── .env               # 环境变量配置
└── README.md          # 项目说明文档
```

## 快速开始

### 前置条件

- Node.js 14.x 或更高版本
- MongoDB 4.x 或更高版本

### 安装步骤

1. 克隆项目到本地

```bash
git clone <repository-url>
cd YeeAppDemo/code/backend
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制并编辑 `.env` 文件，设置您的环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下内容：

```
# 服务器配置
PORT=5000

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/yee-note

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 启动服务

#### 开发模式

```bash
npm run dev
```

使用 nodemon 启动，支持热重载。

#### 生产模式

```bash
npm start
```

### 健康检查

启动服务后，可以通过以下地址检查服务是否正常运行：

```
http://localhost:5000/health
```

## API 接口文档

### 用户相关接口

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取当前用户信息
- `PUT /api/users/profile` - 更新用户信息
- `POST /api/users/avatar` - 上传用户头像
- `PUT /api/users/sync-settings` - 更新同步设置

### 笔记相关接口

- `POST /api/notes` - 创建新笔记
- `GET /api/notes` - 获取用户的所有笔记（分页）
- `GET /api/notes/:id` - 获取单个笔记详情
- `PUT /api/notes/:id` - 更新笔记
- `DELETE /api/notes/:id` - 删除笔记（软删除）
- `PUT /api/notes/:id/restore` - 恢复已删除的笔记
- `POST /api/notes/:id/images` - 为笔记添加图片
- `DELETE /api/notes/:id/images/:imageIndex` - 删除笔记中的图片
- `GET /api/notes/sync/pending` - 获取待同步的笔记

### 分类相关接口

- `POST /api/categories` - 创建新分类
- `GET /api/categories` - 获取用户的所有分类
- `GET /api/categories/:id` - 获取单个分类详情
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类
- `POST /api/categories/batch` - 批量创建分类
- `GET /api/categories/sync/pending` - 获取待同步的分类

### 同步相关接口

- `POST /api/sync/record` - 创建新的同步记录
- `PUT /api/sync/record/:id` - 更新同步记录状态
- `GET /api/sync/records` - 获取同步历史记录
- `GET /api/sync/full` - 获取完整数据用于同步
- `POST /api/sync/resolve-conflicts` - 解决同步冲突

## 错误处理

所有API接口返回统一格式的响应：

```json
{
  "status": "success|error",
  "message": "错误或成功消息",
  "data": { ... } // 响应数据
}
```

常见错误状态码：

- `400` - 请求参数错误
- `401` - 未授权，请重新登录
- `404` - 资源不存在
- `500` - 服务器内部错误

## 安全注意事项

1. 生产环境中请修改 `.env` 文件中的 `JWT_SECRET` 为强随机字符串
2. 请勿在代码中硬编码敏感信息
3. 定期更新依赖包以修复安全漏洞

## 许可证

MIT