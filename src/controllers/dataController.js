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

// 确保数据文件存在且合法
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
    // 检查文件内容是否为空或非法
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    if (!content.trim()) {
      throw new Error('Empty file');
    }
    JSON.parse(content); // 尝试解析，如果失败会抛错
  } catch (err) {
    console.log('Resetting db.json due to error:', err.message);
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

// 获取数据
export const getData = async (req, res) => {
  try {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Read data error:', error);
    // 兜底返回默认数据，不让前端挂掉
    res.json(DEFAULT_DATA);
  }
};

// 保存数据 (全量覆盖更新)
export const saveData = async (req, res) => {
  try {
    await ensureDataFile();
    // 读取旧数据
    let currentData = DEFAULT_DATA;
    try {
      const currentDataRaw = await fs.readFile(DATA_FILE, 'utf-8');
      currentData = JSON.parse(currentDataRaw);
    } catch (e) {
      console.warn('Failed to parse existing data, starting fresh');
    }
    
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
