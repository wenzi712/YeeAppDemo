import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import { useUserStore } from './user'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    currentNote: null,
    isLoading: false,
    error: null,
    filter: {
      categoryId: null,
      searchQuery: '',
      isDeleted: false,
      page: 1,
      limit: 20
    },
    totalNotes: 0,
    categories: []
  }),
  
  getters: {
    // 获取过滤后的笔记列表
    filteredNotes: (state) => {
      let filtered = [...state.notes]
      
      // 按分类过滤
      if (state.filter.categoryId) {
        filtered = filtered.filter(note => note.categoryId === state.filter.categoryId)
      }
      
      // 按搜索词过滤
      if (state.filter.searchQuery) {
        const query = state.filter.searchQuery.toLowerCase()
        filtered = filtered.filter(note => 
          note.title.toLowerCase().includes(query) || 
          note.content.toLowerCase().includes(query) ||
          note.summary.toLowerCase().includes(query)
        )
      }
      
      // 按删除状态过滤
      filtered = filtered.filter(note => note.isDeleted === state.filter.isDeleted)
      
      // 按更新时间排序（最新的在前）
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      
      return filtered
    },
    
    // 获取未删除的笔记数量
    activeNotesCount: (state) => {
      return state.notes.filter(note => !note.isDeleted).length
    },
    
    // 获取已删除的笔记数量
    deletedNotesCount: (state) => {
      return state.notes.filter(note => note.isDeleted).length
    },
    
    // 获取待同步的笔记数量
    pendingSyncNotesCount: (state) => {
      return state.notes.filter(note => note.syncStatus !== 'synced').length
    }
  },
  
  actions: {
    // 设置筛选条件
    setFilter(filter) {
      this.filter = { ...this.filter, ...filter }
    },
    
    // 重置筛选条件
    resetFilter() {
      this.filter = {
        categoryId: null,
        searchQuery: '',
        isDeleted: false,
        page: 1,
        limit: 20
      }
    },
    
    // 获取所有笔记
    async fetchNotes() {
      this.isLoading = true
      this.error = null
      
      try {
        const params = {
          page: this.filter.page,
          limit: this.filter.limit,
          categoryId: this.filter.categoryId || undefined,
          search: this.filter.searchQuery || undefined,
          isDeleted: this.filter.isDeleted
        }
        
        const response = await axios.get('/api/notes', { params })
        
        if (this.filter.page === 1) {
          this.notes = response.data.notes
        } else {
          this.notes = [...this.notes, ...response.data.notes]
        }
        
        this.totalNotes = response.data.total
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '获取笔记失败'
        toast.error(this.error)
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取单个笔记
    async fetchNote(id) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/notes/${id}`)
        this.currentNote = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || '获取笔记详情失败'
        toast.error(this.error)
        return null
      } finally {
        this.isLoading = false
      }
    },
    
    // 创建新笔记
    async createNote(noteData) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/notes', noteData)
        const newNote = response.data
        
        // 添加到列表开头
        this.notes.unshift(newNote)
        this.totalNotes++
        toast.success('笔记创建成功')
        
        return { success: true, note: newNote }
      } catch (error) {
        this.error = error.response?.data?.message || '创建笔记失败'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新笔记
    async updateNote(id, noteData) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/notes/${id}`, noteData)
        const updatedNote = response.data
        
        // 更新本地笔记列表
        const index = this.notes.findIndex(note => note._id === id)
        if (index !== -1) {
          this.notes[index] = updatedNote
        }
        
        // 更新当前笔记
        if (this.currentNote && this.currentNote._id === id) {
          this.currentNote = updatedNote
        }
        
        toast.success('笔记更新成功')
        return { success: true, note: updatedNote }
      } catch (error) {
        this.error = error.response?.data?.message || '更新笔记失败'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除笔记（软删除）
    async deleteNote(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await axios.delete(`/api/notes/${id}`)
        
        // 在本地标记为已删除
        const index = this.notes.findIndex(note => note._id === id)
        if (index !== -1) {
          this.notes[index].isDeleted = true
          this.notes[index].deletedAt = new Date().toISOString()
        }
        
        // 清除当前笔记
        if (this.currentNote && this.currentNote._id === id) {
          this.currentNote = null
        }
        
        toast.success('笔记已放入回收站')
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || '删除笔记失败'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 恢复已删除的笔记
    async restoreNote(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await axios.put(`/api/notes/${id}/restore`)
        
        // 在本地标记为未删除
        const index = this.notes.findIndex(note => note._id === id)
        if (index !== -1) {
          this.notes[index].isDeleted = false
          this.notes[index].deletedAt = null
        }
        
        toast.success('笔记已恢复')
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || '恢复笔记失败'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 永久删除笔记
    async permanentDeleteNote(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await axios.delete(`/api/notes/${id}/permanent`)
        
        // 从本地移除
        this.notes = this.notes.filter(note => note._id !== id)
        this.totalNotes--
        
        // 清除当前笔记
        if (this.currentNote && this.currentNote._id === id) {
          this.currentNote = null
        }
        
        toast.success('笔记已永久删除')
        return { success: true }
      } catch (error) {
        this.error = error.response?.data?.message || '永久删除笔记失败'
        toast.error(this.error)
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },
    
    // 为笔记添加图片
    async addNoteImage(id, formData) {
      try {
        const response = await axios.post(`/api/notes/${id}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        // 更新本地笔记的图片列表
        const index = this.notes.findIndex(note => note._id === id)
        if (index !== -1) {
          this.notes[index].images = response.data.images
        }
        
        // 更新当前笔记
        if (this.currentNote && this.currentNote._id === id) {
          this.currentNote.images = response.data.images
        }
        
        toast.success('图片上传成功')
        return { success: true, images: response.data.images }
      } catch (error) {
        const errorMessage = error.response?.data?.message || '图片上传失败'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    
    // 删除笔记中的图片
    async removeNoteImage(id, imageIndex) {
      try {
        const response = await axios.delete(`/api/notes/${id}/images/${imageIndex}`)
        
        // 更新本地笔记的图片列表
        const index = this.notes.findIndex(note => note._id === id)
        if (index !== -1) {
          this.notes[index].images = response.data.images
        }
        
        // 更新当前笔记
        if (this.currentNote && this.currentNote._id === id) {
          this.currentNote.images = response.data.images
        }
        
        toast.success('图片删除成功')
        return { success: true, images: response.data.images }
      } catch (error) {
        const errorMessage = error.response?.data?.message || '图片删除失败'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    
    // 获取待同步的笔记
    async fetchPendingSyncNotes() {
      try {
        const response = await axios.get('/api/notes/sync/pending')
        return response.data
      } catch (error) {
        console.error('获取待同步笔记失败:', error)
        return []
      }
    },
    
    // 清除当前笔记
    clearCurrentNote() {
      this.currentNote = null
    },
    
    // 清除所有笔记数据（登出时使用）
    clearNotes() {
      this.notes = []
      this.currentNote = null
      this.totalNotes = 0
      this.resetFilter()
    }
  }
})