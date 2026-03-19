/**
 * 图片上传控制器
 * 使用 multer 处理文件上传
 */

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import sharp from 'sharp';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保存储目录存在
const uploadPath = env.UPLOAD_DIR || join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

function buildThumbFilename(filename) {
  const extension = extname(filename);
  const name = filename.slice(0, filename.length - extension.length);
  return `${name}_thumb${extension}`;
}

// multer 存储引擎配置
const storage = multer.diskStorage({
  // 存储路径：项目根目录下的 public/uploads/
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadPath, { recursive: true });
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
export const handleUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的图片' });
  }

  try {
    const thumbFilename = buildThumbFilename(req.file.filename);
    const thumbFilePath = join(uploadPath, thumbFilename);

    await sharp(req.file.path)
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
      .toFile(thumbFilePath);

    const url = `/uploads/${req.file.filename}`;
    const displayUrl = url;
    const thumbUrl = `/uploads/${thumbFilename}`;

    res.json({
      success: true,
      url,
      displayUrl,
      thumbUrl,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Create thumbnail error:', error);
    res.status(500).json({ error: 'Failed to process uploaded image' });
  }
};

export const deleteUpload = async (req, res) => {
  try {
    const url = req.body?.url;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing photo url' });
    }

    const expectedPrefix = '/uploads/';
    if (!url.startsWith(expectedPrefix)) {
      return res.status(400).json({ error: 'Invalid photo url' });
    }

    const filename = basename(url);
    const filePath = join(uploadPath, filename);
    const thumbPath = join(uploadPath, buildThumbFilename(filename));

    await fsPromises.unlink(filePath);
    await fsPromises.unlink(thumbPath).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
    res.json({ success: true, filename });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json({ success: true, missing: true });
    }

    console.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete photo file' });
  }
};
