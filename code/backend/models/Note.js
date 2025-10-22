const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '笔记标题不能为空'],
    trim: true,
    maxlength: [255, '标题不能超过255个字符']
  },
  content: {
    type: String,
    required: [true, '笔记内容不能为空'],
    trim: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [200, '摘要不能超过200个字符']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '笔记必须属于某个用户']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      filename: {
        type: String,
        required: true
      },
      size: {
        type: Number
      },
      width: {
        type: Number
      },
      height: {
        type: Number
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending'
  },
  syncVersion: {
    type: Number,
    default: 1
  }
});

// 自动生成摘要中间件
noteSchema.pre('save', function(next) {
  // 如果内容超过200个字符，截取前200个字符作为摘要
  if (this.content && !this.excerpt) {
    // 移除HTML标签并截取
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
  }
  
  // 更新最后修改时间
  this.lastModified = Date.now();
  this.updatedAt = Date.now();
  
  // 更新同步状态
  this.syncStatus = 'pending';
  this.syncVersion += 1;
  
  next();
});

// 创建索引以提高查询性能
noteSchema.index({ userId: 1, lastModified: -1 });
noteSchema.index({ userId: 1, isDeleted: 1 });
noteSchema.index({ userId: 1, isPinned: 1, lastModified: -1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;