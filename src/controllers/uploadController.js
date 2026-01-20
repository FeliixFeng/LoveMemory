/**
 * 图片上传控制器
 * 使用 multer 处理文件上传
 */

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保存储目录存在
const uploadPath = join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// multer 存储引擎配置
const storage = multer.diskStorage({
  // 存储路径：项目根目录下的 public/uploads/
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  
  // 文件名：Date.now() + 随机数 + 原始扩展名
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = extname(file.originalname);
    cb(null, `${timestamp}_${random}${ext}`);
  }
});

// 文件过滤：仅允许图片格式
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG/GIF/WEBP 格式的图片'), false);
  }
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB 限制
});

// 上传处理函数
export const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的图片' });
  }
  
  // 返回可访问的 URL 路径
  const url = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true,
    url,
    filename: req.file.filename
  });
};
