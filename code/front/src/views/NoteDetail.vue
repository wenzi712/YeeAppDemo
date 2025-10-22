<template>
  <div class="note-detail-container">
    <!-- 顶部工具栏 -->
    <div class="note-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="返回">
          <component :is="ChevronLeftIcon" />
        </button>
        <h1 class="note-title">{{ note.title || '无标题' }}</h1>
      </div>
      <div class="header-right">
        <button 
          @click="toggleStar" 
          class="action-btn"
          :class="{ 'active': note.starred }"
          title="收藏"
        >
          <component :is="StarIcon" />
        </button>
        <button @click="editNote" class="action-btn" title="编辑">
          <component :is="EditIcon" />
        </button>
        <button @click="duplicateNote" class="action-btn" title="复制">
          <component :is="CopyIcon" />
        </button>
        <button @click="deleteNote" class="action-btn danger" title="删除">
          <component :is="Trash2Icon" />
        </button>
      </div>
    </div>
    
    <!-- 笔记信息栏 -->
    <div class="note-meta">
      <div class="meta-left">
        <span class="meta-item">
          <component :is="CalendarIcon" class="meta-icon" />
          创建于 {{ formatDate(note.createdAt) }}
        </span>
        <span class="meta-item">
          <component :is="ClockIcon" class="meta-icon" />
          更新于 {{ formatDate(note.updatedAt) }}
        </span>
        <span class="meta-item">
          <component :is="FileTextIcon" class="meta-icon" />
          {{ calculateWordCount(note.content) }} 字
        </span>
      </div>
      
      <div class="meta-right">
        <div class="categories-wrapper">
          <span class="categories-label">分类：</span>
          <div class="categories-list">
            <span 
              v-for="category in note.categories" 
              :key="category.id"
              class="category-badge"
              @click="filterByCategory(category)"
            >
              {{ category.name }}
            </span>
            <button 
              v-if="note.categories.length === 0" 
              @click="openCategoriesModal"
              class="add-category-btn"
            >
              <component :is="PlusIcon" /> 添加分类
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 笔记内容 -->
    <div v-if="!loading" class="note-content">
      <div v-if="note.content" v-html="renderMarkdown(note.content)" class="markdown-content"></div>
      <div v-else class="empty-content">
        <p>这篇笔记还没有内容</p>
        <button @click="editNote" class="add-content-btn">添加内容</button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <component :is="Loader2Icon" class="loading-icon" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <!-- 相关笔记 -->
    <div v-if="!loading && relatedNotes.length > 0" class="related-notes">
      <h3 class="related-title">相关笔记</h3>
      <List
        v-for="relatedNote in relatedNotes"
        :key="relatedNote.id"
        :item="relatedNote"
        @click="navigateToNote(relatedNote.id)"
        class="related-note-item"
      >
        <template #content>
          <div class="related-note-content">
            <h4 class="related-note-title">{{ relatedNote.title || '无标题' }}</h4>
            <p class="related-note-preview">{{ getNotePreview(relatedNote.content) }}</p>
            <div class="related-note-date">{{ formatDate(relatedNote.updatedAt) }}</div>
          </div>
        </template>
      </List>
    </div>
    
    <!-- 操作栏 -->
    <div class="note-actions-bar">
      <button @click="editNote" class="action-bar-btn primary">
        <component :is="EditIcon" />
        编辑笔记
      </button>
      <button @click="shareNote" class="action-bar-btn">
        <component :is="Share2Icon" />
        分享
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
    
    <!-- 分类选择对话框 -->
    <Modal 
      v-model="showCategoriesModal"
      title="管理分类"
    >
      <CategorySelect
        v-model="note.categories"
        :categories="allCategories"
        @update:modelValue="updateCategories"
      />
      <template #footer>
        <Button @click="showCategoriesModal = false">关闭</Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoteStore } from '../stores/note'
import { useUserStore } from '../stores/user'
import List from '../components/List.vue'
import Modal from '../components/Modal.vue'
import Button from '../components/Button.vue'
import CategorySelect from '../components/CategorySelect.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  ChevronLeft,
  Star,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Clock,
  FileText,
  Plus,
  Share2,
  Loader2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const noteStore = useNoteStore()
const userStore = useUserStore()

// 状态
const loading = ref(true)
const noteId = computed(() => route.params.id)
const showDeleteConfirm = ref(false)
const showCategoriesModal = ref(false)

// 笔记数据
const note = reactive({
  id: '',
  title: '',
  content: '',
  createdAt: '',
  updatedAt: '',
  starred: false,
  categories: []
})

// 计算属性
const allCategories = computed(() => noteStore.categories)

// 相关笔记
const relatedNotes = computed(() => {
  if (!note.id) return []
  
  // 获取与当前笔记有相同分类的其他笔记
  const currentNoteCategories = note.categories.map(c => c.id)
  
  return noteStore.notes
    .filter(n => 
      n.id !== note.id && 
      !n.deleted &&
      // 如果当前笔记有分类，查找有共同分类的笔记
      // 否则查找最近更新的笔记
      (currentNoteCategories.length > 0 
        ? n.categories.some(c => currentNoteCategories.includes(c.id))
        : true)
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3)
})

// 方法
const loadNote = async () => {
  loading.value = true
  
  try {
    const fetchedNote = await noteStore.getNoteById(noteId.value)
    
    if (fetchedNote) {
      Object.assign(note, fetchedNote)
    } else {
      // 笔记不存在
      if (userStore.toast) {
        userStore.toast.error('笔记不存在或已被删除')
      }
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to load note:', error)
    if (userStore.toast) {
      userStore.toast.error('加载笔记失败，请重试')
    }
    router.push('/')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const editNote = () => {
  router.push(`/note/${note.id}/edit`)
}

const navigateToNote = (id) => {
  router.push(`/note/${id}`)
}

const toggleStar = async () => {
  try {
    await noteStore.toggleStar(note.id)
    note.starred = !note.starred
    
    if (userStore.toast) {
      userStore.toast.success(note.starred ? '已添加到收藏' : '已取消收藏')
    }
  } catch (error) {
    console.error('Failed to toggle star:', error)
    if (userStore.toast) {
      userStore.toast.error('操作失败，请重试')
    }
  }
}

const duplicateNote = async () => {
  try {
    await noteStore.duplicateNote(note.id)
    
    if (userStore.toast) {
      userStore.toast.success('笔记复制成功')
    }
    
    // 跳转到新创建的笔记
    const newNote = noteStore.notes[noteStore.notes.length - 1]
    if (newNote) {
      router.push(`/note/${newNote.id}`)
    }
  } catch (error) {
    console.error('Failed to duplicate note:', error)
    if (userStore.toast) {
      userStore.toast.error('复制笔记失败，请重试')
    }
  }
}

const deleteNote = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  try {
    await noteStore.deleteNote(note.id)
    showDeleteConfirm.value = false
    
    if (userStore.toast) {
      userStore.toast.success('笔记已删除')
    }
    
    router.push('/')
  } catch (error) {
    console.error('Failed to delete note:', error)
    if (userStore.toast) {
      userStore.toast.error('删除笔记失败，请重试')
    }
  }
}

const openCategoriesModal = () => {
  showCategoriesModal.value = true
}

const updateCategories = async (newCategories) => {
  try {
    await noteStore.updateNoteCategories(note.id, newCategories)
    note.categories = newCategories
    
    if (userStore.toast) {
      userStore.toast.success('分类已更新')
    }
  } catch (error) {
    console.error('Failed to update categories:', error)
    if (userStore.toast) {
      userStore.toast.error('更新分类失败，请重试')
    }
    // 恢复原来的分类
    await loadNote()
  }
}

const filterByCategory = (category) => {
  router.push({
    path: '/',
    query: { category: category.id }
  })
}

const shareNote = () => {
  // 实现分享功能
  if (userStore.toast) {
    userStore.toast.info('分享功能开发中')
  }
}

const renderMarkdown = (content) => {
  if (!content) return ''
  
  // 配置marked选项
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  })
  
  // 渲染Markdown并净化HTML
  const rawHtml = marked(content)
  return DOMPurify.sanitize(rawHtml)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateWordCount = (content) => {
  if (!content) return 0
  
  // 移除Markdown格式
  const plainText = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ')
  
  // 计算字数
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g)
  const chineseCount = chineseChars ? chineseChars.length : 0
  
  // 计算英文单词数（连续的字母和数字作为一个单词）
  const englishWords = plainText.match(/[a-zA-Z0-9]+/g)
  const englishCount = englishWords ? englishWords.length : 0
  
  return chineseCount + englishCount
}

const getNotePreview = (content) => {
  if (!content) return ''
  
  // 移除Markdown格式
  const plainText = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ')
  
  // 截取前80个字符
  return plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText
}

// 生命周期
onMounted(() => {
  loadNote()
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.note-detail-container {
  padding: $spacing-lg;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

// 顶部工具栏
.note-header {
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
  flex: 1;
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

.note-title {
  font-size: 2.2rem;
  font-weight: $font-weight-bold;
  color: $text-color;
  margin: 0;
  word-wrap: break-word;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.action-btn {
  padding: $spacing-sm;
  background: none;
  border: none;
  border-radius: $border-radius-lg;
  cursor: pointer;
  color: $text-secondary;
  transition: all $transition-speed ease;
  flex-shrink: 0;
  
  &:hover {
    background-color: $gray-50;
    color: $text-color;
  }
  
  &.danger:hover {
    background-color: rgba($danger-color, 0.1);
    color: $danger-color;
  }
  
  &.active {
    color: $primary-color;
  }
}

// 笔记信息栏
.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  padding: $spacing-md;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
}

.meta-left {
  display: flex;
  gap: $spacing-lg;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.meta-right {
  flex: 1;
  min-width: 200px;
}

.categories-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.categories-label {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: $font-weight-medium;
}

.categories-list {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
  flex: 1;
}

.category-badge {
  padding: 2px $spacing-sm;
  background-color: rgba($primary-color, 0.1);
  color: $primary-color;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: rgba($primary-color, 0.2);
  }
}

.add-category-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 2px $spacing-sm;
  background: none;
  border: 1px dashed $border-color;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    border-color: $primary-color;
    color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
}

// 笔记内容
.note-content {
  margin-bottom: $spacing-xl;
  min-height: 400px;
}

.markdown-content {
  font-size: $font-size-base;
  line-height: 1.8;
  color: $text-color;
  
  // Markdown样式
  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
    margin-top: $spacing-2xl;
    margin-bottom: $spacing-lg;
    font-weight: $font-weight-bold;
    color: $text-color;
  }
  
  & h1 {
    font-size: 2rem;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $border-color;
  }
  
  & h2 {
    font-size: 1.75rem;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $border-color;
  }
  
  & h3 {
    font-size: 1.5rem;
  }
  
  & p {
    margin-bottom: $spacing-lg;
  }
  
  & ul,
  & ol {
    margin-bottom: $spacing-lg;
    padding-left: $spacing-2xl;
  }
  
  & li {
    margin-bottom: $spacing-sm;
  }
  
  & a {
    color: $primary-color;
    text-decoration: none;
    transition: color $transition-speed ease;
    
    &:hover {
      color: $primary-dark;
      text-decoration: underline;
    }
  }
  
  & blockquote {
    margin: $spacing-lg 0;
    padding: $spacing-md $spacing-lg;
    border-left: 4px solid $primary-color;
    background-color: $gray-50;
    border-radius: 0 $border-radius-lg $border-radius-lg 0;
    color: $text-secondary;
  }
  
  & pre {
    margin: $spacing-lg 0;
    padding: $spacing-lg;
    background-color: $gray-100;
    border-radius: $border-radius-lg;
    overflow-x: auto;
  }
  
  & code {
    padding: 2px 6px;
    background-color: $gray-100;
    border-radius: $border-radius-sm;
    font-family: mono;
    font-size: $font-size-sm;
  }
  
  & pre code {
    padding: 0;
    background-color: transparent;
  }
  
  & img {
    max-width: 100%;
    height: auto;
    border-radius: $border-radius-lg;
    margin: $spacing-lg 0;
  }
  
  & table {
    width: 100%;
    border-collapse: collapse;
    margin: $spacing-lg 0;
  }
  
  & th,
  & td {
    padding: $spacing-sm $spacing-md;
    border: 1px solid $border-color;
    text-align: left;
  }
  
  & th {
    background-color: $gray-50;
    font-weight: $font-weight-medium;
  }
  
  & tr:nth-child(even) {
    background-color: $gray-50;
  }
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: $spacing-2xl;
  text-align: center;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
  border: 2px dashed $border-color;
}

.empty-content p {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.add-content-btn {
  padding: $spacing-sm $spacing-xl;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
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

// 相关笔记
.related-notes {
  margin-bottom: $spacing-xl;
}

.related-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color;
}

.related-note-item {
  cursor: pointer;
  transition: all $transition-speed ease;
  
  &:hover {
    background-color: $gray-50;
  }
}

.related-note-content {
  padding: $spacing-md 0;
}

.related-note-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $text-color;
  margin: 0 0 $spacing-sm 0;
}

.related-note-preview {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0 0 $spacing-sm 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-note-date {
  font-size: $font-size-xs;
  color: #999;
}

// 操作栏
.note-actions-bar {
  display: flex;
  gap: $spacing-md;
  padding-top: $spacing-xl;
  border-top: 1px solid $border-color;
}

.action-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  background-color: $white;
  color: $text-color;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-base;
  
  &:hover {
    background-color: $gray-50;
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &.primary {
    background-color: $primary-color;
    color: $white;
    border-color: $primary-color;
    
    &:hover {
      background-color: $primary-dark;
      border-color: $primary-dark;
    }
  }
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
  .note-detail-container {
    padding: $spacing-md;
  }
  
  .note-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-lg;
  }
  
  .header-left {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .note-title {
    font-size: 1.8rem;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .note-meta {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .meta-left {
    justify-content: center;
  }
  
  .categories-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;
  }
  
  .categories-list {
    justify-content: center;
  }
  
  .markdown-content {
    font-size: $font-size-sm;
  }
  
  .note-actions-bar {
    flex-direction: column;
  }
  
  .action-bar-btn {
    justify-content: center;
  }
}

@media (max-width: $breakpoint-sm) {
  .note-title {
    font-size: 1.5rem;
  }
  
  .markdown-content {
    font-size: $font-size-sm;
    line-height: 1.6;
  }
  
  .related-note-content {
    padding: $spacing-sm 0;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .back-btn:hover,
  .action-btn:hover {
    background-color: $gray-800;
  }
  
  .note-meta,
  .empty-content {
    background-color: $gray-800;
    border-color: $gray-700;
  }
  
  .markdown-content {
    color: $gray-200;
    
    & h1,
    & h2,
    & h3,
    & h4,
    & h5,
    & h6 {
      color: $white;
    }
    
    & blockquote,
    & pre,
    & code,
    & th,
    & tr:nth-child(even) {
      background-color: $gray-800;
    }
  }
  
  .action-bar-btn {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $gray-200;
    
    &:hover {
      background-color: $gray-700;
    }
  }
}
</style>