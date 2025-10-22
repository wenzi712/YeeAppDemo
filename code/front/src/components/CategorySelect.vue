<template>
  <div class="category-select" :class="{ 'is-disabled': disabled, 'is-invalid': invalid }">
    <div 
      class="category-select-trigger"
      @click="toggleDropdown"
      :class="{ 'is-focused': isFocused, 'is-active': isOpen }"
      :disabled="disabled"
      ref="trigger"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :id="`category-select-${id}`"
    >
      <!-- 当前选中的分类 -->
      <div v-if="selectedCategories.length > 0" class="category-select-selected">
        <div 
          v-for="(category, index) in displayCategories" 
          :key="category.id || index"
          class="category-tag"
          :style="{
            backgroundColor: category.color || $props.color,
            borderColor: category.color || $props.color
          }"
        >
          <span class="category-tag-text">{{ category.name }}</span>
          <button 
            v-if="!disabled && !readonly" 
            type="button" 
            class="category-tag-remove"
            @click.stop="removeCategory(category)"
            aria-label="Remove category"
          >
            <component :is="closeIcon" v-bind="iconProps" />
          </button>
        </div>
        <div v-if="selectedCategories.length > maxDisplayTags" class="category-select-more">
          +{{ selectedCategories.length - maxDisplayTags }}
        </div>
      </div>
      <div v-else class="category-select-placeholder">
        {{ placeholder }}
      </div>
      
      <!-- 下拉图标 -->
      <component 
        :is="arrowIcon" 
        class="category-select-arrow"
        :class="{ 'is-rotated': isOpen }"
        v-bind="iconProps"
      />
    </div>
    
    <!-- 下拉菜单 -->
    <transition name="dropdown">
      <div 
        v-if="isOpen" 
        class="category-select-dropdown"
        :class="{
          'is-searchable': searchable,
          'is-multi': multiple,
          'is-paginated': paginated,
          'is-loading': loading
        }"
        :style="dropdownStyle"
        ref="dropdown"
        role="listbox"
        :aria-labelledby="`category-select-${id}`"
      >
        <!-- 搜索框 -->
        <div v-if="searchable" class="category-select-search">
          <component :is="searchIcon" class="category-select-search-icon" v-bind="iconProps" />
          <input
            type="text"
            class="category-select-search-input"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            @input="handleSearch"
            @keydown="handleSearchKeydown"
            ref="searchInput"
            :disabled="disabled || loading"
            autocomplete="off"
          />
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="category-select-loading">
          <component :is="loadingIcon" class="category-select-loading-icon" v-bind="iconProps" />
          <span>{{ loadingText }}</span>
        </div>
        
        <!-- 分类列表 -->
        <div v-else-if="filteredCategories.length > 0" class="category-select-list">
          <div 
            v-for="category in displayCategoriesList" 
            :key="category.id || category.name"
            class="category-select-item"
            :class="{
              'is-selected': isSelected(category),
              'is-disabled': category.disabled || disabled || readonly,
              'is-hovered': isHovered === category.id || isHovered === category.name
            }"
            @click="selectCategory(category)"
            @mouseenter="isHovered = category.id || category.name"
            @mouseleave="isHovered = null"
            role="option"
            :aria-selected="isSelected(category)"
            :id="`category-select-option-${category.id || category.name}`"
          >
            <!-- 多选框 -->
            <div v-if="multiple" class="category-select-checkbox">
              <div 
                class="category-select-checkbox-inner"
                :class="{ 'is-checked': isSelected(category) }"
              >
                <component 
                  v-if="isSelected(category)" 
                  :is="checkIcon" 
                  v-bind="iconProps"
                />
              </div>
            </div>
            
            <!-- 单选指示器 -->
            <div v-else class="category-select-radio">
              <div 
                class="category-select-radio-inner"
                :class="{ 'is-checked': isSelected(category) }"
              ></div>
            </div>
            
            <!-- 分类信息 -->
            <div class="category-select-item-content">
              <div 
                v-if="category.color" 
                class="category-select-item-color"
                :style="{ backgroundColor: category.color }"
              ></div>
              <span class="category-select-item-name">{{ category.name }}</span>
              <span v-if="category.noteCount" class="category-select-item-count">
                ({{ category.noteCount }})
              </span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="category-select-empty">
          <component :is="emptyIcon" class="category-select-empty-icon" v-bind="iconProps" />
          <span>{{ searchQuery ? searchEmptyText : emptyText }}</span>
        </div>
        
        <!-- 分页 -->
        <div v-if="paginated && filteredCategories.length > 0 && !loading" class="category-select-pagination">
          <button 
            type="button" 
            class="category-select-pagination-btn"
            :class="{ 'is-disabled': currentPage === 1 }"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1 || disabled || loading"
          >
            <component :is="prevIcon" v-bind="iconProps" />
          </button>
          <span class="category-select-pagination-info">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button 
            type="button" 
            class="category-select-pagination-btn"
            :class="{ 'is-disabled': currentPage === totalPages }"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages || disabled || loading"
          >
            <component :is="nextIcon" v-bind="iconProps" />
          </button>
        </div>
        
        <!-- 创建新分类按钮 -->
        <div v-if="allowCreate && searchQuery && !isExistingCategory(searchQuery) && !disabled && !readonly" 
             class="category-select-create">
          <button 
            type="button" 
            class="category-select-create-btn"
            @click="createCategory(searchQuery)"
            :disabled="loading"
          >
            <component :is="createIcon" class="category-select-create-icon" v-bind="iconProps" />
            {{ createText }} "{{ searchQuery }}"
          </button>
        </div>
      </div>
    </transition>
    
    <!-- 错误信息 -->
    <div v-if="errorMessage" class="category-select-error">
      {{ errorMessage }}
    </div>
    
    <!-- 帮助信息 -->
    <div v-if="helpMessage" class="category-select-help">
      {{ helpMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useNoteStore } from '../stores/note'

const props = defineProps({
  // 绑定值
  modelValue: {
    type: [Object, Array],
    default: () => ([]) // 默认空数组
  },
  
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  
  // 可选项列表
  categories: {
    type: Array,
    default: () => ([])
  },
  
  // 占位符
  placeholder: {
    type: String,
    default: '选择分类'
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
  
  // 是否可搜索
  searchable: {
    type: Boolean,
    default: true
  },
  
  // 搜索占位符
  searchPlaceholder: {
    type: String,
    default: '搜索分类...'
  },
  
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  
  // 加载文本
  loadingText: {
    type: String,
    default: '加载中...'
  },
  
  // 空状态文本
  emptyText: {
    type: String,
    default: '暂无分类'
  },
  
  // 搜索空状态文本
  searchEmptyText: {
    type: String,
    default: '未找到分类'
  },
  
  // 错误信息
  errorMessage: {
    type: String,
    default: ''
  },
  
  // 帮助信息
  helpMessage: {
    type: String,
    default: ''
  },
  
  // 是否显示边框
  bordered: {
    type: Boolean,
    default: true
  },
  
  // 是否可清除
  clearable: {
    type: Boolean,
    default: true
  },
  
  // 是否分页
  paginated: {
    type: Boolean,
    default: false
  },
  
  // 每页数量
  pageSize: {
    type: Number,
    default: 20
  },
  
  // 是否允许创建新分类
  allowCreate: {
    type: Boolean,
    default: true
  },
  
  // 创建文本
  createText: {
    type: String,
    default: '创建'
  },
  
  // 最大显示标签数
  maxDisplayTags: {
    type: Number,
    default: 3
  },
  
  // 自定义ID
  id: {
    type: String,
    default: `category-select-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // 默认颜色
  color: {
    type: String,
    default: '#4F46E5' // 默认使用主色
  },
  
  // 是否显示验证状态
  invalid: {
    type: Boolean,
    default: false
  },
  
  // 图标配置
  arrowIcon: {
    type: [Object, String],
    default: 'ChevronDown'
  },
  
  closeIcon: {
    type: [Object, String],
    default: 'X'
  },
  
  searchIcon: {
    type: [Object, String],
    default: 'Search'
  },
  
  loadingIcon: {
    type: [Object, String],
    default: 'Loader2'
  },
  
  emptyIcon: {
    type: [Object, String],
    default: 'AlertCircle'
  },
  
  checkIcon: {
    type: [Object, String],
    default: 'Check'
  },
  
  createIcon: {
    type: [Object, String],
    default: 'PlusCircle'
  },
  
  prevIcon: {
    type: [Object, String],
    default: 'ChevronLeft'
  },
  
  nextIcon: {
    type: [Object, String],
    default: 'ChevronRight'
  },
  
  // 图标属性
  iconProps: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'select',
  'remove',
  'search',
  'create',
  'toggle',
  'focus',
  'blur',
  'page-change'
])

const noteStore = useNoteStore()

// 响应式数据
const isOpen = ref(false)
const isFocused = ref(false)
const isHovered = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const trigger = ref(null)
const dropdown = ref(null)
const searchInput = ref(null)

// 计算属性
const selectedCategories = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  } else {
    return props.modelValue ? [props.modelValue] : []
  }
})

const displayCategories = computed(() => {
  return selectedCategories.value.slice(0, props.maxDisplayTags)
})

const filteredCategories = computed(() => {
  if (!props.categories || !Array.isArray(props.categories)) return []
  
  let categories = props.categories
  
  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    categories = categories.filter(category => 
      category.name.toLowerCase().includes(query)
    )
  }
  
  return categories
})

const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.ceil(filteredCategories.value.length / props.pageSize)
})

const displayCategoriesList = computed(() => {
  if (!props.paginated) return filteredCategories.value
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredCategories.value.slice(start, end)
})

const dropdownStyle = computed(() => {
  if (!trigger.value) return {}
  
  const rect = trigger.value.getBoundingClientRect()
  const style = {
    minWidth: `${rect.width}px`
  }
  
  return style
})

// 方法
const toggleDropdown = async () => {
  if (props.disabled || props.readonly) return
  
  isOpen.value = !isOpen.value
  
  if (isOpen.value) {
    // 打开下拉菜单
    await nextTick()
    
    // 聚焦搜索框
    if (props.searchable && searchInput.value) {
      searchInput.value.focus()
    }
    
    // 监听外部点击
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
    
    emit('toggle', true)
  } else {
    // 关闭下拉菜单
    closeDropdown()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  isHovered.value = null
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  emit('toggle', false)
}

const isSelected = (category) => {
  if (!category) return false
  
  return selectedCategories.value.some(item => {
    if (item.id && category.id) {
      return item.id === category.id
    }
    return item.name === category.name
  })
}

const selectCategory = (category) => {
  if (props.disabled || props.readonly || category.disabled) return
  
  let newSelection
  
  if (props.multiple) {
    // 多选模式
    if (isSelected(category)) {
      // 移除选中
      newSelection = selectedCategories.value.filter(item => {
        if (item.id && category.id) {
          return item.id !== category.id
        }
        return item.name !== category.name
      })
      emit('remove', category)
    } else {
      // 添加选中
      newSelection = [...selectedCategories.value, category]
      emit('select', category)
    }
  } else {
    // 单选模式
    if (!isSelected(category)) {
      newSelection = category
      emit('select', category)
    } else {
      // 单选时再次点击取消选择
      newSelection = null
      emit('remove', category)
    }
    closeDropdown() // 单选模式下选中后关闭
  }
  
  emit('update:modelValue', newSelection)
  emit('change', newSelection)
}

const removeCategory = (category) => {
  if (props.disabled || props.readonly) return
  
  let newSelection
  
  if (props.multiple) {
    newSelection = selectedCategories.value.filter(item => {
      if (item.id && category.id) {
        return item.id !== category.id
      }
      return item.name !== category.name
    })
  } else {
    newSelection = null
  }
  
  emit('update:modelValue', newSelection)
  emit('remove', category)
  emit('change', newSelection)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
  currentPage.value = 1 // 搜索时重置到第一页
}

const handleSearchKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    
    // 如果搜索结果只有一项，自动选中
    if (filteredCategories.value.length === 1 && !isSelected(filteredCategories.value[0])) {
      selectCategory(filteredCategories.value[0])
    } else if (props.allowCreate && searchQuery.value && !isExistingCategory(searchQuery.value)) {
      // 如果允许创建，并且没有匹配项，创建新分类
      createCategory(searchQuery.value)
    }
  } else if (event.key === 'Escape') {
    closeDropdown()
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    navigateOptions(event.key === 'ArrowDown')
  }
}

const navigateOptions = (forward) => {
  const items = displayCategoriesList.value.filter(item => !item.disabled)
  if (items.length === 0) return
  
  let currentIndex = -1
  if (isHovered.value) {
    currentIndex = items.findIndex(item => item.id === isHovered.value || item.name === isHovered.value)
  }
  
  if (forward) {
    currentIndex = (currentIndex + 1) % items.length
  } else {
    currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1
  }
  
  isHovered.value = items[currentIndex].id || items[currentIndex].name
  
  // 滚动到可见区域
  const element = document.getElementById(`category-select-option-${isHovered.value}`)
  if (element && dropdown.value) {
    dropdown.value.scrollTop = Math.max(0, element.offsetTop - 100)
  }
}

const handleClickOutside = (event) => {
  if (trigger.value && !trigger.value.contains(event.target) && 
      dropdown.value && !dropdown.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
    if (trigger.value) {
      trigger.value.focus()
    }
  }
}

const isExistingCategory = (name) => {
  if (!props.categories || !Array.isArray(props.categories)) return false
  
  name = name.trim()
  return props.categories.some(category => 
    category.name.toLowerCase() === name.toLowerCase()
  )
}

const createCategory = async (name) => {
  name = name.trim()
  if (!name || isExistingCategory(name)) return
  
  const newCategory = {
    name,
    color: generateRandomColor(),
    id: `new-${Date.now()}`
  }
  
  emit('create', newCategory)
  
  // 自动选中新创建的分类
  setTimeout(() => {
    selectCategory(newCategory)
    searchQuery.value = ''
  }, 0)
}

const generateRandomColor = () => {
  const colors = [
    '#4F46E5', '#EC4899', '#10B981', '#F59E0B', 
    '#EF4444', '#3B82F6', '#8B5CF6', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('page-change', page)
    
    // 滚动到顶部
    if (dropdown.value) {
      dropdown.value.scrollTop = 0
    }
  }
}

// 监听分类变化
watch(() => props.categories, () => {
  if (props.paginated) {
    currentPage.value = 1
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  if (trigger.value) {
    trigger.value.addEventListener('focus', () => {
      isFocused.value = true
      emit('focus')
    })
    
    trigger.value.addEventListener('blur', () => {
      isFocused.value = false
      emit('blur')
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  
  if (trigger.value) {
    trigger.value.removeEventListener('focus', () => {
      isFocused.value = true
    })
    
    trigger.value.removeEventListener('blur', () => {
      isFocused.value = false
    })
  }
})

// 暴露方法
defineExpose({
  open: () => {
    if (!isOpen.value) {
      toggleDropdown()
    }
  },
  close: closeDropdown,
  toggle: toggleDropdown,
  clear: () => {
    emit('update:modelValue', props.multiple ? [] : null)
    emit('change', props.multiple ? [] : null)
  }
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.category-select {
  position: relative;
  display: inline-block;
  width: 100%;
  font-size: $font-size-base;
}

.category-select.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.category-select.is-invalid {
  .category-select-trigger {
    border-color: $danger-color;
    box-shadow: 0 0 0 3px rgba($danger-color, 0.1);
  }
}

// 触发区域
.category-select-trigger {

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  min-height: 40px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(.is-disabled) {
    border-color: $primary-color;
  }
  
  &.is-focused {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &.is-active {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &:disabled {
    background-color: $gray-100;
    cursor: not-allowed;
  }
}

// 选中的分类显示
.category-select-selected {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-xs;
  flex: 1;
  overflow: hidden;
}

.category-tag {

  display: inline-flex;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background-color: $primary-color;
  color: $white;
  border: 1px solid $primary-color;
  border-radius: $border-radius-full;
  font-size: $font-size-sm;
  transition: all $transition-speed ease;
}

.category-tag-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: $spacing-xs;
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: rgba($white, 0.2);
  }
}

.category-select-more {
  color: $text-secondary;
  font-size: $font-size-sm;
}

.category-select-placeholder {
  color: #999;
  flex: 1;
}

.category-select-arrow {
  color: $text-secondary;
  transition: transform $transition-speed ease;
  flex-shrink: 0;
  margin-left: $spacing-sm;
}

.category-select-arrow.is-rotated {
  transform: rotate(180deg);
}

// 下拉菜单
.category-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: $spacing-xs;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  box-shadow: $shadow-md;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

// 搜索框
.category-select-search {
  display: flex;
  align-items: center;
  padding: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.category-select-search-icon {
  color: $text-secondary;
  margin-right: $spacing-sm;
  flex-shrink: 0;
}

.category-select-search-input {

  flex: 1;
  border: none;
  padding: $spacing-xs 0;
  outline: none;
  background: transparent;
  
  &::placeholder {
    color: #999;
  }
}

// 加载状态
.category-select-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  color: $text-secondary;
}

.category-select-loading-icon {
  margin-right: $spacing-sm;
  animation: spin $transition-slow linear infinite;
}

// 分类列表
.category-select-list {
  max-height: 250px;
  overflow-y: auto;
}

.category-select-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: all $transition-speed ease;
  border-bottom: 1px solid $gray-100;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover:not(.is-disabled) {
    background-color: $gray-50;
  }
  
  &.is-selected {
    background-color: rgba($primary-color, 0.05);
    color: $primary-color;
  }
  
  &.is-disabled {
    color: #999;
    cursor: not-allowed;
  }
}

// 多选框
.category-select-checkbox {
  margin-right: $spacing-sm;
  flex-shrink: 0;
}

.category-select-checkbox-inner {
  width: 18px;
  height: 18px;
  border: 2px solid $border-color;
  border-radius: $border-radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-speed ease;
  
  &.is-checked {
    background-color: $primary-color;
    border-color: $primary-color;
    color: $white;
  }
}

// 单选指示器
.category-select-radio {
  margin-right: $spacing-sm;
  flex-shrink: 0;
}

.category-select-radio-inner {
  width: 18px;
  height: 18px;
  border: 2px solid $border-color;
  border-radius: 50%;
  position: relative;
  transition: all $transition-speed ease;
  
  &.is-checked {
    border-color: $primary-color;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background-color: $primary-color;
      border-radius: 50%;
    }
  }
}

// 分类信息
.category-select-item-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.category-select-item-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: $spacing-sm;
  flex-shrink: 0;
}

.category-select-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-select-item-count {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin-left: $spacing-sm;
}

// 空状态
.category-select-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  color: $text-secondary;
  flex-direction: column;
  gap: $spacing-sm;
}

.category-select-empty-icon {
  color: #999;
  font-size: $font-size-xl;
}

// 分页
.category-select-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm;
  border-top: 1px solid $border-color;
  gap: $spacing-sm;
}

.category-select-pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid $border-color;
  background-color: $white;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover:not(.is-disabled) {
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.category-select-pagination-info {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 创建新分类
.category-select-create {
  border-top: 1px solid $border-color;
  padding: $spacing-sm;
}

.category-select-create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: $spacing-sm;
  border: 1px dashed $border-color;
  background-color: transparent;
  color: $primary-color;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-weight: $font-weight-medium;
  
  &:hover {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
}

.category-select-create-icon {
  margin-right: $spacing-sm;
}

// 错误和帮助信息
.category-select-error {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $danger-color;
}

.category-select-help {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 下拉动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all $transition-speed ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// 响应式
@media (max-width: $breakpoint-sm) {
  .category-select-trigger {
    padding: $spacing-sm;
  }
  
  .category-select-dropdown {
    left: -$spacing-sm;
    right: -$spacing-sm;
    margin-top: $spacing-xs;
    max-height: 250px;
  }
}
</style>