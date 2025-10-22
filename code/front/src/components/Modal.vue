<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="handleBackdropClick">
        <div 
          :class="[
            'modal-container',
            `modal-${size}`,
            `modal-${position}`,
            { 'modal-centered': centered },
            { 'modal-scrollable': scrollable },
            { 'modal-fullscreen': fullscreen },
            { 'modal-transition-fast': transition === 'fast' },
            { 'modal-transition-slow': transition === 'slow' },
            $attrs.class
          ]"
          :style="{ 
            width: width ? width : undefined,
            maxWidth: maxWidth ? maxWidth : undefined,
            height: height ? height : undefined,
            maxHeight: maxHeight ? maxHeight : undefined
          }"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="title ? id : undefined"
          :tabindex="-1"
          @keydown.esc="handleEscape"
          ref="modalContainer"
        >
          <!-- 模态框头部 -->
          <div v-if="title || $slots.header" class="modal-header" :class="{ 'modal-header-noborder': headerBorderless }">
            <div v-if="title" class="modal-title" :id="id">
              <component v-if="headerIcon" :is="headerIcon" class="modal-title-icon" v-bind="iconProps" />
              <span>{{ title }}</span>
            </div>
            <template v-else>
              <slot name="header" />
            </template>
            
            <!-- 关闭按钮 -->
            <button 
              v-if="closable" 
              type="button" 
              class="modal-close" 
              @click="handleClose"
              :title="closeText"
              aria-label="Close"
            >
              <component :is="closeIcon" v-bind="iconProps" />
            </button>
          </div>
          
          <!-- 模态框主体 -->
          <div class="modal-body" :class="{ 'modal-body-nopadding': bodyPadding === false }">
            <slot />
          </div>
          
          <!-- 模态框底部 -->
          <div v-if="$slots.footer || (confirmText || cancelText)" class="modal-footer" :class="{ 'modal-footer-noborder': footerBorderless }">
            <template v-if="$slots.footer">
              <slot name="footer" />
            </template>
            <template v-else>
              <button 
                v-if="cancelText" 
                type="button" 
                class="btn btn-secondary modal-btn-cancel" 
                @click="handleCancel"
                :disabled="loading"
              >
                {{ cancelText }}
              </button>
              <button 
                v-if="confirmText" 
                type="button" 
                :class="['btn', `btn-${confirmType}`, 'modal-btn-confirm']" 
                @click="handleConfirm"
                :disabled="loading"
              >
                <component v-if="loading" :is="loadingIcon" class="modal-btn-loading" v-bind="iconProps" />
                {{ confirmText }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 绑定值
  modelValue: {
    type: Boolean,
    default: false
  },
  
  // 模态框标题
  title: {
    type: String,
    default: ''
  },
  
  // 模态框尺寸：sm, md, lg, xl, full
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  
  // 模态框位置：center, top, bottom, left, right
  position: {
    type: String,
    default: 'center',
    validator: (value) => ['center', 'top', 'bottom', 'left', 'right'].includes(value)
  },
  
  // 是否居中显示
  centered: {
    type: Boolean,
    default: false
  },
  
  // 是否可关闭
  closable: {
    type: Boolean,
    default: true
  },
  
  // 是否背景点击关闭
  backdropClose: {
    type: Boolean,
    default: true
  },
  
  // 是否ESC键关闭
  escapeClose: {
    type: Boolean,
    default: true
  },
  
  // 是否全屏
  fullscreen: {
    type: Boolean,
    default: false
  },
  
  // 是否滚动内容
  scrollable: {
    type: Boolean,
    default: false
  },
  
  // 是否禁止背景滚动
  noBackdropScroll: {
    type: Boolean,
    default: true
  },
  
  // 确认按钮文本
  confirmText: {
    type: String,
    default: ''
  },
  
  // 取消按钮文本
  cancelText: {
    type: String,
    default: ''
  },
  
  // 确认按钮类型
  confirmType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  
  // 关闭按钮文本
  closeText: {
    type: String,
    default: '关闭'
  },
  
  // 头部图标
  headerIcon: {
    type: [Object, String],
    default: null
  },
  
  // 关闭图标
  closeIcon: {
    type: [Object, String],
    default: 'X'
  },
  
  // 加载图标
  loadingIcon: {
    type: [Object, String],
    default: 'Loader2'
  },
  
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // 过渡动画类型
  transition: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'fast', 'slow'].includes(value)
  },
  
  // 头部是否无边框
  headerBorderless: {
    type: Boolean,
    default: false
  },
  
  // 底部是否无边框
  footerBorderless: {
    type: Boolean,
    default: false
  },
  
  // 主体是否无内边距
  bodyPadding: {
    type: Boolean,
    default: true
  },
  
  // 自定义宽度
  width: {
    type: String,
    default: ''
  },
  
  // 自定义最大宽度
  maxWidth: {
    type: String,
    default: ''
  },
  
  // 自定义高度
  height: {
    type: String,
    default: ''
  },
  
  // 自定义最大高度
  maxHeight: {
    type: String,
    default: ''
  },
  
  // ID
  id: {
    type: String,
    default: `modal-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'close',
  'confirm',
  'cancel',
  'show',
  'hide'
])

const modalContainer = ref(null)
const lastActiveElement = ref(null)
const scrollY = ref(0)

// 打开模态框
const open = async () => {
  emit('update:modelValue', true)
  emit('open')
  
  await nextTick()
  
  // 保存当前激活元素
  lastActiveElement.value = document.activeElement
  
  // 禁止背景滚动
  if (props.noBackdropScroll) {
    scrollY.value = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY.value}px`
    document.body.style.left = 0
    document.body.style.right = 0
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
  }
  
  // 聚焦模态框
  if (modalContainer.value) {
    modalContainer.value.focus()
  }
  
  emit('show')
}

// 关闭模态框
const close = async () => {
  emit('update:modelValue', false)
  emit('close')
  emit('hide')
  
  // 恢复背景滚动
  if (props.noBackdropScroll) {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    window.scrollTo(0, scrollY.value)
  }
  
  // 恢复之前的激活元素
  if (lastActiveElement.value && lastActiveElement.value.focus) {
    setTimeout(() => lastActiveElement.value.focus(), 0)
  }
}

// 处理背景点击
const handleBackdropClick = () => {
  if (props.backdropClose && props.closable && !props.loading) {
    close()
  }
}

// 处理ESC键
const handleEscape = (event) => {
  if (props.escapeClose && props.closable && !props.loading) {
    event.stopPropagation()
    close()
  }
}

// 处理关闭按钮点击
const handleClose = () => {
  if (props.closable && !props.loading) {
    close()
  }
}

// 处理确认按钮点击
const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

// 处理取消按钮点击
const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
    close()
  }
}

// 监听键盘事件
const handleKeydown = (event) => {
  // 防止焦点移出模态框
  if (props.modelValue && event.key === 'Tab') {
    const focusableElements = modalContainer.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

// 监听属性变化
onMounted(() => {
  if (props.modelValue) {
    open()
  }
  
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理样式
  if (props.noBackdropScroll) {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
  
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法
defineExpose({
  open,
  close,
  handleConfirm,
  handleCancel
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  overflow-x: hidden;
  overflow-y: auto;
  padding: $spacing-md;
}

.modal-container {
  background-color: $white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  outline: 0;
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transition: all $transition-speed ease;
}

// 尺寸样式
.modal-sm {
  max-width: 300px;
}

.modal-md {
  max-width: 500px;
}

.modal-lg {
  max-width: 800px;
}

.modal-xl {
  max-width: 1140px;
}

.modal-full {
  max-width: 90vw;
}

.modal-fullscreen {
  max-width: 100vw;
  max-height: 100vh;
  width: 100%;
  height: 100%;
  margin: 0;
  border-radius: 0;
}

// 位置样式
.modal-center {
  align-self: center;
}

.modal-top {
  align-self: flex-start;
  margin-top: 0;
}

.modal-bottom {
  align-self: flex-end;
  margin-bottom: 0;
}

.modal-left {
  align-self: flex-start;
  margin-left: 0;
}

.modal-right {
  align-self: flex-end;
  margin-right: 0;
}

// 居中显示
.modal-centered {
  align-self: center;
}

// 滚动内容
.modal-scrollable .modal-body {
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

// 头部
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.modal-header-noborder {
  border-bottom: none;
}

.modal-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-semibold;
  color: $text-color;
  margin: 0;
  display: flex;
  align-items: center;
}

.modal-title-icon {
  margin-right: $spacing-sm;
}

// 关闭按钮
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: $spacing-xs;
  border-radius: $border-radius;
  color: $text-secondary;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $gray-100;
    color: $text-color;
  }
  
  &:focus {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}

// 主体
.modal-body {
  flex: 1;
  padding: $spacing-lg;
}

.modal-body-nopadding {
  padding: 0;
}

// 底部
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  gap: $spacing-md;
}

.modal-footer-noborder {
  border-top: none;
}

.modal-btn-cancel,
.modal-btn-confirm {
  min-width: 80px;
}

.modal-btn-loading {
  margin-right: $spacing-xs;
  animation: spin $transition-slow linear infinite;
}

// 过渡动画
.modal-enter-active {
  transition: all $transition-speed ease;
}

.modal-leave-active {
  transition: all $transition-speed ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

// 过渡速度
.modal-transition-fast .modal-container {
  transition: all $transition-fast ease;
}

.modal-transition-slow .modal-container {
  transition: all $transition-slow ease;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .modal-backdrop {
    padding: $spacing-sm;
  }
  
  .modal-container {
    margin: 0;
    max-width: 100%;
    max-height: 100vh;
    border-radius: $border-radius;
  }
  
  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    max-width: 100%;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: $spacing-md;
  }
  
  .modal-title {
    font-size: $font-size-lg;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: $spacing-sm;
  }
  
  .modal-footer button {
    width: 100%;
  }
}
</style>