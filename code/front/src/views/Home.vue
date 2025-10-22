<template>
  <div class="home-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="page-title">我的笔记</h1>
      </div>
      <div class="toolbar-right">
        <button 
          @click="refreshNotes" 
          class="toolbar-btn"
          :disabled="loading"
          title="刷新"
        >
          <component :is="RefreshCwIcon" :class="{ 'animate-spin': loading }" />
        </button>
        <button 
          @click="createNewNote" 
          class="toolbar-btn primary"
          title="新建笔记"
        >
          <component :is="PlusIcon" />
          <span>新建</span>
        </button>
      </div>
    </div>
    
    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="search-wrapper">
        <component :is="SearchIcon" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索笔记..."
          class="search-input"
          @input="handleSearch"
        />
        <button 
          v-if="searchQuery" 
          @click="clearSearch" 
          class="clear-search-btn"
          title="清空搜索"
        >
          <component :is="XIcon" />
        </button>
      </div>
      
      <div class="filter-buttons">
        <button 
          v-for="filter in filterOptions" 
          :key="filter.value"
          @click="setFilter(filter.value)"
          :class="['filter-btn', { active: currentFilter === filter.value }]"
        >
          <component :is="filter.icon" />
          <span>{{ filter.label }}</span>
        </button>
      </div>
    </div>
    
    <!-- 分类筛选下拉框 -->
    <div class="category-filter" v-if="categories.length > 0">
      <select v-model="selectedCategory" @change="filterByCategory" class="category-select">
        <option value="">全部分类</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <span class="category-count">{{ filteredNotes.length }} 条笔记</span>
    </div>
    
    <!-- 笔记列表 -->
    <div class="notes-list" v-if="!loading">
      <template v-if="filteredNotes.length > 0">
        <List
          v-for="note in paginatedNotes"
          :key="note.id"
          :item="note"
          :active="activeNoteId === note.id"
          @click="viewNote(note)"
          @context-menu="showContextMenu"
          class="note-item"
        >
          <!-- 笔记项内容 -->
          <template #content>
            <div class="note-content">
              <h3 class="note-title">{{ note.title || '无标题' }}</h3>
              <p class="note-preview">{{ getNotePreview(note.content) }}</p>
            </div>
            <div class="note-meta">
              <div class="note-categories">
                <span 
                  v-for="category in note.categories" 
                  :key="category.id"
                  class="category-badge"
                >
                  {{ category.name }}
                </span>
              </div>
              <div class="note-date">
                {{ formatDate(note.updatedAt) }}
              </div>
            </div>
          </template>
          
          <!-- 操作按钮 -->
          <template #actions>
            <div class="note-actions">
              <button 
                @click.stop="editNote(note)" 
                class="action-btn"
                title="编辑"
              >
                <component :is="EditIcon" />
              </button>
              <button 
                @click.stop="deleteNote(note)" 
                class="action-btn danger"
                title="删除"
              >
                <component :is="Trash2Icon" />
              </button>
            </div>
          </template>
        </List>
      </template>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <component :is="ClipboardListIcon" class="empty-icon" />
        <h3 class="empty-title">
          {{ searchQuery ? '没有找到匹配的笔记' : '暂无笔记' }}
        </h3>
        <p class="empty-message">
          {{ searchQuery ? '试试其他关键词' : '点击右上角的"新建"按钮开始创建你的第一条笔记' }}
        </p>
        <button 
          v-if="!searchQuery" 
          @click="createNewNote" 
          class="create-first-btn"
        >
          <component :is="PlusIcon" />
          创建第一条笔记
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <component :is="Loader2Icon" class="loading-icon" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 分页 -->
    <div v-if="filteredNotes.length > 0 && !loading" class="pagination">
      <button 
        @click="prevPage" 
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        <component :is="ChevronLeftIcon" />
        上一页
      </button>
      <span class="pagination-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        下一页
        <component :is="ChevronRightIcon" />
      </button>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenuVisible" 
      :style="contextMenuStyle" 
      class="context-menu"
    >
      <button @click="viewNote(selectedNote)" class="context-menu-item">
        <component :is="EyeIcon" />
        查看
      </button>
      <button @click="editNote(selectedNote)" class="context-menu-item">
        <component :is="EditIcon" />
        编辑
      </button>
      <button @click="duplicateNote(selectedNote)" class="context-menu-item">
        <component :is="CopyIcon" />
        复制
      </button>
      <div class="context-menu-divider"></div>
      <button @click="deleteNote(selectedNote)" class="context-menu-item danger">
        <component :is="Trash2Icon" />
        删除
      </button>
    </div>
    
    <!-- 删除确认对话框 -->
    <Modal 
      v-model="showDeleteConfirm"
      title="确认删除"
      size="sm"
    >
      <div class="delete-confirm-content">
        <p>确定要删除这篇笔记吗？此操作不可撤销。</p>
      </div>
      <template #footer>
        <Button @click="showDeleteConfirm = false">取消</Button>
        <Button type="danger" @click="confirmDelete">确认删除</Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '../stores/note'
import { useUserStore } from '../stores/user'
import List from '../components/List.vue'
import Modal from '../components/Modal.vue'
import Button from '../components/Button.vue'
import {
  Search,
  X,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  Calendar,
  Clock,
  Star
} from 'lucide-vue-next'

const router = useRouter()
const noteStore = useNoteStore()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const searchQuery = ref('')
const currentFilter = ref('all') // all, recent, starred, deleted
const selectedCategory = ref('')
const activeNoteId = ref('')
const contextMenuVisible = ref(false)
const contextMenuStyle = ref({})
const selectedNote = ref(null)
const showDeleteConfirm = ref(false)

// 分页
const currentPage = ref(1)
const notesPerPage = ref(20)

// 筛选选项
const filterOptions = [
  { value: 'all', label: '全部', icon: ClipboardList },
  { value: 'recent', label: '最近', icon: Clock },
  { value: 'starred', label: '收藏', icon: Star },
  { value: 'deleted', label: '已删除', icon: Trash2 }
]

// 计算属性
const notes = computed(() => noteStore.notes)
const categories = computed(() => noteStore.categories)

// 筛选后的笔记
const filteredNotes = computed(() => {
  let result = [...notes.value]
  
  // 按筛选条件过滤
  if (currentFilter.value === 'recent') {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    result = result.filter(note => new Date(note.updatedAt) >= threeDaysAgo)
  } else if (currentFilter.value === 'starred') {
    result = result.filter(note => note.starred)
  } else if (currentFilter.value === 'deleted') {
    result = result.filter(note => note.deleted)
  } else {
    // 全部笔记，但排除已删除的
    result = result.filter(note => !note.deleted)
  }
  
  // 按分类过滤
  if (selectedCategory.value) {
    result = result.filter(note => 
      note.categories.some(cat => cat.id === selectedCategory.value)
    )
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(note => 
      (note.title && note.title.toLowerCase().includes(query)) ||
      (note.content && note.content.toLowerCase().includes(query))
    )
  }
  
  // 排序
  result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  
  return result
})

// 分页后的笔记
const paginatedNotes = computed(() => {
  const start = (currentPage.value - 1) * notesPerPage.value
  const end = start + notesPerPage.value
  return filteredNotes.value.slice(start, end)
})

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredNotes.value.length / notesPerPage.value)
})

// 方法
const loadNotes = async () => {
  loading.value = true
  try {
    await noteStore.fetchNotes()
  } catch (error) {
    console.error('Failed to load notes:', error)
    if (userStore.toast) {
      userStore.toast.error('加载笔记失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const refreshNotes = () => {
  currentPage.value = 1
  loadNotes()
}

const handleSearch = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const setFilter = (filter) => {
  currentFilter.value = filter
  selectedCategory.value = ''
  currentPage.value = 1
}

const filterByCategory = () => {
  currentPage.value = 1
}

const createNewNote = () => {
  router.push('/note/new')
}

const viewNote = (note) => {
  if (!note.deleted) {
    router.push(`/note/${note.id}`)
  }
  hideContextMenu()
}

const editNote = (note) => {
  if (!note.deleted) {
    router.push(`/note/${note.id}/edit`)
  }
  hideContextMenu()
}

const duplicateNote = async (note) => {
  hideContextMenu()
  
  try {
    await noteStore.duplicateNote(note.id)
    if (userStore.toast) {
      userStore.toast.success('笔记复制成功')
    }
  } catch (error) {
    console.error('Failed to duplicate note:', error)
    if (userStore.toast) {
      userStore.toast.error('复制笔记失败，请重试')
    }
  }
}

const deleteNote = (note) => {
  selectedNote.value = note
  showDeleteConfirm.value = true
  hideContextMenu()
}

const confirmDelete = async () => {
  if (!selectedNote.value) return
  
  try {
    await noteStore.deleteNote(selectedNote.value.id)
    showDeleteConfirm.value = false
    
    if (userStore.toast) {
      userStore.toast.success('笔记已删除')
    }
  } catch (error) {
    console.error('Failed to delete note:', error)
    if (userStore.toast) {
      userStore.toast.error('删除笔记失败，请重试')
    }
  }
}

const showContextMenu = (event, note) => {
  event.preventDefault()
  selectedNote.value = note
  
  contextMenuStyle.value = {
    top: `${event.clientY}px`,
    left: `${event.clientX}px`
  }
  
  contextMenuVisible.value = true
}

const hideContextMenu = () => {
  contextMenuVisible.value = false
  selectedNote.value = null
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const getNotePreview = (content) => {
  if (!content) return ''
  // 移除Markdown格式并截取前100个字符
  const plainText = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ')
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 事件监听
const handleClickOutside = (event) => {
  if (contextMenuVisible.value && !event.target.closest('.context-menu')) {
    hideContextMenu()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    hideContextMenu()
  }
}

// 生命周期
onMounted(() => {
  // 加载笔记
  loadNotes()
  
  // 添加事件监听
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.home-container {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

// 顶部工具栏
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-color;
}

.page-title {
  font-size: 2rem;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  background-color: $white;
  color: $text-color;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-sm;
  
  &:hover:not(:disabled) {
    background-color: $gray-50;
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background-color: $primary-color;
    color: $white;
    border-color: $primary-color;
    
    &:hover:not(:disabled) {
      background-color: $primary-dark;
      border-color: $primary-dark;
    }
  }
}

// 筛选和搜索
.filter-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: $spacing-md;
  color: $text-secondary;
  z-index: 1;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: $spacing-md $spacing-xl $spacing-md $spacing-xl;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  font-size: $font-size-base;
  transition: all $transition-speed ease;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &::placeholder {
    color: $text-secondary;
  }
}

.clear-search-btn {
  position: absolute;
  right: $spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  padding: $spacing-xs;
  border-radius: $border-radius;
  transition: all $transition-speed ease;
  
  &:hover {
    color: $text-color;
    background-color: $gray-100;
  }
}

.filter-buttons {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $border-radius-full;
  background-color: $white;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-sm;
  
  &:hover {
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &.active {
    background-color: $primary-color;
    color: $white;
    border-color: $primary-color;
  }
}

// 分类筛选
.category-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
}

.category-select {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  font-size: $font-size-sm;
  background-color: $white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
}

.category-count {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 笔记列表
.notes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.note-item {
  transition: all $transition-speed ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
  
  &.active {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
  }
}

.note-content {
  margin-bottom: $spacing-md;
}

.note-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin: 0 0 $spacing-sm 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-preview {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.note-categories {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.category-badge {
  padding: 2px $spacing-sm;
  background-color: rgba($primary-color, 0.1);
  color: $primary-color;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.note-date {
  font-size: $font-size-xs;
  color: $text-secondary;
  white-space: nowrap;
}

.note-actions {
  display: flex;
  gap: $spacing-xs;
}

.action-btn {
  padding: $spacing-xs;
  background: none;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  color: $text-secondary;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $gray-100;
    color: $text-color;
  }
  
  &.danger:hover {
    background-color: rgba($danger-color, 0.1);
    color: $danger-color;
  }
}

// 空状态
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: $spacing-xl;
  background-color: $gray-50;
  border-radius: $border-radius-xl;
  border: 2px dashed $border-color;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
}

.empty-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: $spacing-sm;
}

.empty-message {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.create-first-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-xl;
  background-color: $primary-color;
  color: $white;
  border: none;
  border-radius: $border-radius-lg;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $primary-dark;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
}

// 加载状态
.loading-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
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

// 分页
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg 0;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  background-color: $white;
  color: $text-color;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-sm;
  
  &:hover:not(:disabled) {
    background-color: $gray-50;
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: $font-size-sm;
  color: $text-secondary;
}

// 右键菜单
.context-menu {
  position: fixed;
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  padding: $spacing-xs 0;
  z-index: 1000;
  min-width: 180px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-size: $font-size-sm;
  color: $text-color;
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $gray-50;
  }
  
  &.danger {
    color: $danger-color;
    
    &:hover {
      background-color: rgba($danger-color, 0.1);
    }
  }
}

.context-menu-divider {
  height: 1px;
  background-color: $border-color;
  margin: $spacing-xs 0;
}

// 删除确认对话框
.delete-confirm-content {
  margin-bottom: $spacing-lg;
}

.delete-confirm-content p {
  font-size: $font-size-base;
  color: $text-color;
  line-height: 1.6;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: $breakpoint-md) {
  .home-container {
    padding: $spacing-md;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
  }
  
  .toolbar-right {
    justify-content: center;
  }
  
  .notes-list {
    grid-template-columns: 1fr;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .category-filter {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
  }
  
  .category-select {
    width: 100%;
  }
}

@media (max-width: $breakpoint-sm) {
  .page-title {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .search-input {
    max-width: none;
  }
  
  .pagination {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .empty-state {
    padding: $spacing-xl;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .toolbar-btn,
  .filter-btn,
  .category-select,
  .pagination-btn {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $gray-200;
  }
  
  .toolbar-btn:hover:not(:disabled),
  .filter-btn:hover,
  .pagination-btn:hover:not(:disabled) {
    background-color: $gray-700;
  }
  
  .search-input {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $white;
  }
  
  .note-item {
    background-color: $gray-800;
    border-color: $gray-700;
  }
  
  .empty-state {
    background-color: $gray-800;
    border-color: $gray-700;
  }
  
  .category-filter {
    background-color: $gray-800;
  }
  
  .context-menu {
    background-color: $gray-800;
    border-color: $gray-700;
  }
  
  .context-menu-item:hover {
    background-color: $gray-700;
  }
}
</style>