const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少需要3个字符'],
    maxlength: [20, '用户名不能超过20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少需要6个字符'],
    select: false // 查询时不返回密码
  },
  phoneNumber: {
    type: String,
    trim: true,
    validate: [validator.isMobilePhone, '请输入有效的手机号']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [200, '个人简介不能超过200个字符']
  },
  syncEnabled: {
    type: Boolean,
    default: false
  },
  lastSyncTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只有密码被修改或新用户创建时才加密密码
  if (!this.isModified('password')) return next();
  
  // 加密密码
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 验证密码方法
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;