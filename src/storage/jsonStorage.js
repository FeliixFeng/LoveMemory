import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = env.DATA_FILE || join(__dirname, '../../data/db.json');

const DEFAULT_DATA = {
  startDate: '',
  heroImage: '',
  milestones: [],
  photos: []
};

async function ensureDataFile() {
  try {
    await fs.mkdir(dirname(DATA_FILE), { recursive: true });
    await fs.access(DATA_FILE);
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    if (!content.trim()) {
      throw new Error('Empty file');
    }
    JSON.parse(content);
  } catch (error) {
    console.log('Resetting db.json due to error:', error.message);
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

async function readRawData() {
  await ensureDataFile();
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function getDataFromJson() {
  try {
    return await readRawData();
  } catch (error) {
    console.error('Read JSON data error:', error);
    return DEFAULT_DATA;
  }
}

export async function saveDataToJson(payload) {
  await ensureDataFile();

  let currentData = DEFAULT_DATA;
  try {
    currentData = await readRawData();
  } catch (error) {
    console.warn('Failed to parse existing JSON data, starting fresh.');
  }

  const newData = {
    ...currentData,
    ...payload
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
  return newData;
}

export { DEFAULT_DATA, DATA_FILE };
