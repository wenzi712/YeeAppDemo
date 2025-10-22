<template>
  <div class="input-wrapper" :class="wrapperClasses">
    <component
      v-if="iconLeft"
      :is="iconLeft"
      class="input-icon input-icon-left"
      :class="{ 'input-icon-error': hasError }"
      v-bind="iconProps"
    />
    
    <input
      :type="type"
      :class="[
        'input-field',
        `input-${size}`,
        { 'input-disabled': disabled },
        { 'input-readonly': readonly },
        { 'input-focus': focus },
        { 'input-error': hasError },
        { 'input-with-icon-left': iconLeft },
        { 'input-with-icon-right': iconRight || showPasswordToggle },
        $attrs.class
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
      :pattern="pattern"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      :spellcheck="spellcheck"
      :inputmode="inputmode"
      :step="step"
      :min="min"
      :max="max"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup="handleKeyup"
      @keydown="handleKeydown"
      @change="handleChange"
      @click="handleClick"
    />
    
    <!-- 密码切换按钮 -->
    <button
      v-if="showPasswordToggle"
      type="button"
      class="input-icon input-icon-right input-password-toggle"
      @click="togglePasswordVisibility"
      :title="isPasswordVisible ? '隐藏密码' : '显示密码'"
    >
      <component :is="isPasswordVisible ? hidePasswordIcon : showPasswordIcon" v-bind="iconProps" />
    </button>
    
    <!-- 右侧图标 -->
    <component
      v-else-if="iconRight"
      :is="iconRight"
      class="input-icon input-icon-right"
      :class="{ 'input-icon-error': hasError }"
      v-bind="iconProps"
    />
    
    <!-- 清除按钮 -->
    <button
      v-if="clearable && modelValue && !disabled && !readonly"
      type="button"
      class="input-icon input-icon-right input-clear"
      @click="clearInput"
      title="清除"
    >
      <component :is="clearIcon" v-bind="iconProps" />
    </button>
  </div>
  
  <!-- 错误提示 -->
  <div v-if="errorMessage && hasError" class="input-error-message">{{ errorMessage }}</div>
  
  <!-- 帮助文本 -->
  <div v-if="helperText && !hasError" class="input-helper-text">{{ helperText }}</div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 绑定值
  modelValue: {
    type: [String, Number],
    default: ''
  },
  
  // 输入类型
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text', 'email', 'password', 'number', 'tel', 'url',
      'search', 'date', 'time', 'datetime-local', 'month', 'week'
    ].includes(value)
  },
  
  // 输入框尺寸
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
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
  
  // 正则表达式
  pattern: {
    type: String,
    default: null
  },
  
  // 自动完成
  autocomplete: {
    type: String,
    default: 'on'
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
  
  // 输入模式
  inputmode: {
    type: String,
    default: null
  },
  
  // 数字步长
  step: {
    type: [String, Number],
    default: null
  },
  
  // 最小值
  min: {
    type: [String, Number],
    default: null
  },
  
  // 最大值
  max: {
    type: [String, Number],
    default: null
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
  
  // 左侧图标
  iconLeft: {
    type: [Object, String],
    default: null
  },
  
  // 右侧图标
  iconRight: {
    type: [Object, String],
    default: null
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  },
  
  // 显示密码切换
  showPasswordToggle: {
    type: Boolean,
    default: false
  },
  
  // 显示密码图标
  showPasswordIcon: {
    type: [Object, String],
    default: 'Eye'
  },
  
  // 隐藏密码图标
  hidePasswordIcon: {
    type: [Object, String],
    default: 'EyeOff'
  },
  
  // 清除图标
  clearIcon: {
    type: [Object, String],
    default: 'X'
  },
  
  // 是否可清除
  clearable: {
    type: Boolean,
    default: false
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
const isPasswordVisible = ref(false)

// 计算属性
const hasError = computed(() => {
  return props.error || !!props.errorMessage
})

const wrapperClasses = computed(() => {
  return [
    'input-wrapper',
    `input-wrapper-${props.size}`,
    { 'input-wrapper-focus': focus.value },
    { 'input-wrapper-error': hasError.value },
    { 'input-wrapper-disabled': props.disabled },
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

// 切换密码可见性
const togglePasswordVisibility = () => {
  if (props.disabled || props.readonly) return
  isPasswordVisible.value = !isPasswordVisible.value
}

// 清除输入
const clearInput = () => {
  if (props.disabled || props.readonly) return
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.input-wrapper {
  position: relative;
  display: inline-flex;
  width: 100%;
  transition: all $transition-speed ease;
}

.input-field {

  width: 100%;
  font-size: $font-size-base;
  line-height: $line-height;
  color: $text-color;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
  
  &:focus {

    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: #999;
    opacity: 1;
  }
  
  &::-webkit-input-placeholder {
    color: #999;
  }
  
  &:-moz-placeholder {
    color: #999;
    opacity: 1;
  }
  
  &::-moz-placeholder {
    color: #999;
    opacity: 1;
  }
  
  &:-ms-input-placeholder {
    color: #999;
  }
}

// 尺寸样式
.input-sm {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
}

.input-md {
  font-size: $font-size-base;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
}

.input-lg {
  font-size: $font-size-lg;
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
}

// 禁用状态
.input-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: $gray-100;
}

// 只读状态
.input-readonly {
  background-color: $gray-100;
  cursor: default;
}

// 错误状态
.input-error {
  border-color: $error-color;
  
  &:focus {
    border-color: $error-color;
    box-shadow: 0 0 0 3px rgba($error-color, 0.1);
  }
}

// 聚焦状态
.input-focus {
  border-color: $primary-color;
  box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
}

// 图标样式
.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: $text-secondary;
  transition: all $transition-speed ease;
}

.input-icon-left {
  left: 0;
  margin-left: $spacing-sm;
}

.input-icon-right {
  right: 0;
  margin-right: $spacing-sm;
}

.input-icon-error {
  color: $error-color;
}

// 带图标的输入框
.input-with-icon-left {
  padding-left: $spacing-xl;
}

.input-with-icon-right {
  padding-right: $spacing-xl;
}

// 密码切换按钮
.input-password-toggle {
  pointer-events: auto;
  cursor: pointer;
  background: transparent;
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
    background-color: rgba($gray-200, 0.5);
    color: $primary-color;
  }
}

// 清除按钮
.input-clear {
  pointer-events: auto;
  cursor: pointer;
  background: transparent;
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
    background-color: rgba($gray-200, 0.5);
    color: $error-color;
  }
}

// 错误消息
.input-error-message {
  margin-top: $spacing-xs;
  font-size: $font-size-xs;
  color: $error-color;
  line-height: 1.2;
}

// 帮助文本
.input-helper-text {
  margin-top: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-secondary;
  line-height: 1.2;
}

// 响应式调整
@media (max-width: $breakpoint-sm) {
  .input-field {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
  
  .input-lg {
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-base;
  }
  
  .input-with-icon-left {
    padding-left: $spacing-lg;
  }
  
  .input-with-icon-right {
    padding-right: $spacing-lg;
  }
}
</style>