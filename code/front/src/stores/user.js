import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue3-toastify'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    redirectPath: '/notes'
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userInitials: (state) => {
      if (!state.user) return '?'
      return state.user.username?.charAt(0)?.toUpperCase() || '?'
    },
    userFullName: (state) => {
      return state.user?.username || '未登录用户'
    }
  },
  
  actions: {
    // 设置重定向路径
    setRedirectPath(path) {
      this.redirectPath = path
    },
    
    // 保存token到localStorage和状态
    saveToken(token) {
      this.token = token
      localStorage.setItem('token', token)
      // 设置axios默认Authorization头
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    
    // 清除token
    clearToken() {
      this.token = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    },
    
    // 检查认证状态
    checkAuth() {
      if (this.token) {
        // 设置axios默认Authorization头
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        // 可以在这里验证token是否有效
        this.fetchUserData()
      }
    },
    
    // 用户注册
    async register(registerData) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/users/register', registerData)
        const { token, user } = response.data
        
        this.saveToken(token)
        this.user = user
        toast.success('注册成功！')
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || '注册失败，请稍后重试'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 用户登录
    async login(loginData) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/users/login', loginData)
        const { token, user } = response.data
        
        this.saveToken(token)
        this.user = user
        toast.success('登录成功！')
        
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || '登录失败，请检查用户名和密码'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取用户数据
    async fetchUserData() {
      if (!this.token) return
      
      this.isLoading = true
      
      try {
        const response = await axios.get('/api/users/profile')
        this.user = response.data
        return response.data
      } catch (error) {
        console.error('获取用户数据失败:', error)
        // 如果token无效，清除token
        if (error.response?.status === 401) {
          this.logout()
        }
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新用户信息
    async updateUser(userData) {
      this.isLoading = true
      
      try {
        const response = await axios.put('/api/users/profile', userData)
        this.user = response.data
        toast.success('用户信息已更新')
        return { success: true }
      } catch (error) {
        const errorMessage = error.response?.data?.message || '更新失败，请稍后重试'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },
    
    // 上传头像
    async uploadAvatar(formData) {
      this.isLoading = true
      
      try {
        const response = await axios.post('/api/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.user.avatar = response.data.avatar
        toast.success('头像上传成功')
        return { success: true, avatar: response.data.avatar }
      } catch (error) {
        const errorMessage = error.response?.data?.message || '头像上传失败，请稍后重试'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新同步设置
    async updateSyncSettings(settings) {
      try {
        await axios.put('/api/users/sync-settings', settings)
        if (this.user) {
          this.user.syncSettings = { ...this.user.syncSettings, ...settings }
        }
        toast.success('同步设置已更新')
        return { success: true }
      } catch (error) {
        const errorMessage = error.response?.data?.message || '设置更新失败，请稍后重试'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    
    // 用户退出登录
    async logout() {
      try {
        // 可以调用后端登出接口，如果需要的话
        // await axios.post('/api/users/logout')
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        // 无论如何都清除本地状态
        this.clearToken()
        this.user = null
        this.error = null
        this.redirectPath = '/notes'
      }
    }
  }
})