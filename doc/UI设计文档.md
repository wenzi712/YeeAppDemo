# Yee Note App UI设计文档

## 1. 设计概述

### 1.1 设计理念

Yee Note App采用简洁、清新的设计风格，以绿色为主色调，给用户带来舒适、高效的笔记体验。设计遵循现代UI设计原则，注重用户体验和交互流畅性。

### 1.2 色彩方案

- **主色调**：绿色系 (#4ade80) - 代表新鲜、活力和自然
- **辅助色**：
  - 蓝色 (#4299e1) - 用于工作分类标识
  - 黄色 (#fbbf24) - 用于生活分类标识  
  - 紫色 (#a78bfa) - 用于学习分类标识
  - 灰色 (#e5e7eb) - 用于未分类标识
- **中性色**：
  - 白色 (#ffffff) - 背景和卡片
  - 浅灰 (#f9fafb) - 页面背景
  - 中灰 (#6b7280) - 次要文本
  - 深灰 (#1f2937) - 主要文本

### 1.3 字体方案

- **主要字体**：系统默认无衬线字体
- **标题字重**：font-bold (700)
- **正文字重**：font-normal (400)
- **字号体系**：
  - 大标题：text-3xl
  - 中标题：text-2xl
  - 小标题：text-xl, text-lg
  - 正文：text-base
  - 辅助文字：text-sm, text-xs

## 2. 页面布局设计

### 2.1 整体布局

- **固定底部导航栏**：包含首页、编辑、分类、搜索、设置五个主要入口
- **页面内容区**：自适应高度，底部留白以避免被导航栏遮挡
- **响应式设计**：适配不同屏幕尺寸的移动设备

### 2.2 导航栏设计

```html
<nav class="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
  <div class="flex justify-around items-center h-16">
    <a href="#home" class="nav-item flex flex-col items-center justify-center text-gray-600 hover:text-green-400 transition-colors">
      <i class="fas fa-home text-xl"></i>
      <span class="text-xs mt-1">首页</span>
    </a>
    <!-- 其他导航项 -->
  </div>
</nav>
```

- **高度**：64px (h-16)
- **样式**：白色背景，阴影效果，z-index: 50
- **图标**：Font Awesome图标，大小text-xl
- **文字**：text-xs，与图标垂直居中对齐
- **激活状态**：文字颜色变为绿色 (#4ade80)
- **交互效果**：悬停时颜色渐变

## 3. 页面设计详情

### 3.1 首页 (Home)

#### 3.1.1 页面结构
- **顶部标题区域**：应用名称和副标题
- **功能区**：最近笔记标题和新建按钮
- **内容区**：笔记卡片列表

#### 3.1.2 关键组件

**笔记卡片设计**：

```html
<div class="note-card bg-white rounded-lg shadow p-4">
  <div class="flex justify-between items-start">
    <h3 class="font-medium text-lg">项目会议记录</h3>
    <span class="text-xs text-gray-500">今天 14:30</span>
  </div>
  <p class="text-gray-600 mt-2 line-clamp-2">讨论了Q3产品规划，确定了主要功能开发优先级...</p>
  <div class="mt-3 flex items-center">
    <span class="category-badge bg-blue-200"></span>
    <span class="text-xs text-gray-500">工作</span>
  </div>
</div>
```

- **卡片样式**：白色背景，圆角，阴影效果
- **内容布局**：标题+时间、内容摘要（最多两行）、分类标识
- **交互效果**：悬停时上移2px，阴影加深
- **分类标识**：圆形彩色徽章 + 分类名称

### 3.2 笔记编辑器 (NoteEditor)

#### 3.2.1 页面结构
- **顶部工具栏**：返回、添加图片、语音输入、保存按钮
- **编辑区域**：标题输入框、内容输入框
- **底部设置**：分类选择、标签管理

#### 3.2.2 关键组件

**工具栏设计**：
```html
<div class="editor-toolbar bg-white py-3 px-4 shadow-sm sticky top-0">
  <div class="flex justify-between items-center">
    <button class="text-gray-500">
      <i class="fas fa-arrow-left"></i>
    </button>
    <div class="flex space-x-2">
      <!-- 功能按钮 -->
    </div>
  </div>
</div>
```
- **样式**：白色背景，顶部固定，阴影效果
- **按钮布局**：左侧返回按钮，右侧功能按钮组

**编辑区域设计**：
- 标题：无框输入框，字号较大
- 内容：无边框文本域，左侧绿色竖线装饰

**标签管理设计**：
```html
<div class="inline-flex flex-wrap gap-2">
  <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">会议</span>
  <button class="text-green-500 text-xs">
    <i class="fas fa-plus"></i> 添加
  </button>
</div>
```
- 标签样式：浅灰色背景，圆角矩形
- 添加按钮：绿色文字，带加号图标

### 3.3 分类管理 (CategoryManager)

#### 3.3.1 页面结构
- **顶部标题**：分类管理标题
- **分类列表区域**：显示所有分类及笔记数量
- **操作区域**：新建按钮和分类操作功能组

#### 3.3.2 关键组件

**分类项设计**：
```html
<div class="p-4 border-b flex justify-between items-center">
  <div class="flex items-center">
    <span class="category-badge bg-blue-200"></span>
    <span>工作</span>
  </div>
  <span class="text-sm text-gray-500">12篇笔记</span>
</div>
```
- 左侧：分类颜色标识 + 分类名称
- 右侧：该分类下的笔记数量

**分类操作按钮组**：
```html
<div class="grid grid-cols-2 gap-3">
  <button class="bg-white rounded-lg shadow p-3 flex flex-col items-center">
    <i class="fas fa-exchange-alt text-green-500 text-xl mb-2"></i>
    <span class="text-sm">导入/导出</span>
  </button>
  <!-- 其他操作按钮 -->
</div>
```
- 两列网格布局
- 圆形图标 + 文字说明
- 白色卡片背景，阴影效果

### 3.4 搜索页面 (Search)

#### 3.4.1 页面结构
- **顶部搜索框**：全局搜索输入框
- **搜索历史区域**：显示最近搜索关键词
- **高级筛选区域**：分类、时间、标签筛选器

#### 3.4.2 关键组件

**搜索框设计**：
```html
<div class="relative">
  <input type="text" placeholder="搜索笔记..." class="w-full bg-white rounded-full py-3 px-5 shadow-sm pl-12">
  <i class="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
</div>
```
- 圆角矩形设计
- 左侧搜索图标
- 白色背景，阴影效果

**搜索历史标签**：
```html
<div class="flex flex-wrap gap-2">
  <span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">会议记录</span>
  <!-- 其他历史标签 -->
</div>
```
- 圆角全矩形设计
- 浅灰色背景

### 3.5 设置页面 (Settings)

#### 3.5.1 页面结构
- **顶部标题**：设置中心标题
- **设置项分组**：账号设置、界面设置、数据管理等
- **退出登录按钮**：页面底部

#### 3.5.2 关键组件

**设置项设计**：
```html
<div class="p-4 border-b">
  <div class="flex justify-between items-center">
    <div>
      <h3 class="font-medium">账号设置</h3>
      <p class="text-sm text-gray-500">user@example.com</p>
    </div>
    <i class="fas fa-chevron-right text-gray-400"></i>
  </div>
</div>
```
- 左侧：设置项名称和当前值
- 右侧：向右箭头图标，表示可点击进入
- 分组之间有边框分隔

**退出登录按钮**：
```html
<button class="w-full bg-red-100 text-red-500 py-3 rounded-lg mt-6 font-medium">
  退出登录
</button>
```
- 红色主题，警示作用
- 全宽按钮，位于页面底部

### 3.6 登录/注册页面 (Login/Register)

#### 3.6.1 页面结构
- **居中布局**：表单区域垂直水平居中
- **标题区域**：应用名称或操作类型
- **表单区域**：输入框、按钮、链接等
- **辅助区域**：第三方登录、切换操作类型

#### 3.6.2 关键组件

**登录表单设计**：
- 输入框：边框、圆角、聚焦效果
- 按钮：绿色背景，全宽设计
- 链接：绿色文字，下划线效果

**第三方登录按钮组**：
```html
<div class="flex justify-center space-x-4">
  <button class="p-2 rounded-full border border-gray-200 text-blue-500">
    <i class="fab fa-weixin text-xl"></i>
  </button>
  <!-- 其他第三方登录 -->
</div>
```
- 圆形按钮设计
- 带边框效果
- 彩色图标区分不同平台

### 3.7 云端同步页面 (CloudSync)

#### 3.7.1 页面结构
- **顶部标题**：云端同步标题
- **存储空间区域**：显示使用情况和进度条
- **同步设置区域**：自动同步开关、频率设置等
- **操作按钮**：立即同步按钮
- **同步历史区域**：显示同步记录

#### 3.7.2 关键组件

**存储空间进度条**：
```html
<div class="h-2 bg-gray-200 rounded-full mb-2">
  <div class="h-2 bg-green-500 rounded-full" style="width: 75%"></div>
</div>
```
- 灰色背景
- 绿色填充条，根据使用比例设置宽度
- 圆角设计

**开关按钮**：
```html
<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" value="" class="sr-only peer" checked>
  <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
</label>
```
- 自定义样式开关
- 激活状态为绿色
- 带聚焦效果

## 4. 交互设计

### 4.1 页面切换交互

- **底部导航切换**：点击导航项切换页面，同时更新URL hash
- **页面过渡效果**：页面切换时无明显动画，以确保性能
- **返回操作**：通过左上角返回按钮或浏览器返回功能

### 4.2 组件交互效果

#### 4.2.1 按钮交互
- **悬停效果**：背景色变深，提供视觉反馈
- **点击效果**：轻微缩放或颜色变化，确认点击成功

#### 4.2.2 输入框交互
- **聚焦效果**：边框高亮或阴影效果
- **输入反馈**：实时提示输入状态

#### 4.2.3 滚动交互
- **滚动加载**：列表内容可滚动加载更多
- **粘性定位**：编辑器工具栏在滚动时固定在顶部

## 5. 响应式设计

### 5.1 适配策略

- **移动端优先**：主要针对手机设备设计
- **自适应布局**：根据屏幕宽度调整元素大小和布局
- **最小宽度支持**：320px

### 5.2 关键断点

- **小屏手机**：320px - 375px
- **中屏手机**：376px - 425px
- **大屏手机/平板**：426px - 768px

## 6. 无障碍设计

### 6.1 颜色对比度
- 文本与背景对比度符合WCAG标准
- 关键操作按钮有足够的视觉区分度

### 6.2 键盘导航
- 支持键盘Tab导航
- 按钮和可交互元素有焦点状态

### 6.3 语义化标记
- 使用语义化HTML标签
- 提供适当的ARIA属性

## 7. 图标使用规范

### 7.1 图标库
- 使用Font Awesome 6.4.0图标库
- 统一图标风格和大小

### 7.2 图标类别
- **导航图标**：text-xl
- **功能图标**：text-lg至text-xl
- **辅助图标**：text-sm

## 8. 设计资源

- **颜色变量**：在Tailwind配置中定义主题颜色
- **字体文件**：使用系统默认字体
- **图标资源**：通过CDN引入Font Awesome

## 9. 设计规范检查清单

- [x] 颜色方案一致性
- [x] 字体层级清晰
- [x] 组件样式统一
- [x] 交互反馈明确
- [x] 响应式适配
- [x] 无障碍支持
- [x] 性能优化考虑