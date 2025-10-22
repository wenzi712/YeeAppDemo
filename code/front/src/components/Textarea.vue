<template>
  <div class="textarea-wrapper" :class="wrapperClasses">
    <textarea
      :class="[
        'textarea-field',
        `textarea-${size}`,
        { 'textarea-disabled': disabled },
        { 'textarea-readonly': readonly },
        { 'textarea-focus': focus },
        { 'textarea-error': hasError },
        { 'textarea-resizable': resizable },
        class
      ]"
      :id="id"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :maxlength="maxlength"
      :minlength="minlength"
      :rows="rows"
      :cols="cols"
      :autofocus="autofocus"
      :spellcheck="spellcheck"
      :wrap="wrap"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup="handleKeyup"
      @keydown="handleKeydown"
      @change="handleChange"
      @click="handleClick"
    ></textarea>
    
    <!-- 字符计数器 -->
    <div v-if="showCounter && maxlength" class="textarea-counter">
      {{ modelValue ? String(modelValue).length : 0 }}/{{ maxlength }}
    </div>
    
    <!-- 清除按钮 -->
    <button
      v-if="clearable && modelValue && !disabled && !readonly"
      type="button"
      class="textarea-clear"
      @click="clearTextarea"
      title="清除"
    >
      <component :is="clearIcon" v-bind="iconProps" />
    </button>
  </div>
  
  <!-- 错误提示 -->
  <div v-if="errorMessage && hasError" class="textarea-error-message">{{ errorMessage }}</div>
  
  <!-- 帮助文本 -->
  <div v-if="helperText && !hasError" class="textarea-helper-text">{{ helperText }}</div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 绑定值
  modelValue: {
    type: String,
    default: ''
  },
  
  // 占位符
  placeholder: {
    type: String,
    default: ''
  },
  
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  
  // 是否必填
  required: {
    type: Boolean,
    default: false
  },
  
  // 最大长度
  maxlength: {
    type: Number,
    default: null
  },
  
  // 最小长度
  minlength: {
    type: Number,
    default: null
  },
  
  // 行数
  rows: {
    type: Number,
    default: 3
  },
  
  // 列数
  cols: {
    type: Number,
    default: 20
  },
  
  // 是否自动聚焦
  autofocus: {
    type: Boolean,
    default: false
  },
  
  // 是否拼写检查
  spellcheck: {
    type: Boolean,
    default: true
  },
  
  // 换行方式
  wrap: {
    type: String,
    default: 'soft',
    validator: (value) => ['soft', 'hard'].includes(value)
  },
  
  // 尺寸
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  // ID
  id: {
    type: String,
    default: null
  },
  
  // 名称
  name: {
    type: String,
    default: null
  },
  
  // 是否可调整大小
  resizable: {
    type: Boolean,
    default: true
  },
  
  // 显示字符计数器
  showCounter: {
    type: Boolean,
    default: false
  },
  
  // 是否可清除
  clearable: {
    type: Boolean,
    default: false
  },
  
  // 清除图标
  clearIcon: {
    type: [Object, String],
    default: 'X'
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // 错误消息
  errorMessage: {
    type: String,
    default: ''
  },
  
  // 是否错误状态
  error: {
    type: Boolean,
    default: false
  },
  
  // 帮助文本
  helperText: {
    type: String,
    default: ''
  },
  
  // 自定义类名
  class: {
    type: [String, Object, Array],
    default: ''
  },
  
  // 容器自定义类名
  wrapperClass: {
    type: [String, Object, Array],
    default: ''
  }
})

const emit = defineEmits([
  'update:modelValue',
  'input',
  'focus',
  'blur',
  'keyup',
  'keydown',
  'change',
  'click',
  'clear'
])

const focus = ref(false)

// 计算属性
const hasError = computed(() => {
  return props.error || !!props.errorMessage
})

const wrapperClasses = computed(() => {
  return [
    'textarea-wrapper',
    `textarea-wrapper-${props.size}`,
    { 'textarea-wrapper-focus': focus.value },
    { 'textarea-wrapper-error': hasError.value },
    { 'textarea-wrapper-disabled': props.disabled },
    { 'textarea-wrapper-with-counter': props.showCounter && props.maxlength },
    { 'textarea-wrapper-with-clear': props.clearable && props.modelValue && !props.disabled && !props.readonly },
    props.wrapperClass
  ]
})

// 处理输入事件
const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('input', event)
}

// 处理聚焦事件
const handleFocus = (event) => {
  focus.value = true
  emit('focus', event)
}

// 处理失焦事件
const handleBlur = (event) => {
  focus.value = false
  emit('blur', event)
}

// 处理按键抬起事件
const handleKeyup = (event) => {
  emit('keyup', event)
}

// 处理按键按下事件
const handleKeydown = (event) => {
  emit('keydown', event)
}

// 处理改变事件
const handleChange = (event) => {
  emit('change', event)
}

// 处理点击事件
const handleClick = (event) => {
  emit('click', event)
}

// 清除文本
const clearTextarea = () => {
  if (props.disabled || props.readonly) return
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.textarea-wrapper {
  @include input-wrapper;
  position: relative;
  display: inline-flex;
  width: 100%;
  transition: all $transition-speed ease;
}

.textarea-field {
  @include input-field;
  width: 100%;
  font-size: $font-size-base;
  line-height: $line-height;
  color: $text-color;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
  resize: none;
  
  &:focus {
    @include focus;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: $text-placeholder;
    opacity: 1;
  }
  
  &::-webkit-input-placeholder {
    color: $text-placeholder;
  }
  
  &:-moz-placeholder {
    color: $text-placeholder;
    opacity: 1;
  }
  
  &::-moz-placeholder {
    color: $text-placeholder;
    opacity: 1;
  }
  
  &:-ms-input-placeholder {
    color: $text-placeholder;
  }
  
  // 可调整大小
  &.textarea-resizable {
    resize: vertical;
    min-height: 80px;
  }
}

// 尺寸样式
.textarea-sm {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
}

.textarea-md {
  font-size: $font-size-base;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
}

.textarea-lg {
  font-size: $font-size-lg;
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
}

// 禁用状态
.textarea-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: $gray-100;
}

// 只读状态
.textarea-readonly {
  background-color: $gray-100;
  cursor: default;
}

// 错误状态
.textarea-error {
  border-color: $error-color;
  
  &:focus {
    border-color: $error-color;
    box-shadow: 0 0 0 3px rgba($error-color, 0.1);
  }
}

// 聚焦状态
.textarea-focus {
  border-color: $primary-color;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
}

// 字符计数器
.textarea-counter {
  position: absolute;
  bottom: $spacing-xs;
  right: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-secondary;
  background-color: rgba($white, 0.8);
  padding: 2px 6px;
  border-radius: $border-radius-sm;
  pointer-events: none;
}

// 清除按钮
.textarea-clear {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  pointer-events: auto;
  cursor: pointer;
  background: rgba($white, 0.8);
  border: none;
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: $border-radius-full;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $gray-200;
    color: $error-color;
  }
}

// 错误消息
.textarea-error-message {
  margin-top: $spacing-xs;
  font-size: $font-size-xs;
  color: $error-color;
  line-height: 1.2;
}

// 帮助文本
.textarea-helper-text {
  margin-top: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-secondary;
  line-height: 1.2;
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .textarea-field {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
  
  .textarea-lg {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
  }
}
</style>