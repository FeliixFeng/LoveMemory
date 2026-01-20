import { Router } from 'express';
import { upload, handleUpload } from '../controllers/uploadController.js';
import { getData, saveData } from '../controllers/dataController.js';

const router = Router();

// 图片上传路由
router.post('/upload', upload.single('image'), handleUpload);

// 数据同步路由
router.get('/data', getData);
router.post('/data', saveData);

export default router;
