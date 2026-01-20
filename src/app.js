/**
 * LoveMemory - 情侣纪念网站
 * 入口文件 (Entry Point)
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import router from './routes/index.js';

// 获取 __dirname (ES Modules 兼容)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 中间件配置 ============

// 跨域支持
app.use(cors());

// JSON 解析 (Crucial for API body parsing)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态资源目录 - 指向 public 文件夹
app.use(express.static(join(__dirname, '../public')));

// ============ 路由配置 ============

app.use('/api', router);

// ============ 启动服务 ============

app.listen(PORT, () => {
  console.log('');
  console.log('  💕 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('     LoveMemory 情侣纪念网站已启动！');
  console.log('');
  console.log(`     🌐 访问地址: http://localhost:${PORT}`);
  console.log('');
  console.log('  💕 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});
