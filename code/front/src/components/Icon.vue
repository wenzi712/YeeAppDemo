<template>
  <component
    v-if="iconComponent"
    :is="iconComponent"
    :class="iconClasses"
    :style="iconStyles"
    v-bind="$attrs"
  />
  <svg
    v-else-if="isCustomSvg"
    :class="iconClasses"
    :style="iconStyles"
    aria-hidden="true"
    v-bind="$attrs"
  >
    <use :xlink:href="iconUrl" />
  </svg>
  <span v-else class="icon-placeholder" :class="iconClasses" :style="iconStyles">
    {{ name }}
  </span>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  // 图标名称或组件
  name: {
    type: [String, Object],
    default: ''
  },
  
  // 图标尺寸
  size: {
    type: [Number, String],
    default: 20
  },
  
  // 图标颜色
  color: {
    type: String,
    default: ''
  },
  
  // 图标粗细
  strokeWidth: {
    type: [Number, String],
    default: 2
  },
  
  // 图标变体
  variant: {
    type: String,
    default: 'outline',
    validator: (value) => ['outline', 'solid', 'light', 'thin', 'duotone'].includes(value)
  },
  
  // 是否旋转
  spin: {
    type: Boolean,
    default: false
  },
  
  // 是否脉冲动画
  pulse: {
    type: Boolean,
    default: false
  },
  
  // 旋转角度
  rotate: {
    type: [Number, String],
    default: 0
  },
  
  // 翻转：horizontal, vertical, both
  flip: {
    type: String,
    default: '',
    validator: (value) => ['', 'horizontal', 'vertical', 'both'].includes(value)
  },
  
  // 是否显示为背景
  bg: {
    type: Boolean,
    default: false
  },
  
  // 背景颜色
  bgColor: {
    type: String,
    default: ''
  },
  
  // 背景尺寸
  bgSize: {
    type: [Number, String],
    default: 2
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  },
  
  // 图标库类型
  library: {
    type: String,
    default: 'lucide',
    validator: (value) => ['lucide', 'custom', 'material'].includes(value)
  },
  
  // 自定义SVG路径前缀
  svgPrefix: {
    type: String,
    default: '#'
  }
})

// 动态导入Lucide图标组件
const iconComponent = computed(() => {
  if (!props.name || typeof props.name !== 'string') return null
  
  // 如果是自定义组件，直接返回
  if (typeof props.name === 'object') {
    return props.name
  }
  
  // 尝试导入Lucide图标
  try {
    // 这里使用延迟导入，避免一次性加载所有图标
    // 实际项目中可能需要根据具体情况调整导入方式
    const componentMap = {
      // 导航图标
      Menu: () => import('lucide-vue-next/Menu.vue'),
      X: () => import('lucide-vue-next/X.vue'),
      ChevronRight: () => import('lucide-vue-next/ChevronRight.vue'),
      ChevronLeft: () => import('lucide-vue-next/ChevronLeft.vue'),
      ChevronDown: () => import('lucide-vue-next/ChevronDown.vue'),
      ChevronUp: () => import('lucide-vue-next/ChevronUp.vue'),
      ArrowLeft: () => import('lucide-vue-next/ArrowLeft.vue'),
      ArrowRight: () => import('lucide-vue-next/ArrowRight.vue'),
      ArrowUp: () => import('lucide-vue-next/ArrowUp.vue'),
      ArrowDown: () => import('lucide-vue-next/ArrowDown.vue'),
      
      // 笔记相关图标
      FileText: () => import('lucide-vue-next/FileText.vue'),
      Edit: () => import('lucide-vue-next/Edit.vue'),
      Trash2: () => import('lucide-vue-next/Trash2.vue'),
      Bookmark: () => import('lucide-vue-next/Bookmark.vue'),
      BookmarkCheck: () => import('lucide-vue-next/BookmarkCheck.vue'),
      Tag: () => import('lucide-vue-next/Tag.vue'),
      Search: () => import('lucide-vue-next/Search.vue'),
      Plus: () => import('lucide-vue-next/Plus.vue'),
      PlusCircle: () => import('lucide-vue-next/PlusCircle.vue'),
      Folder: () => import('lucide-vue-next/Folder.vue'),
      FolderOpen: () => import('lucide-vue-next/FolderOpen.vue'),
      
      // 状态图标
      Check: () => import('lucide-vue-next/Check.vue'),
      AlertCircle: () => import('lucide-vue-next/AlertCircle.vue'),
      AlertTriangle: () => import('lucide-vue-next/AlertTriangle.vue'),
      Info: () => import('lucide-vue-next/Info.vue'),
      Loader2: () => import('lucide-vue-next/Loader2.vue'),
      RefreshCw: () => import('lucide-vue-next/RefreshCw.vue'),
      
      // 用户相关图标
      User: () => import('lucide-vue-next/User.vue'),
      Settings: () => import('lucide-vue-next/Settings.vue'),
      LogOut: () => import('lucide-vue-next/LogOut.vue'),
      Upload: () => import('lucide-vue-next/Upload.vue'),
      Download: () => import('lucide-vue-next/Download.vue'),
      
      // 其他图标
      MoreVertical: () => import('lucide-vue-next/MoreVertical.vue'),
      MoreHorizontal: () => import('lucide-vue-next/MoreHorizontal.vue'),
      Star: () => import('lucide-vue-next/Star.vue'),
      StarOff: () => import('lucide-vue-next/StarOff.vue'),
      Heart: () => import('lucide-vue-next/Heart.vue'),
      Eye: () => import('lucide-vue-next/Eye.vue'),
      EyeOff: () => import('lucide-vue-next/EyeOff.vue'),
      Moon: () => import('lucide-vue-next/Moon.vue'),
      Sun: () => import('lucide-vue-next/Sun.vue'),
      Share2: () => import('lucide-vue-next/Share2.vue'),
      Copy: () => import('lucide-vue-next/Copy.vue'),
      ExternalLink: () => import('lucide-vue-next/ExternalLink.vue'),
      Clock: () => import('lucide-vue-next/Clock.vue'),
      Calendar: () => import('lucide-vue-next/Calendar.vue'),
      Link2: () => import('lucide-vue-next/Link2.vue'),
      Image: () => import('lucide-vue-next/Image.vue')
    }
    
    return componentMap[props.name] || null
  } catch (error) {
    console.warn(`Icon ${props.name} not found:`, error)
    return null
  }
})

// 判断是否为自定义SVG
const isCustomSvg = computed(() => {
  return props.library === 'custom' && typeof props.name === 'string'
})

// 自定义SVG图标URL
const iconUrl = computed(() => {
  if (!isCustomSvg.value) return ''
  return `${props.svgPrefix}${props.name}`
})

// 图标样式类
const iconClasses = computed(() => {
  const classes = ['icon']
  
  // 添加名称类
  if (typeof props.name === 'string') {
    classes.push(`icon-${props.name.toLowerCase()}`)
  }
  
  // 添加变体类
  if (props.variant) {
    classes.push(`icon-${props.variant}`)
  }
  
  // 添加动画类
  if (props.spin) {
    classes.push('icon-spin')
  }
  
  if (props.pulse) {
    classes.push('icon-pulse')
  }
  
  // 添加翻转类
  if (props.flip) {
    classes.push(`icon-flip-${props.flip}`)
  }
  
  // 添加背景类
  if (props.bg) {
    classes.push('icon-bg')
  }
  
  // 添加库类
  classes.push(`icon-${props.library}`)
  
  // 添加自定义类
  if (props.class) {
    if (Array.isArray(props.class)) {
      classes.push(...props.class)
    } else if (typeof props.class === 'object') {
      Object.keys(props.class).forEach(key => {
        if (props.class[key]) {
          classes.push(key)
        }
      })
    } else {
      classes.push(props.class)
    }
  }
  
  return classes
})

// 图标内联样式
const iconStyles = computed(() => {
  const styles = {}
  
  // 设置尺寸
  if (props.size) {
    const size = typeof props.size === 'number' ? `${props.size}px` : props.size
    styles.width = size
    styles.height = size
    styles.fontSize = size
  }
  
  // 设置颜色
  if (props.color) {
    styles.color = props.color
    styles.fill = 'currentColor'
    styles.stroke = 'currentColor'
  }
  
  // 设置描边宽度
  if (props.strokeWidth) {
    styles.strokeWidth = props.strokeWidth
  }
  
  // 设置旋转
  if (props.rotate) {
    styles.transform = `rotate(${props.rotate}deg)`
  }
  
  // 设置背景
  if (props.bg && props.bgColor) {
    styles.backgroundColor = props.bgColor
  }
  
  // 设置背景尺寸
  if (props.bg && props.bgSize) {
    const bgSize = typeof props.bgSize === 'number' ? `${props.bgSize}px` : props.bgSize
    styles.padding = bgSize
    styles.borderRadius = '50%'
  }
  
  return styles
})

// 组件挂载时的处理
onMounted(() => {
  // 如果是自定义SVG且图标不存在，可以在这里添加错误处理
  if (isCustomSvg.value) {
    const checkSvg = () => {
      const svgElement = document.querySelector(`svg${iconUrl.value}`)
      if (!svgElement) {
        console.warn(`Custom SVG icon not found: ${props.name}`)
      }
    }
    
    // 延迟检查，确保SVG已经加载
    setTimeout(checkSvg, 0)
  }
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all $transition-speed ease;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: middle;
}

// 变体样式
.icon-outline {
  fill: none;
  stroke: currentColor;
}

.icon-solid {
  fill: currentColor;
  stroke: none;
}

.icon-light {
  fill: currentColor;
  fill-opacity: 0.2;
  stroke: currentColor;
}

.icon-thin {
  stroke-width: 1.5;
}

.icon-duotone {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    fill: currentColor;
    fill-opacity: 0.2;
    stroke: none;
  }
}

// 动画样式
.icon-spin {
  animation: spin $transition-slow linear infinite;
}

.icon-pulse {
  animation: pulse $transition-medium ease-in-out infinite;
}

// 翻转样式
.icon-flip-horizontal {
  transform: scaleX(-1);
}

.icon-flip-vertical {
  transform: scaleY(-1);
}

.icon-flip-both {
  transform: scale(-1);
}

// 背景样式
.icon-bg {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

// 占位符样式
.icon-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: $gray-200;
  color: $text-secondary;
  font-size: calc($font-size-base - 2px);
  font-weight: $font-weight-medium;
  border-radius: $border-radius;
  user-select: none;
}

// 动画定义
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .icon {
    stroke-width: 1.5;
  }
}
</style>