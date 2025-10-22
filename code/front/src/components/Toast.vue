<template>
  <Teleport to="body">
    <div 
      class="toast-container"
      :class="positionClasses"
      ref="container"
      role="alert"
      aria-live="polite"
    >
      <transition-group
        tag="div"
        name="toast"
        @enter="handleEnter"
        @leave="handleLeave"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[
            `toast-${toast.type}`,
            { 'toast-sticky': !toast.autoClose },
            { 'toast-close-on-click': toast.closeOnClick },
            { 'toast-pause-on-hover': toast.pauseOnHover },
            { 'toast-pause-on-focus-loss': toast.pauseOnFocusLoss },
            { 'toast-rtl': toast.rtl },
            { 'toast-expanded': toast.expanded },
            { 'toast-animate-in': true },
            toast.className
          ]"
          :style="{
            width: toast.width,
            minWidth: toast.minWidth,
            maxWidth: toast.maxWidth,
            fontSize: toast.fontSize,
            backgroundColor: toast.bgColor,
            color: toast.textColor,
            border: toast.border ? `1px solid ${toast.borderColor || toast.bgColor}` : 'none',
            borderRadius: toast.borderRadius,
            boxShadow: toast.shadow || $shadow-md
          }"
          :aria-label="toast.message"
          @click="handleClick(toast)"
          @mouseenter="handleMouseEnter(toast)"
          @mouseleave="handleMouseLeave(toast)"
          :id="`toast-${toast.id}`"
        >
          <!-- 图标区域 -->
          <div v-if="toast.icon || getIconByType(toast.type)" class="toast-icon">
            <component 
              :is="toast.icon || getIconByType(toast.type)" 
              :size="toast.iconSize || 18"
              :color="toast.iconColor || 'currentColor'"
              v-bind="iconProps"
            />
          </div>
          
          <!-- 内容区域 -->
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title" v-html="toast.title"></div>
            <div class="toast-message" v-html="toast.message"></div>
            
            <!-- 进度条 -->
            <div v-if="toast.showProgress && toast.autoClose" class="toast-progress">
              <div 
                class="toast-progress-bar"
                :style="{
                  width: `${toast.progress}%`,
                  backgroundColor: toast.progressColor || toast.typeColors[toast.type],
                  transition: toast.paused ? 'none' : `width ${remainingTime}ms linear`
                }"
              ></div>
            </div>
          </div>
          
          <!-- 关闭按钮 -->
          <button
            v-if="toast.showCloseButton"
            type="button"
            class="toast-close-button"
            @click.stop="removeToast(toast.id)"
            aria-label="Close notification"
            :title="toast.closeButtonLabel"
          >
            <component 
              :is="closeIcon" 
              :size="16" 
              v-bind="iconProps"
            />
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  // 位置配置
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-right', 'top-left', 'top-center',
      'bottom-right', 'bottom-left', 'bottom-center'
    ].includes(value)
  },
  
  // 默认自动关闭时间（毫秒）
  autoClose: {
    type: Number,
    default: 5000
  },
  
  // 是否显示关闭按钮
  showCloseButton: {
    type: Boolean,
    default: true
  },
  
  // 点击关闭
  closeOnClick: {
    type: Boolean,
    default: false
  },
  
  // 悬停暂停
  pauseOnHover: {
    type: Boolean,
    default: true
  },
  
  // 失焦暂停
  pauseOnFocusLoss: {
    type: Boolean,
    default: true
  },
  
  // 是否显示进度条
  showProgress: {
    type: Boolean,
    default: false
  },
  
  // 最大通知数量
  maxToasts: {
    type: Number,
    default: 5
  },
  
  // 是否启用 RTL
  rtl: {
    type: Boolean,
    default: false
  },
  
  // 新通知位置（'top' 或 'bottom'）
  newestOnTop: {
    type: Boolean,
    default: true
  },
  
  // 通知间距
  toastSpacing: {
    type: [Number, String],
    default: 16
  },
  
  // 容器边距
  containerMargin: {
    type: [Number, String],
    default: 24
  },
  
  // 默认图标
  defaultIcon: {
    type: [Object, String],
    default: null
  },
  
  // 关闭图标
  closeIcon: {
    type: [Object, String],
    default: 'X'
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // 类型颜色映射
  typeColors: {
    type: Object,
    default: () => ({
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      default: '#6B7280'
    })
  }
})

const emit = defineEmits(['add', 'remove', 'click', 'close', 'update:toasts'])

const toasts = ref([])
const container = ref(null)
const isVisible = ref(false)
const focusState = ref('focused')

// 计算属性
const positionClasses = computed(() => {
  return {
    [`toast-position-${props.position}`]: true,
    'toast-container-rtl': props.rtl
  }
})

// 获取类型对应的图标
const getIconByType = (type) => {
  const iconMap = {
    success: 'Check',
    error: 'X',
    warning: 'AlertTriangle',
    info: 'Info',
    default: null
  }
  return iconMap[type] || props.defaultIcon
}

// 生成唯一ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 添加通知
const addToast = (options) => {
  // 确保 options 是对象
  const toastOptions = typeof options === 'string' ? { message: options } : { ...options }
  
  // 创建通知对象
  const toast = {
    id: generateId(),
    type: toastOptions.type || 'default',
    message: toastOptions.message || 'Notification',
    title: toastOptions.title || '',
    autoClose: toastOptions.autoClose !== undefined ? toastOptions.autoClose : props.autoClose,
    showCloseButton: toastOptions.showCloseButton !== undefined ? toastOptions.showCloseButton : props.showCloseButton,
    closeOnClick: toastOptions.closeOnClick !== undefined ? toastOptions.closeOnClick : props.closeOnClick,
    pauseOnHover: toastOptions.pauseOnHover !== undefined ? toastOptions.pauseOnHover : props.pauseOnHover,
    pauseOnFocusLoss: toastOptions.pauseOnFocusLoss !== undefined ? toastOptions.pauseOnFocusLoss : props.pauseOnFocusLoss,
    showProgress: toastOptions.showProgress !== undefined ? toastOptions.showProgress : props.showProgress,
    rtl: toastOptions.rtl !== undefined ? toastOptions.rtl : props.rtl,
    icon: toastOptions.icon || getIconByType(toastOptions.type || 'default'),
    iconSize: toastOptions.iconSize,
    iconColor: toastOptions.iconColor,
    width: toastOptions.width,
    minWidth: toastOptions.minWidth,
    maxWidth: toastOptions.maxWidth,
    fontSize: toastOptions.fontSize,
    bgColor: toastOptions.bgColor,
    textColor: toastOptions.textColor,
    border: toastOptions.border || false,
    borderColor: toastOptions.borderColor,
    borderRadius: toastOptions.borderRadius,
    shadow: toastOptions.shadow,
    progressColor: toastOptions.progressColor,
    closeButtonLabel: toastOptions.closeButtonLabel || 'Close',
    className: toastOptions.className || '',
    onClick: toastOptions.onClick,
    onClose: toastOptions.onClose,
    onOpen: toastOptions.onOpen,
    onMouseEnter: toastOptions.onMouseEnter,
    onMouseLeave: toastOptions.onMouseLeave,
    paused: false,
    startPauseTime: 0,
    pauseDuration: 0,
    startTime: Date.now(),
    progress: 100,
    expanded: false
  }
  
  // 添加到列表
  if (props.newestOnTop) {
    toasts.value.unshift(toast)
  } else {
    toasts.value.push(toast)
  }
  
  // 限制最大数量
  if (toasts.value.length > props.maxToasts) {
    const removedToast = props.newestOnTop 
      ? toasts.value.pop() 
      : toasts.value.shift()
    removeToast(removedToast.id, true)
  }
  
  isVisible.value = true
  
  // 触发打开回调
  if (toast.onOpen) {
    toast.onOpen(toast)
  }
  
  emit('add', toast)
  emit('update:toasts', toasts.value)
  
  // 设置自动关闭
  if (toast.autoClose) {
    setupAutoClose(toast)
  }
  
  return toast.id
}

// 设置自动关闭
const setupAutoClose = (toast) => {
  const updateProgress = () => {
    if (!toast || !toasts.value.find(t => t.id === toast.id)) return
    
    if (!toast.paused) {
      const elapsed = Date.now() - toast.startTime - toast.pauseDuration
      toast.progress = Math.max(0, 100 - (elapsed / toast.autoClose) * 100)
      
      if (elapsed >= toast.autoClose) {
        removeToast(toast.id)
        return
      }
    }
    
    requestAnimationFrame(updateProgress)
  }
  
  updateProgress()
}

// 移除通知
const removeToast = (id, silent = false) => {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index === -1) return
  
  const toast = toasts.value[index]
  toasts.value.splice(index, 1)
  
  if (!silent && toast.onClose) {
    toast.onClose(toast)
  }
  
  emit('remove', toast)
  emit('update:toasts', toasts.value)
  
  // 检查是否还有通知
  if (toasts.value.length === 0) {
    isVisible.value = false
  }
}

// 清除所有通知
const clearToasts = () => {
  toasts.value.forEach(toast => {
    if (toast.onClose) {
      toast.onClose(toast)
    }
    emit('remove', toast)
  })
  
  toasts.value = []
  isVisible.value = false
  emit('update:toasts', toasts.value)
}

// 获取剩余时间
const remainingTime = computed(() => {
  const toast = toasts.value[0]
  if (!toast || !toast.autoClose) return 0
  
  const elapsed = Date.now() - toast.startTime - toast.pauseDuration
  return Math.max(0, toast.autoClose - elapsed)
})

// 处理点击
const handleClick = (toast) => {
  if (toast.onClick) {
    toast.onClick(toast)
  }
  
  if (toast.closeOnClick) {
    removeToast(toast.id)
  }
  
  emit('click', toast)
}

// 处理鼠标进入
const handleMouseEnter = (toast) => {
  if (toast.pauseOnHover && toast.autoClose) {
    toast.paused = true
    toast.startPauseTime = Date.now()
  }
  
  if (toast.onMouseEnter) {
    toast.onMouseEnter(toast)
  }
}

// 处理鼠标离开
const handleMouseLeave = (toast) => {
  if (toast.pauseOnHover && toast.autoClose && toast.paused) {
    toast.paused = false
    toast.pauseDuration += Date.now() - toast.startPauseTime
  }
  
  if (toast.onMouseLeave) {
    toast.onMouseLeave(toast)
  }
}

// 处理进入动画
const handleEnter = (el, done) => {
  nextTick(() => {
    el.style.opacity = 1
    el.style.transform = 'translateY(0)'
    done()
  })
}

// 处理离开动画
const handleLeave = (el, done) => {
  el.style.opacity = 0
  el.style.transform = 'translateY(-10px)'
  
  // 等待动画完成
  setTimeout(() => {
    done()
  }, 300)
}

// 监听焦点变化
const handleVisibilityChange = () => {
  focusState.value = document.hidden ? 'blurred' : 'focused'
  
  toasts.value.forEach(toast => {
    if (toast.pauseOnFocusLoss && toast.autoClose) {
      if (document.hidden) {
        // 失焦时暂停
        if (!toast.paused) {
          toast.paused = true
          toast.startPauseTime = Date.now()
        }
      } else {
        // 聚焦时恢复
        if (toast.paused) {
          toast.paused = false
          toast.pauseDuration += Date.now() - toast.startPauseTime
        }
      }
    }
  })
}

// 便捷方法
const success = (options) => {
  const toastOptions = typeof options === 'string' ? { message: options } : { ...options }
  return addToast({ ...toastOptions, type: 'success' })
}

const error = (options) => {
  const toastOptions = typeof options === 'string' ? { message: options } : { ...options }
  return addToast({ ...toastOptions, type: 'error' })
}

const warning = (options) => {
  const toastOptions = typeof options === 'string' ? { message: options } : { ...options }
  return addToast({ ...toastOptions, type: 'warning' })
}

const info = (options) => {
  const toastOptions = typeof options === 'string' ? { message: options } : { ...options }
  return addToast({ ...toastOptions, type: 'info' })
}

// 生命周期
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 应用间距样式
  if (container.value) {
    const spacing = typeof props.toastSpacing === 'number' ? `${props.toastSpacing}px` : props.toastSpacing
    container.value.style.setProperty('--toast-spacing', spacing)
    
    const margin = typeof props.containerMargin === 'number' ? `${props.containerMargin}px` : props.containerMargin
    container.value.style.setProperty('--container-margin', margin)
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 监听props变化
watch(() => props.position, () => {
  nextTick(() => {
    // 更新位置样式
    if (container.value) {
      // 重新应用间距
      const spacing = typeof props.toastSpacing === 'number' ? `${props.toastSpacing}px` : props.toastSpacing
      container.value.style.setProperty('--toast-spacing', spacing)
      
      const margin = typeof props.containerMargin === 'number' ? `${props.containerMargin}px` : props.containerMargin
      container.value.style.setProperty('--container-margin', margin)
    }
  })
})

// 暴露方法
defineExpose({
  addToast,
  removeToast,
  clearToasts,
  success,
  error,
  warning,
  info,
  toasts
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

// 容器样式
.toast-container {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: var(--toast-spacing, 16px);
  z-index: 9999;
  pointer-events: none;
  padding: var(--container-margin, 24px);
  max-height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

// 位置样式
.toast-position-top-right {
  top: 0;
  right: 0;
  align-items: flex-end;
}

.toast-position-top-left {
  top: 0;
  left: 0;
  align-items: flex-start;
}

.toast-position-top-center {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.toast-position-bottom-right {
  bottom: 0;
  right: 0;
  align-items: flex-end;
}

.toast-position-bottom-left {
  bottom: 0;
  left: 0;
  align-items: flex-start;
}

.toast-position-bottom-center {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

// RTL样式
.toast-container-rtl {
  direction: rtl;
}

// 通知样式
.toast {
  @include toast;
  display: flex;
  align-items: flex-start;
  background-color: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  padding: $spacing-md;
  min-width: 300px;
  max-width: 450px;
  width: 100%;
  pointer-events: all;
  position: relative;
  transition: all $transition-speed ease;
  opacity: 0;
  transform: translateY(-10px);
  animation: slideIn $transition-speed ease;
  cursor: pointer;
}

// 通知类型样式
.toast-success {
  background-color: rgba($success-color, 0.1);
  color: $success-color;
  border-left: 4px solid $success-color;
}

.toast-error {
  background-color: rgba($danger-color, 0.1);
  color: $danger-color;
  border-left: 4px solid $danger-color;
}

.toast-warning {
  background-color: rgba($warning-color, 0.1);
  color: $warning-color;
  border-left: 4px solid $warning-color;
}

.toast-info {
  background-color: rgba($info-color, 0.1);
  color: $info-color;
  border-left: 4px solid $info-color;
}

.toast-default {
  background-color: $gray-50;
  color: $text-color;
  border-left: 4px solid $gray-400;
}

// 图标样式
.toast-icon {
  flex-shrink: 0;
  margin-right: $spacing-md;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

// 内容样式
.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: $font-weight-semibold;
  font-size: $font-size-base;
  margin-bottom: $spacing-xs;
  word-wrap: break-word;
}

.toast-message {
  font-size: $font-size-sm;
  line-height: 1.4;
  word-wrap: break-word;
}

// 关闭按钮样式
.toast-close-button {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius-full;
  color: currentColor;
  opacity: 0.7;
  transition: all $transition-speed ease;
  margin-left: $spacing-sm;
  
  &:hover {
    opacity: 1;
    background-color: rgba($black, 0.1);
  }
}

// 进度条样式
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba($black, 0.1);
  overflow: hidden;
  border-radius: 0 0 $border-radius-lg $border-radius-lg;
}

.toast-progress-bar {
  height: 100%;
  background-color: currentColor;
  transition: width 0.3s linear;
}

// 动画
@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 过渡动画
.toast-enter-active,
.toast-leave-active {
  transition: all $transition-speed ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.toast-leave-active {
  position: absolute;
  width: calc(100% - var(--toast-spacing, 16px));
}

// 响应式样式
@media (max-width: $breakpoint-sm) {
  .toast-container {
    padding: $spacing-sm;
    width: 100%;
    
    &.toast-position-top-center,
    &.toast-position-bottom-center {
      left: 0;
      transform: none;
    }
  }
  
  .toast {
    min-width: 0;
    width: 100%;
    max-width: none;
  }
  
  .toast-title {
    font-size: $font-size-sm;
  }
  
  .toast-message {
    font-size: $font-size-xs;
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .toast {
    border: 2px solid currentColor;
  }
  
  .toast-close-button {
    border: 2px solid currentColor;
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
    transition: opacity 0.3s ease;
  }
  
  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>