<template>
  <div class="register-container">
    <div class="register-content">
      <!-- 注册表单卡片 -->
      <div class="register-card">
        <!-- Yee Note  Logo -->
        <div class="register-logo">
          <h1 class="register-title">创建账号</h1>
          <p class="register-subtitle">加入Yee Note ，开始您的笔记之旅</p>
        </div>
        
        <!-- 表单 -->
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 用户名输入 -->
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <div class="input-wrapper">
              <component :is="UserIcon" class="input-icon" />
              <input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="请设置用户名"
                class="form-input"
                :class="{ 'is-invalid': errors.username }"
                required
                autocomplete="username"
              />
            </div>
            <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
          </div>
          
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
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper">
              <component :is="LockIcon" class="input-icon" />
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请设置密码（至少6位）"
                class="form-input"
                :class="{ 'is-invalid': errors.password }"
                required
                autocomplete="new-password"
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
            
            <!-- 密码强度指示器 -->
            <div v-if="form.password" class="password-strength">
              <div class="strength-labels">
                <span class="strength-label weak">弱</span>
                <span class="strength-label medium">中</span>
                <span class="strength-label strong">强</span>
              </div>
              <div class="strength-bar">
                <div 
                  class="strength-indicator"
                  :class="getPasswordStrengthClass()"
                  :style="{ width: getPasswordStrengthWidth() + '%' }"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- 确认密码 -->
          <div class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <div class="input-wrapper">
              <component :is="LockIcon" class="input-icon" />
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                class="form-input"
                :class="{ 'is-invalid': errors.confirmPassword }"
                required
                autocomplete="new-password"
              />
            </div>
            <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
          </div>
          
          <!-- 用户协议 -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="form.agreeTerms"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="checkbox-text">
                我已阅读并同意
                <router-link to="/terms" class="link-primary">服务条款</router-link>
                和
                <router-link to="/privacy" class="link-primary">隐私政策</router-link>
              </span>
            </label>
          </div>
          <div v-if="errors.agreeTerms" class="error-message terms-error">{{ errors.agreeTerms }}</div>
          
          <!-- 注册按钮 -->
          <button
            type="submit"
            class="register-button"
            :disabled="loading || !form.agreeTerms"
          >
            <component v-if="loading" :is="Loader2Icon" class="button-icon" />
            <span>立即注册</span>
          </button>
          
          <!-- 全局错误信息 -->
          <div v-if="errors.global" class="global-error">
            <component :is="AlertCircleIcon" class="error-icon" />
            {{ errors.global }}
          </div>
        </form>
        
        <!-- 登录链接 -->
        <div class="login-link">
          <span>已有账号？</span>
          <router-link to="/login" class="link-primary">立即登录</router-link>
        </div>
      </div>
      
      <!-- 页脚 -->
      <div class="register-footer">
        <p>&copy; 2024 Yee Note  - 保护您的隐私，记录美好生活</p>
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
import { 
  User, 
  Mail, 
  Lock,
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle 
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: '',
  global: ''
})

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 验证用户名
const validateUsername = (username) => {
  if (!username.trim()) {
    return '请输入用户名'
  }
  if (username.length < 3 || username.length > 20) {
    return '用户名长度应在3-20个字符之间'
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return '用户名只能包含字母、数字、下划线或中文'
  }
  return ''
}

// 验证邮箱
const validateEmail = (email) => {
  if (!email.trim()) {
    return '请输入邮箱'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '请输入有效的邮箱地址'
  }
  return ''
}

// 验证密码
const validatePassword = (password) => {
  if (!password) {
    return '请设置密码'
  }
  if (password.length < 6) {
    return '密码长度至少6位'
  }
  return ''
}

// 验证确认密码
const validateConfirmPassword = (confirmPassword) => {
  if (!confirmPassword) {
    return '请确认密码'
  }
  if (confirmPassword !== form.password) {
    return '两次输入的密码不一致'
  }
  return ''
}

// 验证表单
const validateForm = () => {
  let isValid = true
  
  // 重置错误
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.agreeTerms = ''
  errors.global = ''
  
  // 验证用户名
  const usernameError = validateUsername(form.username)
  if (usernameError) {
    errors.username = usernameError
    isValid = false
  }
  
  // 验证邮箱
  const emailError = validateEmail(form.email)
  if (emailError) {
    errors.email = emailError
    isValid = false
  }
  
  // 验证密码
  const passwordError = validatePassword(form.password)
  if (passwordError) {
    errors.password = passwordError
    isValid = false
  }
  
  // 验证确认密码
  const confirmPasswordError = validateConfirmPassword(form.confirmPassword)
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError
    isValid = false
  }
  
  // 验证用户协议
  if (!form.agreeTerms) {
    errors.agreeTerms = '请阅读并同意服务条款和隐私政策'
    isValid = false
  }
  
  return isValid
}

// 计算密码强度
const calculatePasswordStrength = () => {
  if (!form.password) return 0
  
  let strength = 0
  const length = form.password.length
  
  // 长度检查
  if (length >= 8) strength += 1
  
  // 包含小写字母
  if (/[a-z]/.test(form.password)) strength += 1
  
  // 包含大写字母
  if (/[A-Z]/.test(form.password)) strength += 1
  
  // 包含数字
  if (/[0-9]/.test(form.password)) strength += 1
  
  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(form.password)) strength += 1
  
  return strength
}

// 获取密码强度类
const getPasswordStrengthClass = () => {
  const strength = calculatePasswordStrength()
  
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

// 获取密码强度宽度
const getPasswordStrengthWidth = () => {
  const strength = calculatePasswordStrength()
  return (strength / 5) * 100
}

// 处理注册
const handleRegister = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.global = ''
  
  try {
    // 调用注册接口
    const result = await userStore.register({
      username: form.username,
      email: form.email,
      password: form.password
    })
    
    // 注册成功后的处理
    if (result && result.success) {
      // 显示成功消息
      if (userStore.toast) {
        userStore.toast.success('注册成功！正在为您登录...')
      }
      
      // 延迟后跳转到首页
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  } catch (error) {
    console.error('Register error:', error)
    
    // 处理错误
    if (error.response) {
      // 后端返回的错误
      const errorData = error.response.data
      
      if (errorData.message) {
        errors.global = errorData.message
      } else if (errorData.errors) {
        // 字段错误
        if (errorData.errors.username) {
          errors.username = errorData.errors.username[0]
        }
        if (errorData.errors.email) {
          errors.email = errorData.errors.email[0]
        }
        if (errorData.errors.password) {
          errors.password = errorData.errors.password[0]
        }
      } else {
        errors.global = '注册失败，请稍后重试'
      }
    } else if (error.request) {
      errors.global = '网络错误，请检查网络连接'
    } else {
      errors.global = '注册失败，请稍后重试'
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
  
  // 聚焦到第一个输入框
  setTimeout(() => {
    const usernameInput = document.getElementById('username')
    if (usernameInput) {
      usernameInput.focus()
    }
  }, 100)
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba($primary-color, 0.05), rgba($secondary-color, 0.05));
  padding: $spacing-xl;
  position: relative;
}

.register-content {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.register-card {
  background-color: $white;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-lg;
  padding: $spacing-2xl;
  transition: all $transition-speed ease;
  position: relative;
  overflow: hidden;
}

.register-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
}

.register-logo {
  text-align: center;
  margin-bottom: $spacing-2xl;
}

.register-title {
  font-size: 2.2rem;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin-bottom: $spacing-sm;
  background: linear-gradient(90deg, $primary-color, $secondary-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-normal;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.form-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-color;
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
  @include input-base;
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
  align-items: flex-start;
  justify-content: flex-start;
  margin-top: $spacing-sm;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  user-select: none;
  gap: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-color;
  line-height: 1.5;
}

.form-checkbox {
  margin-top: 2px;
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
  flex: 1;
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

.register-button {
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

.terms-error {
  margin-top: -$spacing-md;
  margin-bottom: $spacing-md;
}

.login-link {
  text-align: center;
  margin-top: $spacing-xl;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.register-footer {
  text-align: center;
  padding: $spacing-md 0;
}

.register-footer p {
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

// 密码强度指示器
.password-strength {
  margin-top: $spacing-sm;
}

.strength-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-xs;
}

.strength-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  opacity: 0.5;
  transition: opacity $transition-speed ease;
}

.strength-labels:has(.strength-indicator.weak) .weak,
.strength-labels:has(.strength-indicator.medium) .medium,
.strength-labels:has(.strength-indicator.strong) .strong {
  opacity: 1;
  color: $primary-color;
}

.strength-bar {
  height: 4px;
  background-color: $gray-200;
  border-radius: $border-radius-full;
  overflow: hidden;
}

.strength-indicator {
  height: 100%;
  transition: all $transition-speed ease;
  border-radius: $border-radius-full;
  
  &.weak {
    background-color: $danger-color;
    width: 20%;
  }
  
  &.medium {
    background-color: $warning-color;
    width: 60%;
  }
  
  &.strong {
    background-color: $success-color;
    width: 100%;
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
  .register-container {
    padding: $spacing-lg;
  }
  
  .register-card {
    padding: $spacing-xl;
  }
  
  .register-title {
    font-size: 1.8rem;
  }
  
  .form-input {
    padding: $spacing-sm $spacing-sm $spacing-sm $spacing-2xl;
  }
  
  .footer-links {
    flex-direction: column;
    gap: $spacing-xs;
  }
  
  .checkbox-text {
    font-size: $font-size-xs;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .register-container {
    background: linear-gradient(135deg, rgba($primary-color, 0.1), rgba($secondary-color, 0.1));
  }
  
  .register-card {
    background-color: $gray-900;
    border: 1px solid $gray-800;
  }
  
  .form-input {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $white;
  }
  
  .register-title {
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
  
  .strength-bar {
    background-color: $gray-700;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .register-card {
    border: 2px solid currentColor;
  }
  
  .form-input {
    border: 2px solid currentColor;
  }
  
  .register-button {
    border: 2px solid transparent;
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .register-button {
    transition: none;
  }
  
  .register-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>