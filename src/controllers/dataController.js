import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据文件路径 (映射到 Docker 卷)
const DATA_FILE = join(__dirname, '../../data/db.json');

// 默认初始数据
const DEFAULT_DATA = {
  startDate: '',
  heroImage: '', // 存储用户上传的封面图路径
  milestones: [],
  photos: [] // 虽然图片是单独上传的，但 metadata (url, date) 还是存在这比较好管理
};

// 确保数据文件存在
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

// 获取数据
export const getData = async (req, res) => {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Read data error:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
};

// 保存数据 (全量覆盖更新)
export const saveData = async (req, res) => {
  await ensureDataFile();
  try {
    // 读取旧数据以防止意外覆盖未传字段，但在本简单场景下，前端发全量数据
    // 这里做简单的合并
    const currentDataRaw = await fs.readFile(DATA_FILE, 'utf-8');
    const currentData = JSON.parse(currentDataRaw);
    
    const newData = {
      ...currentData,
      ...req.body // 前端传来的部分或全部字段
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
};
