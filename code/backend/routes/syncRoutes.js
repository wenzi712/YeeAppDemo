const express = require('express');
const router = express.Router();
const SyncRecord = require('../models/SyncRecord');
const User = require('../models/User');
const Note = require('../models/Note');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// @route   POST /api/sync/record
// @desc    创建新的同步记录
// @access  Private
router.post('/record', protect, async (req, res) => {
  try {
    const { syncType, direction, deviceInfo } = req.body;
    
    // 验证必要字段
    if (!syncType || !direction) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供同步类型和同步方向' 
      });
    }
    
    // 创建同步记录
    const syncRecord = await SyncRecord.create({
      userId: req.user._id,
      syncType,
      direction,
      status: 'pending',
      deviceInfo: deviceInfo || {},
      startTime: Date.now(),
      syncDetails: {
        totalItems: 0,
        successfulItems: 0,
        failedItems: 0,
        conflictItems: 0
      }
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        syncRecord
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   PUT /api/sync/record/:id
// @desc    更新同步记录状态
// @access  Private
router.put('/record/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, syncDetails, errorMessage } = req.body;
    
    // 查找同步记录
    const syncRecord = await SyncRecord.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!syncRecord) {
      return res.status(404).json({ 
        status: 'error', 
        message: '同步记录不存在' 
      });
    }
    
    // 更新同步状态
    if (status) {
      syncRecord.status = status;
      
      // 如果同步完成或失败，更新结束时间
      if (status === 'completed' || status === 'failed') {
        syncRecord.endTime = Date.now();
        syncRecord.duration = syncRecord.endTime - syncRecord.startTime;
        
        // 如果同步成功，更新用户的最后同步时间
        if (status === 'completed') {
          const user = await User.findById(req.user._id);
          user.lastSyncTime = Date.now();
          await user.save();
          
          // 重置笔记和分类的同步状态
          await Note.updateMany(
            { userId: req.user._id, syncStatus: 'pending' },
            { syncStatus: 'synced' }
          );
          
          await Category.updateMany(
            { userId: req.user._id, syncStatus: 'pending' },
            { syncStatus: 'synced' }
          );
        }
      }
    }
    
    // 更新同步详情
    if (syncDetails) {
      syncRecord.syncDetails = { ...syncRecord.syncDetails, ...syncDetails };
    }
    
    // 更新错误信息
    if (errorMessage) {
      syncRecord.errorMessage = errorMessage;
    }
    
    await syncRecord.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        syncRecord
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   GET /api/sync/records
// @desc    获取同步历史记录
// @access  Private
router.get('/records', protect, async (req, res) => {
  try {
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    
    // 构建查询条件
    const query = { userId: req.user._id };
    if (status) query.status = status;
    
    // 查询同步记录
    const syncRecords = await SyncRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 获取总数
    const total = await SyncRecord.countDocuments(query);
    
    return res.status(200).json({
      status: 'success',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        syncRecords
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   GET /api/sync/full
// @desc    获取完整数据用于同步
// @access  Private
router.get('/full', protect, async (req, res) => {
  try {
    // 获取用户的所有数据
    const categories = await Category.find({ 
      userId: req.user._id,
      isDeleted: { $ne: true }
    });
    
    const notes = await Note.find({ 
      userId: req.user._id,
      isDeleted: { $ne: true }
    });
    
    // 获取用户信息
    const user = await User.findById(req.user._id).select('username email syncEnabled');
    
    return res.status(200).json({
      status: 'success',
      data: {
        user,
        categories,
        notes,
        syncTime: Date.now(),
        syncVersion: {
          categories: categories.length > 0 ? Math.max(...categories.map(c => c.syncVersion)) : 0,
          notes: notes.length > 0 ? Math.max(...notes.map(n => n.syncVersion)) : 0
        }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   POST /api/sync/resolve-conflicts
// @desc    解决同步冲突
// @access  Private
router.post('/resolve-conflicts', protect, async (req, res) => {
  try {
    const { conflicts } = req.body;
    
    if (!Array.isArray(conflicts) || conflicts.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供冲突列表' 
      });
    }
    
    const results = [];
    
    for (const conflict of conflicts) {
      const { type, id, resolution } = conflict;
      
      try {
        if (type === 'note') {
          // 解决笔记冲突
          const note = await Note.findOne({ 
            _id: id, 
            userId: req.user._id 
          });
          
          if (note) {
            if (resolution === 'useServer') {
              // 保持服务器版本不变
              await Note.updateOne(
                { _id: id },
                { syncStatus: 'synced' }
              );
            } else if (resolution === 'useClient') {
              // 使用客户端版本
              await Note.updateOne(
                { _id: id },
                {
                  title: conflict.clientVersion.title,
                  content: conflict.clientVersion.content,
                  tags: conflict.clientVersion.tags,
                  categoryId: conflict.clientVersion.categoryId,
                  isPinned: conflict.clientVersion.isPinned,
                  isArchived: conflict.clientVersion.isArchived,
                  lastModified: Date.now(),
                  syncStatus: 'synced'
                }
              );
            } else if (resolution === 'duplicate') {
              // 创建副本
              const newNote = await Note.create({
                title: `${conflict.clientVersion.title} (副本)`,
                content: conflict.clientVersion.content,
                userId: req.user._id,
                categoryId: conflict.clientVersion.categoryId,
                tags: conflict.clientVersion.tags,
                isPinned: conflict.clientVersion.isPinned,
                isArchived: conflict.clientVersion.isArchived
              });
              
              // 标记原笔记为已同步
              await Note.updateOne(
                { _id: id },
                { syncStatus: 'synced' }
              );
            }
            
            results.push({ 
              type, 
              id, 
              status: 'success' 
            });
          }
        } else if (type === 'category') {
          // 解决分类冲突
          const category = await Category.findOne({ 
            _id: id, 
            userId: req.user._id 
          });
          
          if (category) {
            if (resolution === 'useServer') {
              // 保持服务器版本不变
              await Category.updateOne(
                { _id: id },
                { syncStatus: 'synced' }
              );
            } else if (resolution === 'useClient') {
              // 使用客户端版本
              await Category.updateOne(
                { _id: id },
                {
                  name: conflict.clientVersion.name,
                  color: conflict.clientVersion.color,
                  icon: conflict.clientVersion.icon,
                  syncStatus: 'synced'
                }
              );
            }
            
            results.push({ 
              type, 
              id, 
              status: 'success' 
            });
          }
        }
      } catch (error) {
        console.error(`解决冲突失败 (${type}: ${id}):`, error);
        results.push({ 
          type, 
          id, 
          status: 'error',
          error: error.message 
        });
      }
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        results
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;