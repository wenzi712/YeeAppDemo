# Yee Note

一款简洁、高效的个人笔记管理应用，帮助用户轻松记录和管理日常笔记。

## 项目介绍

Yee Note 是一个基于Vue.js和Node.js开发的现代化笔记应用，提供笔记的创建、编辑、分类、搜索和云端同步等功能，致力于为用户提供流畅的笔记管理体验。

## 功能特性

- ✅ **用户认证**：登录、注册、密码管理
- ✅ **笔记管理**：创建、编辑、查看、删除笔记
- ✅ **富文本编辑**：支持多种文本格式，包括标题、列表、引用、代码块等
- ✅ **分类管理**：创建和管理笔记分类，支持颜色标记
- ✅ **搜索功能**：实时搜索笔记内容和标题
- ✅ **响应式设计**：适配桌面端和移动端
- 🚧 **云端同步**：数据同步到云端（开发中）
- 🚧 **用户设置**：个性化配置（开发中）

## 技术栈

### 前端
- Vue.js 3.x
- Vite
- Pinia (状态管理)
- Vue Router (路由管理)
- Tailwind CSS (样式框架)
- Axios (HTTP请求)
- lucide-vue-next (图标库)

### 后端
- Node.js
- Express.js
- MongoDB
- Mongoose (ODM)
- JWT (认证)

## 项目结构

```
YeeAppDemo/
├── code/
│   ├── backend/         # 后端代码
│   │   ├── middleware/  # 中间件
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   └── server.js    # 服务器入口
│   └── front/           # 前端代码
│       ├── public/      # 静态资源
│       └── src/         # 源代码
│           ├── assets/  # 资源文件
│           ├── components/ # 组件
│           ├── router/  # 路由配置
│           ├── stores/  # 状态管理
│           ├── views/   # 页面组件
│           └── App.vue  # 根组件
├── doc/                 # 文档
└── qa/                  # 测试相关
```

## 安装和运行

### 前置要求

- Node.js (v14+)
- MongoDB

### 后端安装

```bash
# 进入后端目录
cd code/backend

# 安装依赖
npm install

# 配置环境变量
# 复制 .env.example 为 .env 并填写相关配置

# 启动服务器
npm start
```

### 前端安装

```bash
# 进入前端目录
cd code/front

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

## 开发进度

- ✅ 前端基础框架搭建
- ✅ 核心页面实现（登录、注册、笔记列表、笔记详情、笔记编辑、分类管理）
- ✅ 后端数据模型设计
- ✅ 后端路由配置
- 🚧 后端控制器实现（进行中）
- 🚧 前后端集成（进行中）
- 🚧 云同步功能（计划中）
- 🚧 用户设置功能（计划中）

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request。

## 联系我们

如有问题或建议，请联系项目维护者。
- 项目维护者：Yee
