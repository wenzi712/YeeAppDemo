const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadImage, getFileUrl } = require('../middleware/upload');

// 生成JWT token的函数
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /api/users/register
// @desc    用户注册
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;
    
    // 检查必要字段
    if (!username || !email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供用户名、邮箱和密码' 
      });
    }
    
    // 检查用户是否已存在
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        status: 'error', 
        message: '该邮箱或用户名已被注册' 
      });
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      phoneNumber
    });
    
    // 生成token
    const token = generateToken(user._id);
    
    // 返回用户信息和token，但不返回密码
    return res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token
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

// @route   POST /api/users/login
// @desc    用户登录
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 检查必要字段
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请提供邮箱和密码' 
      });
    }
    
    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    
    // 验证用户和密码
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ 
        status: 'error', 
        message: '邮箱或密码错误' 
      });
    }
    
    // 生成token
    const token = generateToken(user._id);
    
    // 返回用户信息和token
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          bio: user.bio
        },
        token
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

// @route   GET /api/users/profile
// @desc    获取当前用户信息
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    // 从请求对象中获取用户信息
    const user = req.user;
    
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          bio: user.bio,
          syncEnabled: user.syncEnabled,
          lastSyncTime: user.lastSyncTime,
          createdAt: user.createdAt
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

// @route   PUT /api/users/profile
// @desc    更新用户信息
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, phoneNumber, bio } = req.body;
    const user = req.user;
    
    // 检查用户名是否被其他用户使用
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          status: 'error', 
          message: '该用户名已被使用' 
        });
      }
      user.username = username;
    }
    
    // 更新其他信息
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio;
    user.updatedAt = Date.now();
    
    // 保存更新后的用户信息
    await user.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          bio: user.bio,
          updatedAt: user.updatedAt
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

// @route   POST /api/users/avatar
// @desc    上传用户头像
// @access  Private
router.post('/avatar', protect, uploadImage, async (req, res) => {
  try {
    // 确保文件已上传
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error', 
        message: '请选择要上传的图片' 
      });
    }
    
    const user = req.user;
    
    // 更新用户头像路径
    user.avatar = getFileUrl(req, req.file.filename);
    user.updatedAt = Date.now();
    
    await user.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        avatar: user.avatar
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

// @route   PUT /api/users/sync-settings
// @desc    更新同步设置
// @access  Private
router.put('/sync-settings', protect, async (req, res) => {
  try {
    const { syncEnabled } = req.body;
    const user = req.user;
    
    if (syncEnabled !== undefined) {
      user.syncEnabled = syncEnabled;
    }
    
    user.updatedAt = Date.now();
    await user.save();
    
    return res.status(200).json({
      status: 'success',
      data: {
        syncEnabled: user.syncEnabled
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