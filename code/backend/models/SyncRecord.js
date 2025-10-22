const mongoose = require('mongoose');

const syncRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '同步记录必须属于某个用户']
  },
  syncType: {
    type: String,
    required: [true, '同步类型不能为空'],
    enum: ['full', 'incremental', 'manual', 'auto']
  },
  status: {
    type: String,
    required: [true, '同步状态不能为空'],
    enum: ['pending', 'in_progress', 'completed', 'failed']
  },
  direction: {
    type: String,
    required: [true, '同步方向不能为空'],
    enum: ['upload', 'download', 'bidirectional']
  },
  deviceInfo: {
    deviceName: {
      type: String,
      trim: true
    },
    deviceType: {
      type: String,
      trim: true,
      enum: ['mobile', 'tablet', 'desktop', 'web']
    },
    clientVersion: {
      type: String,
      trim: true
    }
  },
  syncDetails: {
    totalItems: {
      type: Number,
      default: 0
    },
    successfulItems: {
      type: Number,
      default: 0
    },
    failedItems: {
      type: Number,
      default: 0
    },
    conflictItems: {
      type: Number,
      default: 0
    }
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // 单位：毫秒
    default: 0
  },
  errorMessage: {
    type: String,
    trim: true
  },
  nextSyncVersion: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 计算同步持续时间中间件
syncRecordSchema.pre('save', function(next) {
  if (this.status === 'completed' || this.status === 'failed') {
    if (this.startTime && !this.endTime) {
      this.endTime = Date.now();
    }
    
    if (this.startTime && this.endTime) {
      this.duration = this.endTime - this.startTime;
    }
  }
  
  next();
});

// 创建索引以提高查询性能
syncRecordSchema.index({ userId: 1, createdAt: -1 });
syncRecordSchema.index({ userId: 1, status: 1 });

const SyncRecord = mongoose.model('SyncRecord', syncRecordSchema);

module.exports = SyncRecord;