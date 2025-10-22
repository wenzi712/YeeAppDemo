const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Note = require('../models/Note');
const { protect, validateCategoryOwnership } = require('../middleware/auth');

// @route   POST /api/categories
// @desc    创建新分类
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    
    // 检查必要字段
    if (!name) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供分类名称' 
      });
    }
    
    // 检查分类是否已存在
    const categoryExists = await Category.findOne({ 
      userId: req.user._id, 
      name 
    });
    
    if (categoryExists) {
      return res.status(400).json({ 
        status: 'error', 
        message: '该分类名称已存在' 
      });
    }
    
    // 创建分类
    const category = await Category.create({
      name,
      color: color || '#e5e7eb', // 默认灰色
      icon: icon || 'folder',
      userId: req.user._id
    });
    
    return res.status(201).json({
      status: 'success',
      data: {
        category
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

// @route   GET /api/categories
// @desc    获取用户的所有分类
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // 查询所有分类
    const categories = await Category.find({ userId: req.user._id })
      .sort({ createdAt: 1 }); // 按创建时间排序
    
    // 获取每个分类的笔记数量
    const categoriesWithCounts = await Promise.all(
      categories.map(async category => {
        const noteCount = await Note.countDocuments({
          userId: req.user._id,
          categoryId: category._id,
          isDeleted: false
        });
        
        return {
          ...category._doc,
          noteCount
        };
      })
    );
    
    return res.status(200).json({
      status: 'success',
      data: {
        categories: categoriesWithCounts
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

// @route   GET /api/categories/:id
// @desc    获取单个分类详情
// @access  Private
router.get('/:id', protect, validateCategoryOwnership, async (req, res) => {
  try {
    const category = req.category;
    
    // 获取该分类的笔记数量
    const noteCount = await Note.countDocuments({
      userId: req.user._id,
      categoryId: category._id,
      isDeleted: false
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        category: {
          ...category._doc,
          noteCount
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

// @route   PUT /api/categories/:id
// @desc    更新分类
// @access  Private
router.put('/:id', protect, validateCategoryOwnership, async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const category = req.category;
    
    // 检查是否尝试修改默认分类
    if (category.isDefault) {
      return res.status(400).json({ 
        status: 'error', 
        message: '不能修改默认分类' 
      });
    }
    
    // 如果要修改名称，检查是否与其他分类重名
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        userId: req.user._id, 
        name 
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          status: 'error', 
          message: '该分类名称已存在' 
        });
      }
      
      category.name = name;
    }
    
    // 更新其他字段
    if (color) category.color = color;
    if (icon) category.icon = icon;
    category.updatedAt = Date.now();
    category.syncStatus = 'pending';
    category.syncVersion += 1;
    
    await category.save();
    
    // 获取更新后的笔记数量
    const noteCount = await Note.countDocuments({
      userId: req.user._id,
      categoryId: category._id,
      isDeleted: false
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        category: {
          ...category._doc,
          noteCount
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

// @route   DELETE /api/categories/:id
// @desc    删除分类
// @access  Private
router.delete('/:id', protect, validateCategoryOwnership, async (req, res) => {
  try {
    const category = req.category;
    
    // 检查是否尝试删除默认分类
    if (category.isDefault) {
      return res.status(400).json({ 
        status: 'error', 
        message: '不能删除默认分类' 
      });
    }
    
    // 检查分类下是否有笔记
    const noteCount = await Note.countDocuments({
      userId: req.user._id,
      categoryId: category._id,
      isDeleted: false
    });
    
    if (noteCount > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: `该分类下还有 ${noteCount} 个笔记，请先清空分类或移动笔记` 
      });
    }
    
    // 删除分类
    await category.deleteOne();
    
    return res.status(200).json({
      status: 'success',
      message: '分类已删除'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      status: 'error', 
      message: '服务器内部错误' 
    });
  }
});

// @route   POST /api/categories/batch
// @desc    批量创建分类
// @access  Private
router.post('/batch', protect, async (req, res) => {
  try {
    const categories = req.body.categories;
    
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供要创建的分类列表' 
      });
    }
    
    // 检查是否有重名分类
    const existingCategories = await Category.find({
      userId: req.user._id,
      name: { $in: categories.map(cat => cat.name) }
    });
    
    if (existingCategories.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: `以下分类名称已存在: ${existingCategories.map(cat => cat.name).join(', ')}` 
      });
    }
    
    // 批量创建分类
    const createdCategories = await Category.insertMany(
      categories.map(cat => ({
        name: cat.name,
        color: cat.color || '#e5e7eb',
        icon: cat.icon || 'folder',
        userId: req.user._id
      }))
    );
    
    return res.status(201).json({
      status: 'success',
      data: {
        categories: createdCategories
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

// @route   GET /api/categories/sync/pending
// @desc    获取待同步的分类
// @access  Private
router.get('/sync/pending', protect, async (req, res) => {
  try {
    const lastSyncVersion = parseInt(req.query.lastSyncVersion || 0, 10);
    
    const categories = await Category.find({
      userId: req.user._id,
      syncVersion: { $gt: lastSyncVersion }
    }).sort({ syncVersion: 1 });
    
    return res.status(200).json({
      status: 'success',
      data: {
        categories,
        lastSyncVersion: categories.length > 0 ? Math.max(...categories.map(c => c.syncVersion)) : lastSyncVersion
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