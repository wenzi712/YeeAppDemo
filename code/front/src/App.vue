<template>
  <div class="app-container">
    <!-- 登录前的页面 -->
    <template v-if="!isAuthenticated">
      <router-view />
    </template>
    
    <!-- 登录后的页面 -->
    <template v-else>
      <!-- 侧边栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo-container">
            <svg class="logo" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <h1 class="logo-text" v-if="!isSidebarCollapsed">Yee Note </h1>
          </div>
          <button class="toggle-btn" @click="toggleSidebar">
            <i class="fa" :class="isSidebarCollapsed ? 'fa-angle-right' : 'fa-angle-left'"></i>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item" active-class="active">
            <i class="fa fa-list-alt nav-icon"></i>
            <span class="nav-text" v-if="!isSidebarCollapsed">所有笔记</span>
          </router-link>
          <router-link to="/categories" class="nav-item" active-class="active">
            <i class="fa fa-folder nav-icon"></i>
            <span class="nav-text" v-if="!isSidebarCollapsed">分类管理</span>
          </router-link>
        </nav>
        
        <div class="sidebar-footer" v-if="!isSidebarCollapsed">
          <div class="user-info">
            <img :src="userAvatar" alt="用户头像" class="user-avatar" />
            <div class="user-details">
              <div class="user-name">{{ userName }}</div>
              <div class="user-email">{{ userEmail }}</div>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <i class="fa fa-sign-out"></i> 退出登录
          </button>
        </div>
      </aside>
      
      <!-- 主内容区 -->
      <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <header class="main-header">
          <div class="header-left">
            <button class="mobile-menu-btn" @click="toggleSidebar" v-if="isMobile">
              <i class="fa fa-bars"></i>
            </button>
            <h2 class="page-title">{{ currentPageTitle }}</h2>
          </div>
          <div class="header-right">
            <button class="create-note-btn" @click="handleCreateNote">
              <i class="fa fa-plus"></i> 新建笔记
            </button>
          </div>
        </header>
        
        <div class="content-wrapper">
          <router-view />
        </div>
      </main>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'
import { useNoteStore } from './stores/note'
import { toast } from 'vue3-toastify'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const noteStore = useNoteStore()
    
    const isSidebarCollapsed = ref(false)
    const isMobile = ref(false)
    
    // 计算属性
    const isAuthenticated = computed(() => userStore.isAuthenticated)
    const userName = computed(() => userStore.user?.username || '')
    const userEmail = computed(() => userStore.user?.email || '')
    const userAvatar = computed(() => userStore.user?.avatar || '/default-avatar.png')
    
    const currentPageTitle = computed(() => {
      const titles = {
        '/notes': '所有笔记',
        '/notes/create': '新建笔记',
        '/notes/:id': '编辑笔记',
        '/categories': '分类管理',
        '/search': '搜索笔记',
        '/sync': '云端同步',
        '/settings': '设置'
      }
      return titles[route.path] || titles[Object.keys(titles).find(key => {
        const regex = new RegExp(`^${key.replace(/:[^/]+/g, '[^/]+')}$`)
        return regex.test(route.path)
      })] || 'Yee Note '
    })
    
    // 方法
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value.toString())
    }
    
    const handleLogout = async () => {
      try {
        await userStore.logout()
        router.push('/login')
        toast.success('已成功退出登录')
      } catch (error) {
        toast.error('退出登录失败，请稍后重试')
      }
    }
    
    const handleCreateNote = () => {
      router.push('/edit')
    }
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 768
      if (isMobile.value) {
        isSidebarCollapsed.value = true
      }
    }
    
    // 生命周期
    onMounted(() => {
      // 恢复侧边栏状态
      const savedCollapsed = localStorage.getItem('sidebarCollapsed')
      if (savedCollapsed !== null) {
        isSidebarCollapsed.value = savedCollapsed === 'true'
      }
      
      // 监听窗口大小变化
      window.addEventListener('resize', checkMobile)
      checkMobile()
      
      // 恢复登录状态
      userStore.checkAuth()
      
      // 如果已登录，加载用户数据
      if (userStore.isAuthenticated) {
        userStore.fetchUserData()
        noteStore.fetchNotes()
      }
    })
    
    // 路由守卫
    watch(
      () => route.path,
      (newPath) => {
        const authRoutes = ['/login', '/register']
        const requiresAuth = !authRoutes.includes(newPath) && !newPath.startsWith('/auth')
        
        if (requiresAuth && !userStore.isAuthenticated) {
          router.push('/login')
        } else if (authRoutes.includes(newPath) && userStore.isAuthenticated) {
          router.push('/notes')
        }
      },
      { immediate: true }
    )
    
    return {
      isAuthenticated,
      isSidebarCollapsed,
      isMobile,
      userName,
      userEmail,
      userAvatar,
      currentPageTitle,
      toggleSidebar,
      handleLogout,
      handleCreateNote
    }
  }
}
</script>

<style lang="scss">
// 全局样式导入
@import './styles/variables.scss';
@import './styles/mixins.scss';

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-color;
  color: $text-color;
  font-family: $font-family;
}

// 登录前页面样式
#app {
  .app-container {
    & > .router-view {
      padding: 20px;
    }
  }
}

// 登录后布局样式
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: $sidebar-width;
  background-color: $sidebar-bg;
  box-shadow: $sidebar-shadow;
  transition: all $transition-speed ease;
  overflow-y: auto;
  z-index: 100;
  
  &.sidebar-collapsed {
    width: $sidebar-width-collapsed;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md;
    border-bottom: 1px solid $border-color;
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      
      .logo {
        width: 32px;
        height: 32px;
        color: $primary-color;
      }
      
      .logo-text {
        font-size: $font-size-lg;
        font-weight: 600;
        color: $sidebar-text;
        margin: 0;
      }
    }
    
    .toggle-btn {
      background: none;
      border: none;
      color: $sidebar-text;
      cursor: pointer;
      padding: $spacing-xs;
      border-radius: $border-radius;
      transition: background-color $transition-speed;
      
      &:hover {
          background-color: $sidebar-hover;
        }
    }
  }
  
  .sidebar-nav {
    padding: $spacing-md 0;
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: $spacing-md;
      color: $sidebar-text;
      text-decoration: none;
      transition: all $transition-speed;
      
      &:hover {
          background-color: $sidebar-hover;
          color: $primary-color;
        }
      
      &.active {
        background-color: $primary-light;
        color: $primary-color;
      }
      
      .nav-icon {
        width: 20px;
        text-align: center;
        margin-right: $spacing-sm;
      }
      
      .nav-text {
        font-size: $font-size-base;
      }
    }
  }
  
  .sidebar-footer {
    padding: $spacing-md;
    border-top: 1px solid $border-color;
    margin-top: auto;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-md;
      
      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .user-details {
        .user-name {
          font-weight: 500;
          color: $sidebar-text;
        }
        
        .user-email {
          font-size: $font-size-sm;
          color: $sidebar-text-secondary;
        }
      }
    }
    
    .logout-btn {
      width: 100%;
      padding: $spacing-sm;
      background-color: transparent;
      border: 1px solid $danger-color;
      color: $danger-color;
      border-radius: $border-radius;
      cursor: pointer;
      transition: all $transition-speed;
      
      &:hover {
        background-color: $danger-color;
        color: white;
      }
    }
  }
}

.main-content {
  flex: 1;
  margin-left: $sidebar-width;
  transition: margin-left $transition-speed ease;
  
  &.sidebar-collapsed {
    margin-left: $sidebar-width-collapsed;
  }
  
  .main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md;
    background-color: white;
    box-shadow: $header-shadow;
    position: sticky;
    top: 0;
    z-index: 50;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      
      .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        color: $text-color;
        cursor: pointer;
        padding: $spacing-sm;
        
        @media (max-width: 768px) {
          display: block;
        }
      }
      
      .page-title {
        margin: 0;
        font-size: $font-size-xl;
        font-weight: 600;
        color: $text-color;
      }
    }
    
    .header-right {
      .create-note-btn {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        padding: $spacing-sm $spacing-md;
        background-color: $primary-color;
        color: white;
        border: none;
        border-radius: $border-radius;
        cursor: pointer;
        transition: background-color $transition-speed;
        
        &:hover {
          background-color: $primary-dark;
        }
      }
    }
  }
  
  .content-wrapper {
    padding: $spacing-lg;
    
    @media (max-width: 768px) {
      padding: $spacing-md;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &.sidebar-collapsed {
      transform: translateX(0);
    }
  }
  
  .main-content {
    margin-left: 0;
  }
}
</style>