const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称不能为空'],
    trim: true,
    maxlength: [50, '分类名称不能超过50个字符']
  },
  color: {
    type: String,
    default: '#e5e7eb', // 默认灰色
    trim: true,
    match: [/^#[0-9A-Fa-f]{6}$/, '请输入有效的十六进制颜色值']
  },
  icon: {
    type: String,
    default: 'folder',
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '分类必须属于某个用户']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  noteCount: {
    type: Number,
    default: 0
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

// 确保每个用户的分类名称唯一
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// 更新时间中间件
categorySchema.pre('save', function(next) {
  // 更新最后修改时间
  this.updatedAt = Date.now();
  
  // 更新同步状态
  this.syncStatus = 'pending';
  this.syncVersion += 1;
  
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;