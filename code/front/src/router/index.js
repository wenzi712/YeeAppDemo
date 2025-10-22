import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 路由懒加载
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Home = () => import('../views/Home.vue')
const NoteDetail = () => import('../views/NoteDetail.vue')
const NoteEdit = () => import('../views/NoteEdit.vue')
const Category = () => import('../views/Category.vue')

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: {
        requiresAuth: true,
        title: 'Yee Note  - 我的笔记'
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        requiresAuth: false,
        title: 'Yee Note  - 登录',
        hideNavigation: true
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: {
        requiresAuth: false,
        title: 'Yee Note  - 注册',
        hideNavigation: true
      }
    },
    {
      path: '/note/:id',
      name: 'NoteDetail',
      component: NoteDetail,
      meta: {
        requiresAuth: true,
        title: 'Yee Note  - 笔记详情'
      },
      props: true
    },
    {
      path: '/edit/:id?',
      name: 'NoteEdit',
      component: NoteEdit,
      meta: {
        requiresAuth: true,
        title: 'Yee Note  - 编辑笔记'
      },
      props: true
    },
    {
        path: '/categories',
        name: 'Category',
        component: Category,
        meta: {
          requiresAuth: true,
          title: 'Yee Note  - 分类管理'
        }
      },
      // 404页面
      {
        path: '/:pathMatch(.*)*',
        redirect: '/'
      }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查用户是否已登录
  if (!userStore.isInitialized) {
    try {
      // 尝试恢复用户会话
      await userStore.checkAuth()
    } catch (error) {
      console.error('Failed to check auth status:', error)
      // 如果检查失败，确保用户状态为未登录
      userStore.logout()
    }
  }
  
  // 路由守卫逻辑
  if (to.meta.requiresAuth) {
    // 需要认证的页面
    if (userStore.isAuthenticated) {
      // 已登录，继续访问
      next()
    } else {
      // 未登录，重定向到登录页
      next({
        name: 'Login',
        query: { redirect: to.fullPath } // 记录重定向路径
      })
    }
  } else {
    // 不需要认证的页面
    if (userStore.isAuthenticated && ['Login', 'Register'].includes(to.name)) {
      // 已登录用户访问登录/注册页，重定向到首页
      next({ name: 'Home' })
    } else {
      // 继续访问
      next()
    }
  }
})

// 全局后置守卫
router.afterEach((to, from) => {
  // 这里可以添加页面访问统计、日志记录等功能
  console.log(`Navigated from ${from.fullPath} to ${to.fullPath}`)
})

export default router