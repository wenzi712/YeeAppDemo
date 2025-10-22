<template>
  <div class="login-container">
    <div class="login-content">
      <!-- 登录表单卡片 -->
      <div class="login-card">
        <!-- Yee Note  Logo -->
        <div class="login-logo">
          <h1 class="login-title">Yee Note </h1>
          <p class="login-subtitle">简单、优雅的笔记管理工具</p>
        </div>
        
        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 邮箱输入 -->
          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <div class="input-wrapper">
              <component :is="MailIcon" class="input-icon" />
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱"
                class="form-input"
                :class="{ 'is-invalid': errors.email }"
                required
                autocomplete="email"
              />
            </div>
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>
          
          <!-- 密码输入 -->
          <div class="form-group">
            <div class="label-wrapper">
              <label for="password" class="form-label">密码</label>
              <router-link to="/forgot-password" class="forgot-password">忘记密码？</router-link>
            </div>
            <div class="input-wrapper">
              <component :is="LockIcon" class="input-icon" />
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="form-input"
                :class="{ 'is-invalid': errors.password }"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="password-toggle"
                aria-label="切换密码可见性"
              >
                <component :is="showPassword ? EyeOffIcon : EyeIcon" />
              </button>
            </div>
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>
          
          <!-- 记住我 -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="form.remember"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="checkbox-text">记住我</span>
            </label>
          </div>
          
          <!-- 登录按钮 -->
          <button
            type="submit"
            class="login-button"
            :disabled="loading"
          >
            <component v-if="loading" :is="Loader2Icon" class="button-icon" />
            <span>登录</span>
          </button>
          
          <!-- 全局错误信息 -->
          <div v-if="errors.global" class="global-error">
            <component :is="AlertCircleIcon" class="error-icon" />
            {{ errors.global }}
          </div>
        </form>
        
        <!-- 注册链接 -->
        <div class="register-link">
          <span>还没有账号？</span>
          <router-link to="/register" class="link-primary">立即注册</router-link>
        </div>
      </div>
      
      <!-- 页脚 -->
      <div class="login-footer">
        <p>&copy; 2025 Yee Note  - 保护您的隐私，记录美好生活</p>
        <div class="footer-links">
          <router-link to="/terms" class="footer-link">服务条款</router-link>
          <router-link to="/privacy" class="footer-link">隐私政策</router-link>
          <router-link to="/help" class="footer-link">帮助中心</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const form = reactive({
  email: '',
  password: '',
  remember: false
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const errors = reactive({
  email: '',
  password: '',
  global: ''
})

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 验证表单
const validateForm = () => {
  let isValid = true
  
  // 重置错误
  errors.email = ''
  errors.password = ''
  errors.global = ''
  
  // 验证邮箱
  if (!form.email.trim()) {
    errors.email = '请输入邮箱'
    isValid = false
  } else if (!isValidEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  // 验证密码
  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少6位'
    isValid = false
  }
  
  return isValid
}

// 邮箱验证
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 处理登录
const handleLogin = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.global = ''
  
  try {
    // 调用登录接口
    const result = await userStore.login({
      email: form.email,
      password: form.password,
      remember: form.remember
    })
    
    // 登录成功后的处理
    if (result && result.success) {
      // 显示成功消息
      if (userStore.toast) {
        userStore.toast.success('登录成功，欢迎回来！')
      }
      
      // 跳转回之前的页面或默认页面
      const redirectPath = userStore.redirectPath || '/'
      router.push(redirectPath)
    }
  } catch (error) {
    console.error('Login error:', error)
    
    // 处理错误
    if (error.response) {
      // 后端返回的错误
      const errorData = error.response.data
      
      if (errorData.message) {
        errors.global = errorData.message
      } else if (errorData.errors) {
        // 字段错误
        if (errorData.errors.email) {
          errors.email = errorData.errors.email[0]
        }
        if (errorData.errors.password) {
          errors.password = errorData.errors.password[0]
        }
      } else {
        errors.global = '登录失败，请稍后重试'
      }
    } else if (error.request) {
      errors.global = '网络错误，请检查网络连接'
    } else {
      errors.global = '登录失败，请稍后重试'
    }
    
    // 显示错误通知
    if (userStore.toast && errors.global) {
      userStore.toast.error(errors.global)
    }
  } finally {
    loading.value = false
  }
}

// 页面加载时检查登录状态
onMounted(() => {
  // 如果已经登录，跳转到首页
  if (userStore.isAuthenticated) {
    router.push('/')
  }
  
  // 尝试从本地存储恢复邮箱
  const savedEmail = localStorage.getItem('saved_email')
  if (savedEmail) {
    form.email = savedEmail
  }
  
  // 聚焦到第一个输入框
  setTimeout(() => {
    const emailInput = document.getElementById('email')
    if (emailInput) {
      emailInput.focus()
    }
  }, 100)
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba($primary-color, 0.05), rgba($secondary-color, 0.05));
  padding: $spacing-xl;
  position: relative;
}

.login-content {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.login-card {
  background-color: $white;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-lg;
  padding: $spacing-2xl;
  transition: all $transition-speed ease;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
}

.login-logo {
  text-align: center;
  margin-bottom: $spacing-2xl;
}

.login-title {
  font-size: 2.5rem;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-normal;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.label-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-color;
}

.forgot-password {
  font-size: $font-size-sm;
  color: $primary-color;
  text-decoration: none;
  transition: color $transition-speed ease;
  
  &:hover {
    color: $primary-dark;
    text-decoration: underline;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: $spacing-md;
  color: $text-secondary;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: $spacing-md $spacing-md $spacing-md $spacing-xl;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  font-size: $font-size-base;
  transition: all $transition-speed ease;
  background-color: $white;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &:is(:hover, :focus):not(:disabled) {
    border-color: $primary-color;
  }
  
  &.is-invalid {
    border-color: $danger-color;
    box-shadow: 0 0 0 3px rgba($danger-color, 0.1);
  }
  
  &::placeholder {
    color: $text-secondary;
  }
}

.password-toggle {
  position: absolute;
  right: $spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  padding: $spacing-xs;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
  z-index: 1;
  
  &:hover {
    color: $text-color;
    background-color: $gray-100;
  }
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-color;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 1px solid $border-color;
  border-radius: $border-radius-sm;
  transition: all $transition-speed ease;
  
  &:checked {
    background-color: $primary-color;
    border-color: $primary-color;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
}

.checkbox-text {
  font-weight: $font-weight-normal;
}

.login-button {
  width: 100%;
  padding: $spacing-md;
  background-color: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-lg;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-speed ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  
  &:hover:not(:disabled) {
    background-color: $primary-dark;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.button-icon {
  animation: spin $transition-slow linear infinite;
}

.global-error {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: rgba($danger-color, 0.1);
  border: 1px solid rgba($danger-color, 0.2);
  border-radius: $border-radius-lg;
  color: $danger-color;
  font-size: $font-size-sm;
}

.error-icon {
  flex-shrink: 0;
}

.error-message {
  font-size: $font-size-xs;
  color: $danger-color;
  margin-top: -$spacing-xs;
}

.register-link {
  text-align: center;
  margin-top: $spacing-xl;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.link-primary {
  color: $primary-color;
  font-weight: $font-weight-medium;
  text-decoration: none;
  transition: color $transition-speed ease;
  
  &:hover {
    color: $primary-dark;
    text-decoration: underline;
  }
}

.login-footer {
  text-align: center;
  padding: $spacing-md 0;
}

.login-footer p {
  font-size: $font-size-xs;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: $spacing-md;
}

.footer-link {
  font-size: $font-size-xs;
  color: $text-secondary;
  text-decoration: none;
  transition: color $transition-speed ease;
  
  &:hover {
    color: $primary-color;
    text-decoration: underline;
  }
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: $breakpoint-sm) {
  .login-container {
    padding: $spacing-lg;
  }
  
  .login-card {
    padding: $spacing-xl;
  }
  
  .login-title {
    font-size: 2rem;
  }
  
  .form-input {
    padding: $spacing-sm $spacing-sm $spacing-sm $spacing-2xl;
  }
  
  .footer-links {
    flex-direction: column;
    gap: $spacing-xs;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, rgba($primary-color, 0.1), rgba($secondary-color, 0.1));
  }
  
  .login-card {
    background-color: $gray-900;
    border: 1px solid $gray-800;
  }
  
  .form-input {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $white;
  }
  
  .login-title {
    color: $white;
  }
  
  .form-label,
  .checkbox-text {
    color: $gray-200;
  }
  
  .global-error {
    background-color: rgba($danger-color, 0.15);
    border-color: rgba($danger-color, 0.3);
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .login-card {
    border: 2px solid currentColor;
  }
  
  .form-input {
    border: 2px solid currentColor;
  }
  
  .login-button {
    border: 2px solid transparent;
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .login-button {
    transition: none;
  }
  
  .login-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>