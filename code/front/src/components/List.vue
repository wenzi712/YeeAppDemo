<template>
  <div :class="[
    'list-container',
    `list-${variant}`,
    `list-${size}`,
    { 'list-disabled': disabled },
    { 'list-border': border },
    { 'list-hover': hover },
    { 'list-separator': separator },
    { 'list-animated': animated },
    $attrs.class
  ]">
    <!-- 空状态 -->
    <div v-if="items.length === 0 && $slots.empty" class="list-empty">
      <slot name="empty" />
    </div>
    <div v-else-if="items.length === 0" class="list-empty">
      <component v-if="emptyIcon" :is="emptyIcon" class="list-empty-icon" v-bind="iconProps" />
      <p v-if="emptyText" class="list-empty-text">{{ emptyText }}</p>
    </div>
    
    <!-- 列表项 -->
    <transition-group v-else name="list" tag="ul">
      <li
        v-for="(item, index) in items"
        :key="itemKey ? item[itemKey] : index"
        :class="[
          'list-item',
          { 'list-item-active': isActive(item, index) },
          { 'list-item-disabled': isDisabled(item, index) },
          { 'list-item-with-icon': item.icon || $slots.icon },
          { 'list-item-with-avatar': item.avatar || $slots.avatar },
          { 'list-item-with-badge': item.badge || $slots.badge },
          { 'list-item-with-action': item.action || $slots.action },
          { 'list-item-clickable': clickable && !isDisabled(item, index) },
          { 'list-item-hover': hover && !isDisabled(item, index) },
          { 'list-item-separator': separator && index < items.length - 1 },
          { 'list-item-animated': animated }
        ]"
        @click="handleItemClick(item, index, $event)"
        :tabindex="clickable && !isDisabled(item, index) ? 0 : undefined"
        @keydown.enter="handleItemClick(item, index, $event)"
        @keydown.space="handleItemClick(item, index, $event)"
      >
        <!-- 图标 -->
        <div v-if="item.icon || $slots.icon" class="list-item-icon">
          <component v-if="item.icon" :is="item.icon" :class="item.iconClass" v-bind="iconProps" />
          <template v-else>
            <slot name="icon" :item="item" :index="index" />
          </template>
        </div>
        
        <!-- 头像 -->
        <div v-if="item.avatar || $slots.avatar" class="list-item-avatar">
          <img v-if="item.avatar && item.avatar.startsWith('http')" :src="item.avatar" :alt="item.title || 'Avatar'" class="list-avatar-img" :class="item.avatarClass" />
          <div v-else-if="item.avatar" class="list-avatar-text" :class="item.avatarClass">
            {{ item.avatar }}
          </div>
          <template v-else>
            <slot name="avatar" :item="item" :index="index" />
          </template>
        </div>
        
        <!-- 内容 -->
        <div class="list-item-content" :class="{ 'list-item-content-full': !item.action && !$slots.action && !item.badge && !$slots.badge }">
          <div v-if="item.title || $slots.title" class="list-item-title" :class="item.titleClass">
            <template v-if="$slots.title">
              <slot name="title" :item="item" :index="index" />
            </template>
            <span v-else>{{ item.title }}</span>
          </div>
          
          <div v-if="item.subtitle || $slots.subtitle" class="list-item-subtitle" :class="item.subtitleClass">
            <template v-if="$slots.subtitle">
              <slot name="subtitle" :item="item" :index="index" />
            </template>
            <span v-else>{{ item.subtitle }}</span>
          </div>
          
          <div v-if="item.description || $slots.description" class="list-item-description" :class="item.descriptionClass">
            <template v-if="$slots.description">
              <slot name="description" :item="item" :index="index" />
            </template>
            <span v-else>{{ item.description }}</span>
          </div>
          
          <div v-if="$slots.extra" class="list-item-extra">
            <slot name="extra" :item="item" :index="index" />
          </div>
        </div>
        
        <!-- 徽章 -->
        <div v-if="item.badge || $slots.badge" class="list-item-badge">
          <span v-if="item.badge" class="list-badge" :class="item.badgeClass">{{ item.badge }}</span>
          <template v-else>
            <slot name="badge" :item="item" :index="index" />
          </template>
        </div>
        
        <!-- 操作按钮 -->
        <div v-if="item.action || $slots.action" class="list-item-action">
          <component v-if="item.action" :is="item.action" v-bind="actionProps" />
          <template v-else>
            <slot name="action" :item="item" :index="index" />
          </template>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  // 列表数据
  items: {
    type: Array,
    default: () => []
  },
  
  // 列表类型：default, primary, secondary
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary'].includes(value)
  },
  
  // 列表大小：sm, md, lg
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  // 列表项的唯一键
  itemKey: {
    type: String,
    default: ''
  },
  
  // 激活项的索引或值
  active: {
    type: [Number, String, Array],
    default: null
  },
  
  // 禁用项的索引或值
  disabled: {
    type: [Boolean, Number, String, Array],
    default: false
  },
  
  // 是否显示边框
  border: {
    type: Boolean,
    default: false
  },
  
  // 是否显示悬浮效果
  hover: {
    type: Boolean,
    default: false
  },
  
  // 是否显示分隔线
  separator: {
    type: Boolean,
    default: true
  },
  
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },
  
  // 是否显示动画
  animated: {
    type: Boolean,
    default: false
  },
  
  // 空状态图标
  emptyIcon: {
    type: [Object, String],
    default: null
  },
  
  // 空状态文本
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // 操作按钮属性
  actionProps: {
    type: Object,
    default: () => ({})
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  }
})

const emit = defineEmits(['click', 'update:active'])

// 判断项是否激活
const isActive = (item, index) => {
  if (props.active === null) return false
  
  if (Array.isArray(props.active)) {
    return props.active.includes(index) || 
           (props.itemKey && props.active.includes(item[props.itemKey]))
  }
  
  return props.active === index || 
         (props.itemKey && props.active === item[props.itemKey])
}

// 判断项是否禁用
const isDisabled = (item, index) => {
  if (props.disabled === true) return true
  if (props.disabled === false) return item.disabled || false
  
  if (Array.isArray(props.disabled)) {
    return props.disabled.includes(index) || 
           (props.itemKey && props.disabled.includes(item[props.itemKey])) ||
           item.disabled || false
  }
  
  return props.disabled === index || 
         (props.itemKey && props.disabled === item[props.itemKey]) ||
         item.disabled || false
}

// 处理点击事件
const handleItemClick = (item, index, event) => {
  if (!props.clickable || isDisabled(item, index)) return
  
  emit('click', item, index, event)
  
  // 如果是单选，更新激活状态
  if (!Array.isArray(props.active)) {
    emit('update:active', props.itemKey ? item[props.itemKey] : index)
  } else {
    // 多选逻辑
    const currentValue = props.itemKey ? item[props.itemKey] : index
    const newActive = [...props.active]
    
    const activeIndex = newActive.indexOf(currentValue)
    if (activeIndex > -1) {
      newActive.splice(activeIndex, 1)
    } else {
      newActive.push(currentValue)
    }
    
    emit('update:active', newActive)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.list-container {
  width: 100%;
  background-color: $white;
  border-radius: $border-radius;
  overflow: hidden;
}

// 变体样式
.list-default {
  background-color: $white;
}

.list-primary {
  background-color: rgba($primary-color, 0.05);
}

.list-secondary {
  background-color: $gray-50;
}

// 尺寸样式
.list-sm {
  font-size: $font-size-sm;
}

.list-md {
  font-size: $font-size-base;
}

.list-lg {
  font-size: $font-size-lg;
}

// 禁用状态
.list-disabled {
  opacity: 0.6;
  pointer-events: none;
}

// 边框
.list-border {
  border: 1px solid $border-color;
}

// 悬浮效果
.list-hover .list-item-hover {
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: rgba($primary-color, 0.05);
  }
}

// 分隔线
.list-separator .list-item-separator {
  border-bottom: 1px solid $border-color;
}

// 可点击项
.list-item-clickable {
  cursor: pointer;
  
  &:focus {
    outline: 2px solid $primary-color;
    outline-offset: -2px;
  }
}

// 空状态
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  color: $text-secondary;
  text-align: center;
}

.list-empty-icon {
  margin-bottom: $spacing-md;
  color: #999;
  font-size: 2rem;
}

.list-empty-text {
  margin: 0;
  font-size: $font-size-base;
}

// 列表项
.list-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  position: relative;
  transition: all $transition-speed ease;
}

// 激活状态
.list-item-active {
  background-color: rgba($primary-color, 0.1);
  color: $primary-color;
  
  .list-item-title {
    color: $primary-color;
  }
}

// 禁用状态
.list-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

// 图标
.list-item-icon {
  margin-right: $spacing-md;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: $text-secondary;
  }
}

// 头像
.list-item-avatar {
  margin-right: $spacing-md;
  flex-shrink: 0;
}

.list-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: $border-radius-full;
  object-fit: cover;
}

.list-avatar-text {
  width: 32px;
  height: 32px;
  border-radius: $border-radius-full;
  background-color: $primary-color;
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-semibold;
  font-size: $font-size-sm;
}

// 内容
.list-item-content {
  flex: 1;
  min-width: 0;
}

.list-item-content-full {
  margin-right: $spacing-md;
}

.list-item-title {
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: $spacing-xs;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-subtitle {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xs;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-description {
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.4;
}

.list-item-extra {
  margin-top: $spacing-xs;
}

// 徽章
.list-item-badge {
  margin-right: $spacing-md;
  flex-shrink: 0;
}

.list-badge {
  padding: 2px 8px;
  background-color: $primary-color;
  color: $white;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

// 操作按钮
.list-item-action {
  flex-shrink: 0;
}

// 尺寸适配
.list-sm .list-item {
  padding: $spacing-xs $spacing-sm;
}

.list-sm .list-item-icon,
.list-sm .list-item-avatar,
.list-sm .list-item-badge {
  margin-right: $spacing-sm;
}

.list-sm .list-avatar-img,
.list-sm .list-avatar-text {
  width: 24px;
  height: 24px;
  font-size: $font-size-xs;
}

.list-lg .list-item {
  padding: $spacing-lg;
}

.list-lg .list-item-icon,
.list-lg .list-item-avatar,
.list-lg .list-item-badge {
  margin-right: $spacing-lg;
}

.list-lg .list-avatar-img,
.list-lg .list-avatar-text {
  width: 40px;
  height: 40px;
  font-size: $font-size-base;
}

// 动画
.list-enter-active,
.list-leave-active {
  transition: all $transition-speed ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.list-move {
  transition: transform $transition-speed ease;
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .list-item {
    padding: $spacing-sm;
  }
  
  .list-lg .list-item {
    padding: $spacing-md;
  }
}
</style>