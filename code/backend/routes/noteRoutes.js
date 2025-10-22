const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { protect, validateNoteOwnership } = require('../middleware/auth');
const { uploadImages, getFileUrl, deleteFile } = require('../middleware/upload');
const path = require('path');

// @route   POST /api/notes
// @desc    创建新笔记
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, categoryId, tags } = req.body;
    
    // 检查必要字段
    if (!title || !content) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供笔记标题和内容' 
      });
    }
    
    // 创建笔记
    const note = await Note.create({
      title,
      content,
      categoryId,
      tags: tags || [],
      userId: req.user._id
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        note
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

// @route   GET /api/notes
// @desc    获取用户的所有笔记（分页）
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // 解析查询参数
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const categoryId = req.query.category;
    const search = req.query.search;
    const pinned = req.query.pinned === 'true';
    const archived = req.query.archived === 'true';
    const deleted = req.query.deleted === 'true';
    
    // 构建查询条件
    const query = {
      userId: req.user._id,
      isDeleted: deleted || false
    };
    
    if (categoryId) query.categoryId = categoryId;
    if (pinned !== undefined) query.isPinned = pinned;
    if (archived !== undefined) query.isArchived = archived;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 查询笔记
    const notes = await Note.find(query)
      .populate('categoryId', 'name color')
      .sort({ 
        isPinned: -1, 
        lastModified: -1 
      })
      .skip(skip)
      .limit(limit);
    
    // 获取总数
    const total = await Note.countDocuments(query);
    
    return res.status(200).json({
      status: 'success',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        notes
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

// @route   GET /api/notes/:id
// @desc    获取单个笔记详情
// @access  Private
router.get('/:id', protect, validateNoteOwnership, async (req, res) => {
  try {
    const note = req.note;
    
    return res.status(200).json({
      status: 'success',
      data: {
        note
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

// @route   PUT /api/notes/:id
// @desc    更新笔记
// @access  Private
router.put('/:id', protect, validateNoteOwnership, async (req, res) => {
  try {
    const { title, content, categoryId, tags, isPinned, isArchived } = req.body;
    const note = req.note;
    
    // 更新笔记字段
    if (title) note.title = title;
    if (content) {
      note.content = content;
      // 重新生成摘要
      const plainText = content.replace(/<[^>]*>/g, '');
      note.excerpt = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    }
    if (categoryId !== undefined) note.categoryId = categoryId;
    if (tags !== undefined) note.tags = tags;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;
    
    // 更新时间和同步状态
    note.lastModified = Date.now();
    note.updatedAt = Date.now();
    note.syncStatus = 'pending';
    note.syncVersion += 1;
    
    await note.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        note
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

// @route   DELETE /api/notes/:id
// @desc    删除笔记（软删除）
// @access  Private
router.delete('/:id', protect, validateNoteOwnership, async (req, res) => {
  try {
    const note = req.note;
    
    // 软删除
    note.isDeleted = true;
    note.updatedAt = Date.now();
    note.syncStatus = 'pending';
    note.syncVersion += 1;
    
    await note.save();
    
    return res.status(200).json({
      status: 'success',
      message: '笔记已删除'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   PUT /api/notes/:id/restore
// @desc    恢复已删除的笔记
// @access  Private
router.put('/:id/restore', protect, validateNoteOwnership, async (req, res) => {
  try {
    const note = req.note;
    
    note.isDeleted = false;
    note.updatedAt = Date.now();
    note.syncStatus = 'pending';
    note.syncVersion += 1;
    
    await note.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        note
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

// @route   POST /api/notes/:id/images
// @desc    为笔记添加图片
// @access  Private
router.post('/:id/images', protect, validateNoteOwnership, uploadImages, async (req, res) => {
  try {
    const note = req.note;
    
    // 确保文件已上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请选择要上传的图片' 
      });
    }
    
    // 处理上传的图片
    const uploadedImages = req.files.map(file => ({
      url: getFileUrl(req, file.filename),
      filename: file.filename,
      size: file.size,
      uploadedAt: Date.now()
    }));
    
    // 添加到笔记
    note.images.push(...uploadedImages);
    note.updatedAt = Date.now();
    note.syncStatus = 'pending';
    note.syncVersion += 1;
    
    await note.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        images: uploadedImages
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

// @route   DELETE /api/notes/:id/images/:imageIndex
// @desc    删除笔记中的图片
// @access  Private
router.delete('/:id/images/:imageIndex', protect, validateNoteOwnership, async (req, res) => {
  try {
    const note = req.note;
    const imageIndex = parseInt(req.params.imageIndex, 10);
    
    if (imageIndex < 0 || imageIndex >= note.images.length) {
      return res.status(400).json({ 
        status: 'error', 
        message: '无效的图片索引' 
      });
    }
    
    // 获取要删除的图片信息
    const imageToDelete = note.images[imageIndex];
    
    // 从数组中移除图片
    note.images.splice(imageIndex, 1);
    
    // 更新笔记
    note.updatedAt = Date.now();
    note.syncStatus = 'pending';
    note.syncVersion += 1;
    
    await note.save();
    
    // 删除实际文件（异步，不阻塞响应）
    const filePath = path.join(process.env.UPLOAD_PATH, req.user._id.toString(), imageToDelete.filename);
    deleteFile(filePath);
    
    return res.status(200).json({
      status: 'success',
      message: '图片已删除'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   GET /api/notes/sync/pending
// @desc    获取待同步的笔记
// @access  Private
router.get('/sync/pending', protect, async (req, res) => {
  try {
    const lastSyncVersion = parseInt(req.query.lastSyncVersion || 0, 10);
    
    const notes = await Note.find({
      userId: req.user._id,
      syncVersion: { $gt: lastSyncVersion }
    }).sort({ syncVersion: 1 });
    
    return res.status(200).json({
      status: 'success',
      data: {
        notes,
        lastSyncVersion: notes.length > 0 ? Math.max(...notes.map(n => n.syncVersion)) : lastSyncVersion
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