import { readAppData, writeAppData } from '../storage/index.js';
import { DEFAULT_DATA } from '../storage/jsonStorage.js';

// 获取数据
export const getData = async (req, res) => {
  try {
    const data = await readAppData();
    res.json(data);
  } catch (error) {
    console.error('Read data error:', error);
    // 兜底返回默认数据，不让前端挂掉
    res.json(DEFAULT_DATA);
  }
};

// 保存数据 (全量覆盖更新)
export const saveData = async (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const newData = await writeAppData(payload);
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
};
