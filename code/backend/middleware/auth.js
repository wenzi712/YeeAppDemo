const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Note = require('../models/Note');
const Category = require('../models/Category');

// 认证中间件 - 验证JWT token
exports.protect = async (req, res, next) => {
  let token;
  
  // 检查请求头中的Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 提取token
      token = req.headers.authorization.split(' ')[1];
      
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 获取当前用户信息
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ status: 'error', message: '未授权，请重新登录' });
    }
  }
  
  // 没有提供token
  if (!token) {
    return res.status(401).json({ status: 'error', message: '未授权，请重新登录' });
  }
};

// 可选认证中间件 - 不强制要求认证，但如果提供了有效token则设置用户信息
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // 忽略错误，继续执行
    }
  }
  
  next();
};

// 验证是否为笔记作者
exports.validateNoteOwnership = async (req, res, next) => {
  try {
    // 检查笔记是否存在且属于当前用户
    const note = await Note.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!note) {
      return res.status(404).json({ status: 'error', message: '笔记不存在' });
    }
    
    // 将笔记信息添加到请求对象中
    req.note = note;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
};

// 验证是否为分类作者
exports.validateCategoryOwnership = async (req, res, next) => {
  try {
    // 检查分类是否存在且属于当前用户
    const category = await Category.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!category) {
      return res.status(404).json({ status: 'error', message: '分类不存在' });
    }
    
    // 将分类信息添加到请求对象中
    req.category = category;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: '服务器内部错误' });
  }
};

// 认证中间件模块结束