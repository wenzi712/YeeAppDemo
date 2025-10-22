# Yee Note 前端项目

这是 Yee Note 笔记应用的前端项目，基于 Vue.js 3 构建，提供简洁、高效的用户界面和交互体验。

## 项目介绍

Yee Note 前端是一个现代化的单页应用(SPA)，负责用户界面展示、用户交互处理和与后端API的数据交互。主要功能包括笔记的创建、编辑、查看、搜索，分类管理，用户认证等。

## 技术栈

- **框架**：Vue.js 3.x
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由管理**：Vue Router 4.x
- **UI组件**：自定义组件 + Tailwind CSS
- **HTTP请求**：Axios
- **富文本编辑**：Quill
- **Markdown渲染**：marked + DOMPurify
- **代码高亮**：highlight.js
- **图标库**：lucide-vue-next
- **时间处理**：dayjs
- **通知组件**：vue3-toastify
- **CSS预处理器**：SCSS

## 项目结构

```
front/
├── public/            # 静态资源文件
├── src/               # 源代码目录
│   ├── assets/        # 资源文件（图片、字体等）
│   ├── components/    # 可复用组件
│   │   ├── Button.vue
│   │   ├── Card.vue
│   │   ├── CategorySelect.vue
│   │   ├── Icon.vue
│   │   ├── Input.vue
│   │   ├── List.vue
│   │   ├── Modal.vue
│   │   ├── Textarea.vue
│   │   └── Toast.vue
│   ├── router/        # 路由配置
│   │   └── index.js
│   ├── stores/        # Pinia状态管理
│   │   ├── note.js
│   │   └── user.js
│   ├── styles/        # 全局样式
│   │   ├── global.scss
│   │   ├── mixins.scss
│   │   └── variables.scss
│   ├── views/         # 页面组件
│   │   ├── Category.vue
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   ├── NoteDetail.vue
│   │   ├── NoteEdit.vue
│   │   └── Register.vue
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── .gitignore         # Git忽略文件
├── index.html         # HTML模板
├── package.json       # 项目配置和依赖
├── package-lock.json  # 依赖版本锁定
└── vite.config.js     # Vite配置
```

## 主要功能模块

### 1. 用户认证模块
- 登录/注册页面
- JWT令牌管理
- 用户信息存储

### 2. 笔记管理模块
- 笔记列表展示（首页）
- 笔记详情查看
- 笔记编辑（富文本编辑器）
- 笔记搜索和筛选

### 3. 分类管理模块
- 分类列表和编辑
- 分类颜色标记
- 笔记分类关联

### 4. 工具组件
- 模态框
- 列表组件
- 表单组件
- 提示组件

## 安装和运行

### 前置要求

- Node.js (v14+)
- npm 或 yarn

### 安装步骤

```bash
# 克隆仓库（如果需要）
git clone [仓库地址]

# 进入前端目录
cd code/front

# 安装依赖
npm install
# 或使用 yarn
yarn install
```

### 开发环境运行

```bash
# 启动开发服务器
npm run dev
# 或使用 yarn
yarn dev
```

开发服务器默认运行在 http://localhost:5173/

### 构建生产版本

```bash
# 构建生产版本
npm run build
# 或使用 yarn
yarn build

# 预览生产构建
npm run preview
# 或使用 yarn
yarn preview
```

## 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Vue.js 3 的 Composition API 最佳实践
- 组件命名使用 PascalCase
- 样式采用 SCSS 和 Tailwind CSS 混合方案
- 状态管理使用 Pinia

## 开发说明

### 添加新页面
1. 在 `views/` 目录下创建新的 Vue 组件
2. 在 `router/index.js` 中添加路由配置
3. 如需状态管理，在 `stores/` 目录下创建相应的 store

### 添加新组件
1. 在 `components/` 目录下创建新的 Vue 组件
2. 确保组件命名规范且具有良好的可复用性

### API 调用
- 使用 Axios 进行 HTTP 请求
- API基础URL配置在环境变量中（详见环境变量配置）
- 使用JWT进行身份认证，token存储在localStorage中
- 所有API调用应处理加载状态和错误提示

### 环境变量配置
项目支持通过环境变量定制配置：

```bash
# .env.development 示例（开发环境）
VITE_API_BASE_URL=http://localhost:3000/api

# .env.production 示例（生产环境）
VITE_API_BASE_URL=https://api.yeenote.com/api
```

### 测试
```bash
# 运行单元测试（待实现）
npm run test:unit

# 运行E2E测试（待实现）
npm run test:e2e

# 代码检查
npm run lint
```

### 贡献指南
1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

请确保您的代码遵循项目的代码规范，并通过所有测试。

## 待完成功能

- 云同步页面
- 用户设置页面
- 高级搜索功能
- 数据统计和分析
- 深色主题支持
- 移动端响应式优化
- 测试框架和测试用例

## 项目状态

- 版本: 0.1.0 (开发中)
- 核心功能已实现：笔记管理、分类管理、用户认证
- 云同步和用户设置功能正在开发中

## 部署指南

### 生产环境部署
1. 构建生产版本
```bash
npm run build
```

2. 部署到静态文件服务器
   - 可使用Nginx、Apache等Web服务器
   - 也可部署到Vercel、Netlify、GitHub Pages等平台

3. Nginx配置示例
```nginx
server {
    listen 80;
    server_name yeenote.example.com;

    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend-server:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 许可证

MIT License

## 相关链接

- [项目主仓库](https://github.com/wenzi712/YeeAppDemo)
- [后端项目](https://github.com/wenzi712/YeeAppDemo/tree/main/code/backend)
