<template>
  <div class="category-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="返回">
          <component :is="ChevronLeftIcon" />
        </button>
        <h1 class="page-title">分类管理</h1>
      </div>
      <div class="header-right">
        <button @click="addCategory" class="add-btn" :disabled="loading || creating">
          <component :is="PlusIcon" />
          新建分类
        </button>
      </div>
    </div>
    
    <!-- 分类统计信息 -->
    <div class="category-stats" v-if="!loading">
      <div class="stat-card">
        <div class="stat-number">{{ categories.length }}</div>
        <div class="stat-label">总分类数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ activeCategories }}</div>
        <div class="stat-label">使用中</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ totalNotesInCategories }}</div>
        <div class="stat-label">关联笔记</div>
      </div>
    </div>
    
    <!-- 分类列表 -->
    <div class="category-list" v-if="!loading">
      <div v-if="categories.length === 0" class="empty-state">
        <component :is="FolderPlusIcon" class="empty-icon" />
        <p class="empty-text">还没有分类</p>
        <p class="empty-subtext">创建分类来整理你的笔记</p>
        <Button @click="addCategory" class="empty-btn">
          <component :is="PlusIcon" />
          创建第一个分类
        </Button>
      </div>
      
      <List
        v-else
        v-for="category in categories"
        :key="category.id"
        :item="category"
        class="category-item"
        :draggable="true"
        @dragstart="handleDragStart($event, category)"
        @dragenter="handleDragEnter($event, category)"
        @dragover="handleDragOver($event)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, category)"
        @dragend="handleDragEnd"
      >
        <template #left>
          <div class="category-color" :style="{ backgroundColor: category.color }">
            <component :is="TagIcon" class="category-icon" />
          </div>
        </template>
        
        <template #content>
          <div class="category-info">
            <div class="category-name-row">
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ getCategoryNoteCount(category.id) }} 个笔记</span>
            </div>
            <div class="category-meta">
              <span class="category-date">{{ formatDate(category.createdAt) }}</span>
              <span v-if="category.updatedAt !== category.createdAt" class="category-date">
                更新于 {{ formatDate(category.updatedAt) }}
              </span>
            </div>
          </div>
        </template>
        
        <template #right>
          <div class="category-actions">
            <button 
              @click="editCategory(category)"
              class="action-btn edit-btn"
              :disabled="loading || editing"
              title="编辑"
            >
              <component :is="EditIcon" />
            </button>
            <button 
              @click="deleteCategory(category)"
              class="action-btn delete-btn"
              :disabled="loading || deleting"
              title="删除"
            >
              <component :is="Trash2Icon" />
            </button>
          </div>
        </template>
      </List>
    </div>
    
    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <component :is="Loader2Icon" class="loading-icon" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 新建/编辑分类对话框 -->
    <Modal 
      v-model="showCategoryModal"
      :title="isEditing ? '编辑分类' : '新建分类'"
      size="sm"
      :loading="loading || creating || editing"
    >
      <div class="category-form">
        <div class="form-group">
          <label for="category-name" class="form-label">分类名称</label>
          <Input
            id="category-name"
            v-model="formData.name"
            type="text"
            placeholder="请输入分类名称"
            :disabled="loading || creating || editing"
            :error="formErrors.name"
            maxlength="50"
          />
          <div v-if="formErrors.name" class="error-message">{{ formErrors.name }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">选择颜色</label>
          <div class="color-picker">
            <button
              v-for="color in colorOptions"
              :key="color"
              @click="formData.color = color"
              class="color-option"
              :class="{ 'selected': formData.color === color }"
              :style="{ backgroundColor: color }"
              :disabled="loading || creating || editing"
              :title="color"
            >
              <component v-if="formData.color === color" :is="CheckIcon" class="check-icon" />
            </button>
          </div>
        </div>
        
        <div class="form-group" v-if="isEditing">
          <label class="form-label">关联笔记</label>
          <div class="note-count-info">
            <component :is="FileTextIcon" class="info-icon" />
            <span>{{ getCategoryNoteCount(currentCategory?.id || '') }} 个笔记与此分类关联</span>
          </div>
          <div class="warning-message" v-if="getCategoryNoteCount(currentCategory?.id || '') > 0">
            <component :is="AlertTriangleIcon" class="warning-icon" />
            <span>删除此分类不会影响关联的笔记，但这些笔记将不再有此分类标签</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          @click="cancelCategoryAction"
          :disabled="loading || creating || editing"
        >
          取消
        </Button>
        <Button 
          type="primary" 
          @click="confirmCategoryAction"
          :disabled="!isFormValid || loading || creating || editing"
          :loading="creating || editing"
        >
          {{ isEditing ? '保存' : '创建' }}
        </Button>
      </template>
    </Modal>
    
    <!-- 删除确认对话框 -->
    <Modal 
      v-model="showDeleteConfirm"
      title="确认删除"
      size="sm"
    >
      <div class="delete-confirm-content">
        <p v-if="getCategoryNoteCount(deletingCategory?.id || '') > 0" class="warning-text">
          <component :is="AlertTriangleIcon" class="alert-icon" />
          此分类下有 {{ getCategoryNoteCount(deletingCategory?.id || '') }} 个笔记
        </p>
        <p class="confirm-text">确定要删除分类 "{{ deletingCategory?.name }}" 吗？</p>
        <p class="delete-note-hint">删除后不可恢复</p>
      </div>
      <template #footer>
        <Button @click="showDeleteConfirm = false">取消</Button>
        <Button 
          type="danger" 
          @click="confirmDelete"
          :disabled="deleting"
          :loading="deleting"
        >
          确认删除
        </Button>
      </template>
    </Modal>
    
    <!-- 批量操作工具栏 -->
    <div v-if="categories.length > 0" class="batch-actions">
      <div class="batch-info">
        <span>拖动排序</span>
        <span>•</span>
        <span>右键菜单更多操作</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '../stores/note'
import { useUserStore } from '../stores/user'
import List from '../components/List.vue'
import Modal from '../components/Modal.vue'
import Button from '../components/Button.vue'
import Input from '../components/Input.vue'
import {
  ChevronLeft,
  Plus,
  Tag,
  FolderPlus,
  Edit,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  FileText
} from 'lucide-vue-next'

const router = useRouter()
const noteStore = useNoteStore()
const userStore = useUserStore()

// 状态
const loading = ref(true)
const creating = ref(false)
const editing = ref(false)
const deleting = ref(false)
const showCategoryModal = ref(false)
const showDeleteConfirm = ref(false)
const currentCategory = ref(null)
const deletingCategory = ref(null)
const draggedCategory = ref(null)
const dragOverCategory = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  color: '#4F46E5' // 默认颜色
})

// 表单错误
const formErrors = reactive({
  name: ''
})

// 颜色选项
const colorOptions = [
  '#4F46E5', // 靛蓝色
  '#10B981', // 绿色
  '#F59E0B', // 琥珀色
  '#EF4444', // 红色
  '#EC4899', // 粉色
  '#8B5CF6', // 紫色
  '#3B82F6', // 蓝色
  '#14B8A6', // 绿松石色
  '#F97316', // 橙色
  '#84CC16', // 酸橙绿色
  '#64748B', // 石板灰
  '#6366F1'  // 紫色
]

// 计算属性
const categories = computed(() => noteStore.categories)
const activeCategories = computed(() => {
  return categories.value.filter(category => 
    getCategoryNoteCount(category.id) > 0
  ).length
})

const totalNotesInCategories = computed(() => {
  let count = 0
  categories.value.forEach(category => {
    count += getCategoryNoteCount(category.id)
  })
  return count
})

const isEditing = computed(() => !!currentCategory.value)
const isFormValid = computed(() => {
  return formData.name.trim().length > 0 && !formErrors.name
})

// 方法
const loadCategories = async () => {
  loading.value = true
  
  try {
    await noteStore.loadCategories()
    await noteStore.loadNotes() // 加载笔记以计算分类中的笔记数量
  } catch (error) {
    console.error('Failed to load categories:', error)
    if (userStore.toast) {
      userStore.toast.error('加载分类失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const addCategory = () => {
  // 重置表单
  formData.name = ''
  formData.color = '#4F46E5'
  formErrors.name = ''
  currentCategory.value = null
  
  showCategoryModal.value = true
}

const editCategory = (category) => {
  currentCategory.value = category
  formData.name = category.name
  formData.color = category.color
  formErrors.name = ''
  
  showCategoryModal.value = true
}

const deleteCategory = (category) => {
  deletingCategory.value = category
  showDeleteConfirm.value = true
}

const cancelCategoryAction = () => {
  showCategoryModal.value = false
  currentCategory.value = null
  formErrors.name = ''
}

const confirmCategoryAction = async () => {
  // 验证表单
  validateForm()
  if (!isFormValid.value) return
  
  try {
    if (isEditing.value) {
      // 更新分类
      editing.value = true
      await noteStore.updateCategory({
        id: currentCategory.value.id,
        name: formData.name.trim(),
        color: formData.color
      })
      
      if (userStore.toast) {
        userStore.toast.success('分类更新成功')
      }
    } else {
      // 创建分类
      creating.value = true
      await noteStore.createCategory({
        name: formData.name.trim(),
        color: formData.color
      })
      
      if (userStore.toast) {
        userStore.toast.success('分类创建成功')
      }
    }
    
    showCategoryModal.value = false
    currentCategory.value = null
  } catch (error) {
    console.error(isEditing.value ? 'Failed to update category:' : 'Failed to create category:', error)
    if (userStore.toast) {
      userStore.toast.error(isEditing.value ? '更新分类失败，请重试' : '创建分类失败，请重试')
    }
  } finally {
    creating.value = false
    editing.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingCategory.value) return
  
  try {
    deleting.value = true
    await noteStore.deleteCategory(deletingCategory.value.id)
    
    if (userStore.toast) {
      userStore.toast.success('分类删除成功')
    }
    
    showDeleteConfirm.value = false
    deletingCategory.value = null
  } catch (error) {
    console.error('Failed to delete category:', error)
    if (userStore.toast) {
      userStore.toast.error('删除分类失败，请重试')
    }
  } finally {
    deleting.value = false
  }
}

const validateForm = () => {
  formErrors.name = ''
  
  if (!formData.name.trim()) {
    formErrors.name = '请输入分类名称'
  } else if (formData.name.trim().length < 1) {
    formErrors.name = '分类名称不能为空'
  } else if (formData.name.trim().length > 50) {
    formErrors.name = '分类名称不能超过50个字符'
  } else {
    // 检查名称是否已存在
    const existingCategory = categories.value.find(cat => 
      cat.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      (!currentCategory.value || cat.id !== currentCategory.value.id)
    )
    
    if (existingCategory) {
      formErrors.name = '该分类名称已存在'
    }
  }
}

const getCategoryNoteCount = (categoryId) => {
  return noteStore.notes.filter(note => 
    !note.deleted && 
    note.categories.some(cat => cat.id === categoryId)
  ).length
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 拖拽排序相关方法
const handleDragStart = (event, category) => {
  draggedCategory.value = category
  event.dataTransfer.effectAllowed = 'move'
  
  // 添加拖拽时的样式
  setTimeout(() => {
    if (event.target.closest('.category-item')) {
      event.target.closest('.category-item').classList.add('dragging')
    }
  }, 0)
}

const handleDragEnter = (event, category) => {
  event.preventDefault()
  if (draggedCategory.value && draggedCategory.value.id !== category.id) {
    dragOverCategory.value = category
    
    // 添加拖入时的样式
    const target = event.target.closest('.category-item')
    if (target) {
      target.classList.add('drag-over')
    }
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const handleDragLeave = (event) => {
  // 移除拖入时的样式
  const target = event.target.closest('.category-item')
  if (target) {
    target.classList.remove('drag-over')
  }
  
  dragOverCategory.value = null
}

const handleDrop = async (event, targetCategory) => {
  event.preventDefault()
  
  // 移除所有拖拽相关样式
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('dragging', 'drag-over')
  })
  
  if (!draggedCategory.value || draggedCategory.value.id === targetCategory.id) {
    draggedCategory.value = null
    dragOverCategory.value = null
    return
  }
  
  try {
    // 获取当前分类列表
    const currentCategories = [...categories.value]
    
    // 找到拖拽项和目标项的索引
    const draggedIndex = currentCategories.findIndex(cat => cat.id === draggedCategory.value.id)
    const targetIndex = currentCategories.findIndex(cat => cat.id === targetCategory.id)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // 从数组中移除拖拽项
      const [removed] = currentCategories.splice(draggedIndex, 1)
      
      // 在目标位置插入拖拽项
      currentCategories.splice(targetIndex, 0, removed)
      
      // 更新排序
      await noteStore.updateCategoriesOrder(currentCategories)
      
      if (userStore.toast) {
        userStore.toast.success('分类排序已更新')
      }
    }
  } catch (error) {
    console.error('Failed to update categories order:', error)
    if (userStore.toast) {
      userStore.toast.error('更新排序失败，请重试')
    }
  } finally {
    draggedCategory.value = null
    dragOverCategory.value = null
  }
}

const handleDragEnd = () => {
  // 移除所有拖拽相关样式
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('dragging', 'drag-over')
  })
  
  draggedCategory.value = null
  dragOverCategory.value = null
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.category-container {
  padding: $spacing-lg;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// 页面标题
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.back-btn {
  padding: $spacing-sm;
  background: none;
  border: none;
  border-radius: $border-radius-lg;
  cursor: pointer;
  color: $text-color;
  transition: all $transition-speed ease;
  flex-shrink: 0;
  
  &:hover {
    background-color: $gray-50;
    color: $primary-color;
  }
}

.page-title {
  font-size: 2rem;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background-color: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-weight: $font-weight-medium;
  
  &:hover:not(:disabled) {
    background-color: $primary-dark;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

// 分类统计信息
.category-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.stat-card {
  padding: $spacing-lg;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
  text-align: center;
  transition: all $transition-speed ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-sm;
  }
}

.stat-number {
  font-size: 2.5rem;
  font-weight: $font-weight-bold;
  color: $primary-color;
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: $font-size-base;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

// 分类列表
.category-list {
  flex: 1;
  margin-bottom: $spacing-xl;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: $spacing-xl;
  text-align: center;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
  border: 2px dashed $border-color;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.empty-text {
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin: 0 0 $spacing-sm 0;
}

.empty-subtext {
  font-size: $font-size-base;
  color: $text-secondary;
  margin: 0 0 $spacing-xl 0;
}

.empty-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-xl;
  background-color: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  
  &:hover {
    background-color: $primary-dark;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
}

// 分类项样式
.category-item {
  padding: $spacing-md;
  border-radius: $border-radius-lg;
  transition: all $transition-speed ease;
  position: relative;
  cursor: move;
  
  &:hover {
    background-color: $gray-50;
  }
  
  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  
  &.drag-over {
    background-color: rgba($primary-color, 0.1);
    border: 1px dashed $primary-color;
  }
}

.category-color {
  width: 40px;
  height: 40px;
  border-radius: $border-radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $white;
  flex-shrink: 0;
}

.category-icon {
  width: 20px;
  height: 20px;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-xs;
}

.category-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-right: $spacing-md;
}

.category-count {
  font-size: $font-size-sm;
  color: $text-secondary;
  flex-shrink: 0;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.category-date {
  font-size: $font-size-xs;
  color: $text-secondary;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  opacity: 0;
  transition: opacity $transition-speed ease;
}

.category-item:hover .category-actions {
  opacity: 1;
}

.action-btn {
  padding: $spacing-xs;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all $transition-speed ease;
  color: $text-secondary;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background-color: $gray-100;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.edit-btn:hover:not(:disabled) {
  color: $primary-color;
}

.delete-btn:hover:not(:disabled) {
  color: $danger-color;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-icon {
  width: 48px;
  height: 48px;
  color: $primary-color;
  animation: spin $transition-slow linear infinite;
  margin-bottom: $spacing-lg;
}

.loading-text {
  font-size: $font-size-base;
  color: $text-secondary;
}

// 表单样式
.category-form {
  margin-bottom: $spacing-lg;
}

.form-group {
  margin-bottom: $spacing-lg;
}

.form-label {
  display: block;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: $spacing-sm;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: $spacing-sm;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: $border-radius-full;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all $transition-speed ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.selected {
    border-color: $text-color;
    transform: scale(1.1);
  }
}

.check-icon {
  width: 16px;
  height: 16px;
  color: $white;
  stroke-width: 3;
}

.note-count-info,
.warning-message {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: 8px;
  font-size: $font-size-sm;
}

.note-count-info {
  background-color: $gray-50;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.warning-message {
  background-color: rgba($warning-color, 0.1);
  color: $warning-color;
  border-left: 4px solid $warning-color;
}

.info-icon,
.warning-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.error-message {
  font-size: $font-size-sm;
  color: $danger-color;
  margin-top: $spacing-xs;
}

// 删除确认对话框
.delete-confirm-content {
  margin-bottom: $spacing-lg;
}

.warning-text {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: rgba($warning-color, 0.1);
  border-radius: 8px;
  color: $warning-color;
  margin-bottom: $spacing-md;
  font-size: $font-size-sm;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.confirm-text {
  font-size: $font-size-base;
  color: $text-color;
  font-weight: $font-weight-medium;
  margin-bottom: $spacing-sm;
}

.delete-note-hint {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 批量操作工具栏
.batch-actions {
  display: flex;
  justify-content: center;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  margin-top: auto;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: $breakpoint-md) {
  .category-container {
    padding: $spacing-md;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-lg;
  }
  
  .header-left {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .page-title {
    font-size: 1.8rem;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .category-stats {
    grid-template-columns: 1fr;
  }
  
  .category-name-row {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
  
  .category-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
  
  .category-actions {
    opacity: 1;
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
  }
  
  .batch-info {
    flex-direction: column;
    gap: $spacing-xs;
    text-align: center;
  }
}

@media (max-width: $breakpoint-sm) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .empty-state {
    padding: $spacing-xl;
  }
  
  .empty-icon {
    width: 48px;
    height: 48px;
  }
  
  .empty-text {
    font-size: $font-size-lg;
  }
  
  .color-picker {
    grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
  }
  
  .color-option {
    width: 35px;
    height: 35px;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .back-btn:hover {
    background-color: $gray-800;
  }
  
  .stat-card,
  .empty-state,
  .note-count-info {
    background-color: $gray-800;
  }
  
  .category-item:hover {
    background-color: $gray-800;
  }
  
  .category-item.drag-over {
    background-color: rgba($primary-color, 0.2);
  }
  
  .action-btn:hover:not(:disabled) {
    background-color: $gray-700;
  }
  
  .warning-message {
    background-color: rgba($warning-color, 0.2);
  }
}
</style>