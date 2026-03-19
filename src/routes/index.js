import { Router } from 'express';
import { upload, handleUpload, deleteUpload } from '../controllers/uploadController.js';
import { getData, saveData } from '../controllers/dataController.js';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/health', getHealth);

// 图片上传路由
router.post('/upload', upload.single('image'), handleUpload);
router.delete('/upload', deleteUpload);

// 数据同步路由
router.get('/data', getData);
router.post('/data', saveData);

export default router;
