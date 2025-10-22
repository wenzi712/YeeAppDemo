<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-block': block },
      { 'btn-disabled': disabled },
      { 'btn-loading': loading },
      { 'btn-rounded': rounded },
      { 'btn-outline': outline },
      { 'btn-icon': icon && !$slots.default },
      $attrs.class
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
    :tabindex="disabled || loading ? -1 : tabindex"
  >
    <template v-if="loading">
      <div class="btn-spinner"></div>
      <span v-if="$slots.default" class="ml-2"><slot /></span>
    </template>
    <template v-else>
      <component v-if="icon" :is="icon" class="btn-icon-prepend" v-bind="iconProps" />
      <span v-if="$slots.default"><slot /></span>
      <component v-if="iconRight" :is="iconRight" class="btn-icon-append" v-bind="iconProps" />
    </template>
  </button>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  // 按钮类型：primary, secondary, success, warning, danger, info, light, dark
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark'
    ].includes(value)
  },
  
  // 按钮大小：sm, md, lg, xl
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  
  // 是否块级按钮
  block: {
    type: Boolean,
    default: false
  },
  
  // 是否圆角
  rounded: {
    type: Boolean,
    default: false
  },
  
  // 是否轮廓按钮
  outline: {
    type: Boolean,
    default: false
  },
  
  // 按钮类型：button, submit, reset
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  
  // 左侧图标组件
  icon: {
    type: [Object, String],
    default: null
  },
  
  // 右侧图标组件
  iconRight: {
    type: [Object, String],
    default: null
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // tabindex
  tabindex: {
    type: Number,
    default: 0
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  }
})

const emit = defineEmits(['click', 'focus', 'blur'])

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.btn {
  @include button-base;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-medium;
  line-height: $line-height;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  transition: all $transition-speed ease;
  border-radius: $border-radius;
  
  &:focus {

  }
  
  &:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }
}

// 变体样式
@each $variant, $color in (
  'primary': $primary-color,
  'secondary': $secondary-color,
  'success': $success-color,
  'warning': $warning-color,
  'danger': $danger-color,
  'info': $info-color,
  'light': #f8f9fa,
  'dark': #343a40
) {
  .btn-#{$variant} {
    background-color: $color;
    color: $white;
    border-color: $color;
    
    &:hover:not(.btn-disabled):not(:disabled):not(.btn-loading) {
      background-color: darken($color, 10%);
      border-color: darken($color, 10%);
    }
    
    &:active:not(.btn-disabled):not(:disabled):not(.btn-loading) {
      background-color: darken($color, 15%);
      border-color: darken($color, 15%);
    }
  }
  
  // 轮廓按钮
  .btn-outline.btn-#{$variant} {
    background-color: transparent;
    color: $color;
    border-color: $color;
    
    &:hover:not(.btn-disabled):not(:disabled):not(.btn-loading) {
      background-color: $color;
      color: $white;
    }
    
    &:active:not(.btn-disabled):not(:disabled):not(.btn-loading) {
      background-color: darken($color, 10%);
      color: $white;
    }
  }
}

// 尺寸样式
.btn-sm {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
}

.btn-md {
  font-size: $font-size-base;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
}

.btn-lg {
  font-size: $font-size-lg;
  padding: $spacing-md $spacing-lg;
  border-radius: 4px;
}

.btn-xl {
  font-size: $font-size-xl;
  padding: $spacing-lg $spacing-xl;
  border-radius: $border-radius-lg;
}

// 禁用状态
.btn-disabled,
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

// 块级按钮
.btn-block {
  display: block;
  width: 100%;
}

// 圆角按钮
.btn-rounded {
  border-radius: $border-radius-full;
}

// 加载状态
.btn-loading {
  cursor: wait;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba($white, 0.3);
    border-radius: 50%;
    border-top-color: $white;
    animation: spin $transition-slow linear infinite;
  }
  
  .btn-outline.btn-loading::before {
    border-color: rgba($text-color, 0.3);
    border-top-color: $text-color;
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba($white, 0.3);
  border-radius: 50%;
  border-top-color: $white;
  animation: spin $transition-slow linear infinite;
}

.btn-outline .btn-spinner {
  border-color: rgba($text-color, 0.3);
  border-top-color: $text-color;
}

// 图标按钮
.btn-icon {
  padding: $spacing-sm;
  min-width: fit-content;
  
  .btn-icon-prepend,
  .btn-icon-append {
    margin: 0;
  }
}

.btn-icon-prepend {
  margin-right: $spacing-xs;
}

.btn-icon-append {
  margin-left: $spacing-xs;
}

// 图标尺寸适配
.btn-sm .btn-icon-prepend,
.btn-sm .btn-icon-append,
.btn-sm .btn-spinner {
  width: 14px;
  height: 14px;
}

.btn-md .btn-icon-prepend,
.btn-md .btn-icon-append,
.btn-md .btn-spinner {
  width: 16px;
  height: 16px;
}

.btn-lg .btn-icon-prepend,
.btn-lg .btn-icon-append,
.btn-lg .btn-spinner {
  width: 20px;
  height: 20px;
}

.btn-xl .btn-icon-prepend,
.btn-xl .btn-icon-append,
.btn-xl .btn-spinner {
  width: 24px;
  height: 24px;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 焦点样式
@mixin focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.2);
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .btn {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
  
  .btn-lg,
  .btn-xl {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
  }
}
</style>