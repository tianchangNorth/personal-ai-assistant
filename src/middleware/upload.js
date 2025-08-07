const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await fs.mkdir(config.upload.dir, { recursive: true });
  } catch (error) {
    console.error('创建上传目录失败:', error);
  }
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (config.upload.allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error(`不支持的文件类型: ${ext}。支持的类型: ${config.upload.allowedTypes.join(', ')}`);
    error.code = 'UNSUPPORTED_FILE_TYPE';
    cb(error, false);
  }
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5 // 最多同时上传5个文件
  }
});

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: '文件大小超出限制',
          maxSize: config.upload.maxFileSize
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: '文件数量超出限制',
          maxCount: 5
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          error: '文件上传失败',
          details: error.message
        });
    }
  }
  
  if (error.code === 'UNSUPPORTED_FILE_TYPE' || error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError,
  ensureUploadDir
};
