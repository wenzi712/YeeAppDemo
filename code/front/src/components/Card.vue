<template>
  <div 
    :class="[
      'card',
      `card-${variant}`,
      `card-${size}`,
      { 'card-shadow': shadow },
      { 'card-borderless': borderless },
      { 'card-hoverable': hoverable },
      { 'card-disabled': disabled },
      class
    ]"
    :style="{ 
      borderRadius: borderRadius ? borderRadius : undefined,
      background: bgColor ? bgColor : undefined,
      borderColor: borderColor ? borderColor : undefined
    }"
    @click="handleClick"
    :tabindex="hoverable && !disabled ? 0 : undefined"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title || subtitle" class="card-header" :class="{ 'card-header-noborder': headerBorderless }">
      <div v-if="title || subtitle" class="card-title-container">
        <h3 v-if="title" class="card-title" :class="titleClass">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle" :class="subtitleClass">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.header" class="card-header-content"><slot name="header" /></div>
    </div>
    
    <!-- 卡片主体 -->
    <div v-if="$slots.default" class="card-body" :class="{ 'card-body-nopadding': bodyPadding === false }">
      <slot />
    </div>
    
    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer" :class="{ 'card-footer-noborder': footerBorderless }">
      <slot name="footer" />
    </div>
    
    <!-- 卡片覆盖层 -->
    <div v-if="$slots.overlay" class="card-overlay">
      <slot name="overlay" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  // 卡片类型：default, primary, secondary, success, warning, danger, info, light, dark
  variant: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark'
    ].includes(value)
  },
  
  // 卡片大小：sm, md, lg, xl
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  // 卡片标题
  title: {
    type: String,
    default: ''
  },
  
  // 卡片副标题
  subtitle: {
    type: String,
    default: ''
  },
  
  // 是否显示阴影
  shadow: {
    type: Boolean,
    default: true
  },
  
  // 是否无边框
  borderless: {
    type: Boolean,
    default: false
  },
  
  // 是否可悬浮
  hoverable: {
    type: Boolean,
    default: false
  },
  
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
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
  
  // 自定义圆角
  borderRadius: {
    type: String,
    default: ''
  },
  
  // 自定义背景色
  bgColor: {
    type: String,
    default: ''
  },
  
  // 自定义边框色
  borderColor: {
    type: String,
    default: ''
  },
  
  // 标题自定义类
  titleClass: {
    type: [String, Object, Array],
    default: ''
  },
  
  // 副标题自定义类
  subtitleClass: {
    type: [String, Object, Array],
    default: ''
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.card {
  @include card;
  position: relative;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  overflow: hidden;
  transition: all $transition-speed ease;
}

// 变体样式
.card-default {
  background-color: $white;
  border-color: $border-color;
}

@each $variant, $color in (
  'primary': $primary-color,
  'secondary': $secondary-color,
  'success': $success-color,
  'warning': $warning-color,
  'danger': $danger-color,
  'info': $info-color,
  'light': $light-color,
  'dark': $dark-color
) {
  .card-#{$variant} {
    background-color: $color;
    border-color: $color;
    color: $white;
    
    .card-title,
    .card-subtitle {
      color: $white;
    }
  }
}

.card-light {
  color: $text-color;
  
  .card-title,
  .card-subtitle {
    color: $text-color;
  }
}

// 尺寸样式
.card-sm {
  border-radius: $border-radius-sm;
  
  .card-header {
    padding: $spacing-sm $spacing-md;
  }
  
  .card-body {
    padding: $spacing-md;
  }
  
  .card-footer {
    padding: $spacing-sm $spacing-md;
  }
  
  .card-title {
    font-size: $font-size-base;
  }
  
  .card-subtitle {
    font-size: $font-size-sm;
  }
}

.card-md {
  border-radius: $border-radius;
  
  .card-header {
    padding: $spacing-md;
  }
  
  .card-body {
    padding: $spacing-lg;
  }
  
  .card-footer {
    padding: $spacing-md;
  }
  
  .card-title {
    font-size: $font-size-lg;
  }
  
  .card-subtitle {
    font-size: $font-size-base;
  }
}

.card-lg {
  border-radius: $border-radius-lg;
  
  .card-header {
    padding: $spacing-lg $spacing-xl;
  }
  
  .card-body {
    padding: $spacing-xl;
  }
  
  .card-footer {
    padding: $spacing-lg $spacing-xl;
  }
  
  .card-title {
    font-size: $font-size-xl;
  }
  
  .card-subtitle {
    font-size: $font-size-lg;
  }
}

.card-xl {
  border-radius: $border-radius-xl;
  
  .card-header {
    padding: $spacing-xl;
  }
  
  .card-body {
    padding: $spacing-2xl;
  }
  
  .card-footer {
    padding: $spacing-xl;
  }
  
  .card-title {
    font-size: $font-size-2xl;
  }
  
  .card-subtitle {
    font-size: $font-size-xl;
  }
}

// 阴影
.card-shadow {
  box-shadow: $shadow;
}

// 无边框
.card-borderless {
  border: none;
}

// 悬浮效果
.card-hoverable {
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
  
  &:focus {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}

// 禁用状态
.card-disabled {
  opacity: 0.6;
  pointer-events: none;
}

// 卡片头部
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid $border-color;
  
  .card-title-container {
    flex: 1;
  }
  
  .card-header-content {
    margin-left: auto;
  }
}

.card-header-noborder {
  border-bottom: none;
}

.card-title {
  font-weight: $font-weight-semibold;
  margin: 0 0 $spacing-xs 0;
  color: $text-color;
}

.card-subtitle {
  font-weight: $font-weight-normal;
  margin: 0;
  color: $text-secondary;
  opacity: 0.8;
}

// 卡片主体
.card-body {
  flex: 1;
}

.card-body-nopadding {
  padding: 0;
}

// 卡片底部
.card-footer {
  border-top: 1px solid $border-color;
}

.card-footer-noborder {
  border-top: none;
}

// 卡片覆盖层
.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba($black, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .card-lg,
  .card-xl {
    border-radius: $border-radius;
    
    .card-header {
      padding: $spacing-md;
    }
    
    .card-body {
      padding: $spacing-lg;
    }
    
    .card-footer {
      padding: $spacing-md;
    }
    
    .card-title {
      font-size: $font-size-lg;
    }
    
    .card-subtitle {
      font-size: $font-size-base;
    }
  }
}
</style>