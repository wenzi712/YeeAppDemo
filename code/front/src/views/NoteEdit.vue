<template>
  <div class="note-edit-container">
    <!-- 顶部工具栏 -->
    <div class="note-edit-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="返回">
          <component :is="ChevronLeftIcon" />
        </button>
        <Input
          v-model="note.title"
          type="text"
          placeholder="无标题"
          class="note-title-input"
          :disabled="saving || loading"
          @input="onTitleChange"
          @keyup.enter="focusContent"
        />
      </div>
      <div class="header-right">
        <button 
          @click="toggleStar" 
          class="action-btn"
          :class="{ 'active': note.starred }"
          :disabled="saving || loading"
          title="收藏"
        >
          <component :is="StarIcon" />
        </button>
        <button @click="openCategoriesModal" class="action-btn" :disabled="saving || loading" title="分类">
          <component :is="TagIcon" />
        </button>
        <button 
          @click="saveNote"
          :disabled="saving || loading || !canSave"
          class="save-btn"
          :loading="saving"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
    
    <!-- 编辑工具栏 -->
    <div class="editor-toolbar" v-if="showToolbar">
      <div class="toolbar-group">
        <button @click="formatText('bold')" class="toolbar-btn" :title="'粗体 (Ctrl+B)'" :disabled="saving || loading">
          <component :is="BoldIcon" />
        </button>
        <button @click="formatText('italic')" class="toolbar-btn" :title="'斜体 (Ctrl+I)'" :disabled="saving || loading">
          <component :is="ItalicIcon" />
        </button>
        <button @click="formatText('strikethrough')" class="toolbar-btn" :title="'删除线'" :disabled="saving || loading">
          <component :is="StrikethroughIcon" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="formatText('heading-1')" class="toolbar-btn" :title="'标题 1'" :disabled="saving || loading">
          <component :is="Heading1Icon" />
        </button>
        <button @click="formatText('heading-2')" class="toolbar-btn" :title="'标题 2'" :disabled="saving || loading">
          <component :is="Heading2Icon" />
        </button>
        <button @click="formatText('heading-3')" class="toolbar-btn" :title="'标题 3'" :disabled="saving || loading">
          <component :is="Heading3Icon" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="formatText('bullet-list')" class="toolbar-btn" :title="'无序列表'" :disabled="saving || loading">
          <component :is="ListIcon" />
        </button>
        <button @click="formatText('ordered-list')" class="toolbar-btn" :title="'有序列表'" :disabled="saving || loading">
          <component :is="ListOrderedIcon" />
        </button>
        <button @click="formatText('blockquote')" class="toolbar-btn" :title="'引用'" :disabled="saving || loading">
          <component :is="QuoteIcon" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="formatText('code')" class="toolbar-btn" :title="'行内代码'" :disabled="saving || loading">
          <component :is="CodeIcon" />
        </button>
        <button @click="formatText('code-block')" class="toolbar-btn" :title="'代码块'" :disabled="saving || loading">
          <component :is="CodeIcon" class="code-block-icon" />
        </button>
        <button @click="formatText('link')" class="toolbar-btn" :title="'链接 (Ctrl+K)'" :disabled="saving || loading">
          <component :is="LinkIcon" />
        </button>
        <button @click="insertImage" class="toolbar-btn" :title="'插入图片'" :disabled="saving || loading">
          <component :is="ImageIcon" />
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="formatText('table')" class="toolbar-btn" :title="'插入表格'" :disabled="saving || loading">
          <component :is="TableIcon" />
        </button>
        <button @click="formatText('horizontal-rule')" class="toolbar-btn" :title="'分隔线'" :disabled="saving || loading">
          <component :is="DividerIcon" />
        </button>
      </div>
    </div>
    
    <!-- 笔记内容编辑区 -->
    <div class="note-edit-content">
      <div 
        v-if="!loading"
        ref="editor"
        contenteditable="true"
        class="editor-content"
        :class="{ 'placeholder': !note.content }"
        @input="onContentChange"
        @focus="onEditorFocus"
        @blur="onEditorBlur"
        :disabled="saving || loading"
        @keydown="handleKeyDown"
      >
        <div v-if="!note.content" class="editor-placeholder">开始编写笔记内容...</div>
        <div v-html="parseContentToHtml(note.content)"></div>
      </div>
      
      <!-- 加载状态 -->
      <div v-else class="loading-state">
        <component :is="Loader2Icon" class="loading-icon" />
        <p class="loading-text">加载中...</p>
      </div>
    </div>
    
    <!-- 底部信息栏 -->
    <div class="note-edit-footer">
      <div class="footer-left">
        <span class="word-count">{{ calculateWordCount(note.content) }} 字</span>
        <span class="save-status" v-if="lastSavedTime">
          <component :is="CheckCircleIcon" v-if="saved" class="save-status-icon success" />
          <component :is="AlertCircleIcon" v-else class="save-status-icon warning" />
          {{ saved ? '已保存' : '未保存' }}
        </span>
      </div>
      <div class="footer-right">
        <button @click="toggleToolbar" class="toolbar-toggle-btn" :class="{ 'active': showToolbar }">
          <component :is="SlidersHorizontalIcon" />
        </button>
        <button @click="switchMode" class="mode-toggle-btn" :class="{ 'active': editMode === 'preview' }">
          {{ editMode === 'edit' ? '预览' : '编辑' }}
        </button>
      </div>
    </div>
    
    <!-- 预览模式 -->
    <div v-if="editMode === 'preview' && !loading" class="preview-content">
      <div v-html="renderMarkdown(note.content)" class="markdown-preview"></div>
    </div>
    
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
    
    <!-- 插入链接对话框 -->
    <Modal 
      v-model="showLinkModal"
      title="插入链接"
      size="sm"
    >
      <div class="link-form">
        <Input
          v-model="linkText"
          type="text"
          placeholder="链接文本"
          class="link-text-input"
        />
        <Input
          v-model="linkUrl"
          type="url"
          placeholder="链接地址"
          class="link-url-input"
        />
      </div>
      <template #footer>
        <Button @click="showLinkModal = false">取消</Button>
        <Button type="primary" @click="confirmInsertLink" :disabled="!linkUrl">插入</Button>
      </template>
    </Modal>
    
    <!-- 插入图片对话框 -->
    <Modal 
      v-model="showImageModal"
      title="插入图片"
      size="sm"
    >
      <div class="image-form">
        <div class="upload-options">
          <button @click="triggerImageUpload" class="upload-btn">
            <component :is="UploadIcon" />
            上传图片
          </button>
          <input 
            ref="imageInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageUpload"
          />
        </div>
        <div class="image-preview" v-if="imagePreview">
          <img :src="imagePreview" alt="预览" class="preview-img" />
        </div>
        <Input
          v-model="imageUrl"
          type="url"
          placeholder="或直接输入图片URL"
          class="image-url-input"
        />
        <Input
          v-model="imageAlt"
          type="text"
          placeholder="图片描述（可选）"
          class="image-alt-input"
        />
      </div>
      <template #footer>
        <Button @click="cancelImageUpload">取消</Button>
        <Button type="primary" @click="confirmInsertImage" :disabled="!imageUrl && !imagePreview">插入</Button>
      </template>
    </Modal>
    
    <!-- 未保存提示对话框 -->
    <Modal 
      v-model="showUnsavedModal"
      title="未保存的更改"
      size="sm"
    >
      <div class="unsaved-content">
        <p>您有未保存的更改，确定要离开吗？</p>
      </div>
      <template #footer>
        <Button @click="showUnsavedModal = false">取消</Button>
        <Button type="danger" @click="discardChanges">放弃更改</Button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoteStore } from '../stores/note'
import { useUserStore } from '../stores/user'
import Modal from '../components/Modal.vue'
import Button from '../components/Button.vue'
import Input from '../components/Input.vue'
import CategorySelect from '../components/CategorySelect.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  ChevronLeft,
  Star,
  Tag,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Upload,
  SlidersHorizontal,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const noteStore = useNoteStore()
const userStore = useUserStore()

// 状态
const loading = ref(true)
const saving = ref(false)
const saved = ref(true)
const lastSavedTime = ref(null)
const showToolbar = ref(true)
const editMode = ref('edit')
const showCategoriesModal = ref(false)
const showLinkModal = ref(false)
const showImageModal = ref(false)
const showUnsavedModal = ref(false)
const imagePreview = ref('')
const linkText = ref('')
const linkUrl = ref('')
const imageUrl = ref('')
const imageAlt = ref('')
const editor = ref(null)

// 笔记数据
const note = reactive({
  id: '',
  title: '',
  content: '',
  starred: false,
  categories: []
})

// 原始笔记数据，用于检测是否有更改
const originalNote = ref({})

// 计算属性
const allCategories = computed(() => noteStore.categories)
const canSave = computed(() => note.title || note.content)
const isNewNote = computed(() => !route.params.id)

// 自动保存计时器
let autoSaveTimer = null
const AUTO_SAVE_DELAY = 3000 // 3秒

// 方法
const loadNote = async () => {
  if (isNewNote.value) {
    // 新笔记，初始化一个空笔记
    note.id = null
    note.title = ''
    note.content = ''
    note.starred = false
    note.categories = []
    loading.value = false
    return
  }
  
  loading.value = true
  
  try {
    const fetchedNote = await noteStore.getNoteById(route.params.id)
    
    if (fetchedNote) {
      Object.assign(note, fetchedNote)
      // 保存原始数据用于比较
      originalNote.value = { ...note }
      saved.value = true
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
  if (!saved.value) {
    showUnsavedModal.value = true
    return
  }
  router.back()
}

const onTitleChange = () => {
  saved.value = false
  scheduleAutoSave()
}

const onContentChange = () => {
  if (!editor.value) return
  
  // 从编辑器获取HTML内容
  const htmlContent = editor.value.innerHTML
  
  // 转换HTML为Markdown
  note.content = parseHtmlToMarkdown(htmlContent)
  
  saved.value = false
  scheduleAutoSave()
}

const onEditorFocus = () => {
  if (editor.value) {
    editor.value.classList.remove('placeholder')
    const placeholder = editor.value.querySelector('.editor-placeholder')
    if (placeholder) {
      placeholder.style.display = 'none'
    }
  }
}

const onEditorBlur = () => {
  if (editor.value && !note.content) {
    editor.value.classList.add('placeholder')
    const placeholder = editor.value.querySelector('.editor-placeholder')
    if (placeholder) {
      placeholder.style.display = 'block'
    }
  }
}

const focusContent = () => {
  nextTick(() => {
    if (editor.value) {
      editor.value.focus()
    }
  })
}

const saveNote = async () => {
  if (!canSave.value || saving.value) return
  
  saving.value = true
  
  try {
    let savedNote
    
    if (isNewNote.value) {
      // 创建新笔记
      savedNote = await noteStore.createNote({
        title: note.title,
        content: note.content,
        starred: note.starred,
        categories: note.categories
      })
      
      // 跳转到新创建的笔记详情页
      router.push(`/note/${savedNote.id}`)
      
      if (userStore.toast) {
        userStore.toast.success('笔记创建成功')
      }
    } else {
      // 更新现有笔记
      await noteStore.updateNote({
        id: note.id,
        title: note.title,
        content: note.content,
        starred: note.starred,
        categories: note.categories
      })
      
      saved.value = true
      lastSavedTime.value = new Date()
      
      if (userStore.toast) {
        userStore.toast.success('笔记保存成功')
      }
    }
  } catch (error) {
    console.error('Failed to save note:', error)
    if (userStore.toast) {
      userStore.toast.error('保存笔记失败，请重试')
    }
  } finally {
    saving.value = false
  }
}

const scheduleAutoSave = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = setTimeout(async () => {
    if (!saved.value && canSave.value) {
      await saveNote()
    }
  }, AUTO_SAVE_DELAY)
}

const toggleStar = async () => {
  try {
    note.starred = !note.starred
    saved.value = false
    
    // 触发自动保存
    scheduleAutoSave()
  } catch (error) {
    console.error('Failed to toggle star:', error)
    note.starred = !note.starred // 恢复原来的状态
    if (userStore.toast) {
      userStore.toast.error('操作失败，请重试')
    }
  }
}

const updateCategories = async (newCategories) => {
  try {
    note.categories = newCategories
    saved.value = false
    
    // 触发自动保存
    scheduleAutoSave()
  } catch (error) {
    console.error('Failed to update categories:', error)
    if (userStore.toast) {
      userStore.toast.error('更新分类失败，请重试')
    }
  }
}

const toggleToolbar = () => {
  showToolbar.value = !showToolbar.value
}

const switchMode = () => {
  editMode.value = editMode.value === 'edit' ? 'preview' : 'edit'
}

const formatText = (formatType) => {
  if (!editor.value) return
  
  try {
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    let formattedText = ''
    let formatFunction
    
    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText || '粗体文本'}**`
        break
      case 'italic':
        formattedText = `*${selectedText || '斜体文本'}*`
        break
      case 'strikethrough':
        formattedText = `~~${selectedText || '删除线文本'}~~`
        break
      case 'heading-1':
        formattedText = `# ${selectedText || '标题 1'}`
        break
      case 'heading-2':
        formattedText = `## ${selectedText || '标题 2'}`
        break
      case 'heading-3':
        formattedText = `### ${selectedText || '标题 3'}`
        break
      case 'bullet-list':
        formattedText = `- ${selectedText || '列表项'}`
        break
      case 'ordered-list':
        formattedText = `1. ${selectedText || '列表项'}`
        break
      case 'blockquote':
        formattedText = `> ${selectedText || '引用文本'}`
        break
      case 'code':
        formattedText = `\`${selectedText || '代码'}\``
        break
      case 'code-block':
        formattedText = `\`\`\`\n${selectedText || '代码块'}\n\`\`\``
        break
      case 'table':
        formattedText = `| 表头1 | 表头2 | 表头3 |\n| --- | --- | --- |\n| 单元格1 | 单元格2 | 单元格3 |`
        break
      case 'horizontal-rule':
        formattedText = `\n\n---\n\n`
        break
      case 'link':
        showLinkModal.value = true
        linkText.value = selectedText
        return
    }
    
    // 将格式化的文本插入到编辑器中
    document.execCommand('insertText', false, formattedText)
    
    // 更新笔记内容
    onContentChange()
    
    // 重新聚焦编辑器
    editor.value.focus()
  } catch (error) {
    console.error('Failed to format text:', error)
  }
}

const insertImage = () => {
  showImageModal.value = true
}

const triggerImageUpload = () => {
  if (imageInput.value) {
    imageInput.value.click()
  }
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    if (userStore.toast) {
      userStore.toast.error('请选择图片文件')
    }
    return
  }
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
    imageUrl.value = '' // 清除URL输入
  }
  reader.readAsDataURL(file)
}

const cancelImageUpload = () => {
  imagePreview.value = ''
  imageUrl.value = ''
  imageAlt.value = ''
  showImageModal.value = false
}

const confirmInsertImage = () => {
  const url = imagePreview.value || imageUrl.value
  if (!url) return
  
  const alt = imageAlt.value || '图片'
  const markdownImage = `![${alt}](${url})`
  
  // 插入到编辑器
  if (editor.value) {
    document.execCommand('insertText', false, markdownImage)
    onContentChange()
    editor.value.focus()
  }
  
  // 关闭对话框并重置
  cancelImageUpload()
}

const confirmInsertLink = () => {
  if (!linkUrl.value) return
  
  const text = linkText.value || linkUrl.value
  const markdownLink = `[${text}](${linkUrl.value})`
  
  // 插入到编辑器
  if (editor.value) {
    document.execCommand('insertText', false, markdownLink)
    onContentChange()
    editor.value.focus()
  }
  
  // 关闭对话框并重置
  showLinkModal.value = false
  linkText.value = ''
  linkUrl.value = ''
}

const discardChanges = () => {
  showUnsavedModal.value = false
  router.back()
}

const handleKeyDown = (event) => {
  // 处理快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault()
        saveNote()
        break
      case 'b':
        event.preventDefault()
        formatText('bold')
        break
      case 'i':
        event.preventDefault()
        formatText('italic')
        break
      case 'k':
        event.preventDefault()
        formatText('link')
        break
    }
  }
}

const parseContentToHtml = (content) => {
  if (!content) return ''
  
  // 这里简单地将Markdown解析为HTML用于显示
  marked.setOptions({
    breaks: true,
    gfm: true
  })
  
  return DOMPurify.sanitize(marked(content))
}

const parseHtmlToMarkdown = (html) => {
  // 这里简化处理，实际项目中可能需要更复杂的HTML到Markdown转换
  // 可以考虑使用html-to-markdown等库
  
  // 移除占位符
  let cleanHtml = html.replace('<div class="editor-placeholder">开始编写笔记内容...</div>', '')
  
  // 简单的HTML到Markdown转换
  // 注意：这是一个简化版，实际项目中建议使用专门的库
  cleanHtml = cleanHtml
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<strike>(.*?)<\/strike>/g, '~~$1~~')
    .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
    .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n\n')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
      return content
        .replace(/<li>(.*?)<\/li>/gs, '- $1\n')
        .replace(/\n$/, '\n\n')
    })
    .replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
      let i = 1
      return content
        .replace(/<li>(.*?)<\/li>/gs, () => {
          return `${i++}. $1\n`
        })
        .replace(/\n$/, '\n\n')
    })
    .replace(/<img src="(.*?)" alt="(.*?)"\s*\/?>/g, '![$2]($1)')
    .replace(/<img src="(.*?)"\s*\/?>/g, '![图片]($1)')
    .replace(/\n{3,}/g, '\n\n') // 压缩多余的换行
    .trim()
  
  return cleanHtml
}

const renderMarkdown = (content) => {
  if (!content) return '<p>无内容</p>'
  
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  })
  
  const rawHtml = marked(content)
  return DOMPurify.sanitize(rawHtml)
}

const calculateWordCount = (content) => {
  if (!content) return 0
  
  // 移除Markdown格式
  const plainText = content.replace(/[#*`>\[\]()]/g, '').replace(/\n/g, ' ')
  
  // 计算字数
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g)
  const chineseCount = chineseChars ? chineseChars.length : 0
  
  // 计算英文单词数
  const englishWords = plainText.match(/[a-zA-Z0-9]+/g)
  const englishCount = englishWords ? englishWords.length : 0
  
  return chineseCount + englishCount
}

// 生命周期
onMounted(() => {
  loadNote()
  
  // 添加beforeunload事件监听
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  // 清除自动保存计时器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // 移除beforeunload事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 监听路由变化，检查是否有未保存的更改
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 只有当路由实际变化且有未保存更改时才显示提示
    if (newPath !== oldPath && !saved.value) {
      showUnsavedModal.value = true
    }
  }
)

const handleBeforeUnload = (event) => {
  if (!saved.value) {
    // 现代浏览器会忽略自定义消息，只显示默认提示
    event.preventDefault()
    event.returnValue = ''
    return ''
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.note-edit-container {
  padding: $spacing-lg;
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// 顶部工具栏
.note-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
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

.note-title-input {
  flex: 1;
  font-size: 2rem;
  font-weight: $font-weight-bold;
  border: none;
  outline: none;
  padding: $spacing-sm 0;
  color: $text-color;
  background: transparent;
  min-width: 0;
  
  &::placeholder {
    color: $text-secondary;
    font-weight: $font-weight-normal;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
  
  &:hover:not(:disabled) {
    background-color: $gray-50;
    color: $text-color;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.active {
    color: $primary-color;
  }
}

.save-btn {
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

// 编辑工具栏
.editor-toolbar {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background-color: $gray-50;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: $spacing-xs;
}

.toolbar-btn {
  padding: $spacing-xs $spacing-sm;
  background: none;
  border: none;
  border-radius: $border-radius-lg;
  cursor: pointer;
  color: $text-color;
  transition: all $transition-speed ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    background-color: $white;
    color: $primary-color;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.code-block-icon {
  transform: scale(1.1);
}

// 编辑区域
.note-edit-content {
  flex: 1;
  min-height: 500px;
  margin-bottom: $spacing-lg;
}

.editor-content {
  min-height: 500px;
  font-size: $font-size-base;
  line-height: 1.8;
  color: $text-color;
  outline: none;
  padding: $spacing-lg;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  background-color: $white;
  transition: all $transition-speed ease;
  
  &.placeholder {
    color: $text-secondary;
  }
  
  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
  }
  
  &[contenteditable="false"] {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.editor-placeholder {
  position: absolute;
  pointer-events: none;
  color: $text-secondary;
  font-size: $font-size-base;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
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

// 底部信息栏
.note-edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color;
  margin-top: $spacing-lg;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.word-count {
  font-weight: $font-weight-medium;
}

.save-status {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.save-status-icon {
  width: 16px;
  height: 16px;
}

.save-status-icon.success {
  color: $success-color;
}

.save-status-icon.warning {
  color: $warning-color;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.toolbar-toggle-btn,
.mode-toggle-btn {
  padding: $spacing-xs $spacing-sm;
  background: none;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  cursor: pointer;
  color: $text-color;
  transition: all $transition-speed ease;
  font-size: $font-size-sm;
  
  &:hover {
    background-color: $gray-50;
    border-color: $primary-color;
    color: $primary-color;
  }
  
  &.active {
    background-color: $primary-color;
    color: $white;
    border-color: $primary-color;
  }
}

// 预览模式
.preview-content {
  min-height: 500px;
  padding: $spacing-lg;
  border: 1px solid $border-color;
  border-radius: $border-radius-lg;
  background-color: $white;
  margin-bottom: $spacing-lg;
}

.markdown-preview {
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

// 链接表单
.link-form,
.image-form {
  margin-bottom: $spacing-lg;
}

.link-text-input,
.link-url-input,
.image-url-input,
.image-alt-input {
  margin-bottom: $spacing-md;
}

.upload-options {
  margin-bottom: $spacing-lg;
  text-align: center;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-lg $spacing-xl;
  border: 2px dashed $border-color;
  border-radius: $border-radius-lg;
  background-color: $gray-50;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-speed ease;
  font-size: $font-size-base;
  
  &:hover {
    border-color: $primary-color;
    color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }
}

.image-preview {
  margin-bottom: $spacing-lg;
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
}

// 未保存提示
.unsaved-content p {
  font-size: $font-size-base;
  color: $text-color;
  line-height: 1.6;
  margin-bottom: 0;
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: $breakpoint-md) {
  .note-edit-container {
    padding: $spacing-md;
  }
  
  .note-edit-header {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-lg;
  }
  
  .header-left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .note-title-input {
    font-size: 1.8rem;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .editor-toolbar {
    gap: $spacing-sm;
  }
  
  .toolbar-group {
    gap: 2px;
  }
  
  .toolbar-btn {
    padding: $spacing-xs;
  }
  
  .editor-content {
    min-height: 400px;
    padding: $spacing-md;
  }
  
  .note-edit-footer {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-md;
  }
  
  .footer-left,
  .footer-right {
    justify-content: center;
  }
}

@media (max-width: $breakpoint-sm) {
  .note-title-input {
    font-size: 1.5rem;
  }
  
  .editor-toolbar {
    padding: $spacing-sm;
  }
  
  .toolbar-btn {
    padding: 6px;
  }
  
  .editor-content {
    min-height: 300px;
    font-size: $font-size-sm;
    line-height: 1.6;
  }
}

// 深色模式支持
@media (prefers-color-scheme: dark) {
  .back-btn:hover,
  .action-btn:hover:not(:disabled) {
    background-color: $gray-800;
  }
  
  .editor-toolbar,
  .editor-content,
  .preview-content {
    background-color: $gray-900;
    border-color: $gray-700;
  }
  
  .toolbar-btn:hover:not(:disabled) {
    background-color: $gray-800;
  }
  
  .toolbar-toggle-btn,
  .mode-toggle-btn {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $gray-200;
    
    &:hover {
      background-color: $gray-700;
    }
  }
  
  .markdown-preview {
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
  
  .upload-btn {
    background-color: $gray-800;
    border-color: $gray-700;
    color: $gray-300;
  }
}
</style>