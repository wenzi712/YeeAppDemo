const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // 为每个用户创建单独的上传目录
    const userDir = path.join(uploadDir, req.user ? req.user._id.toString() : 'public');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function(req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 文件过滤配置
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // 检查文件扩展名
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // 检查MIME类型
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('仅支持图片文件 (JPEG, JPG, PNG, GIF, WebP)'), false);
  }
};

// 创建上传实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB默认限制
    files: 10 // 单次最多上传10个文件
  },
  fileFilter: fileFilter
});

// 错误处理中间件
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        status: 'error', 
        message: `文件大小超过限制，最大允许 ${(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) / (1024 * 1024)}MB` 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        status: 'error', 
        message: '单次上传文件数量超过限制' 
      });
    }
    return res.status(400).json({ 
      status: 'error', 
      message: err.message 
    });
  } else if (err) {
    // 其他错误
    return res.status(400).json({ 
      status: 'error', 
      message: err.message 
    });
  }
  next();
};

// 导出上传中间件
exports.uploadImage = upload.single('image');
exports.uploadImages = upload.array('images', 10);

// 删除文件的辅助函数
exports.deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('删除文件失败:', err);
      }
    });
  }
};

// 获取文件URL的辅助函数
exports.getFileUrl = (req, filename) => {
  const userDir = req.user ? req.user._id.toString() : 'public';
  // 构建相对于上传目录的路径
  return `/uploads/${userDir}/${filename}`;
};