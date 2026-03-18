import fs from 'fs/promises';
import { DATA_FILE, DEFAULT_DATA } from '../src/storage/jsonStorage.js';
import { saveDataToMysql, getDataFromMysql, closeMysqlPool } from '../src/storage/mysqlStorage.js';

async function readJsonData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    if (!content.trim()) {
      return DEFAULT_DATA;
    }
    const parsed = JSON.parse(content);
    return {
      ...DEFAULT_DATA,
      ...parsed
    };
  } catch (error) {
    console.warn('Failed to read db.json, fallback to default data:', error.message);
    return DEFAULT_DATA;
  }
}

async function main() {
  const jsonData = await readJsonData();
  await saveDataToMysql(jsonData);
  const mysqlData = await getDataFromMysql();

  console.log('Migration complete.');
  console.log(`Milestones: ${jsonData.milestones.length} -> ${mysqlData.milestones.length}`);
  console.log(`Photos: ${jsonData.photos.length} -> ${mysqlData.photos.length}`);
  console.log(`StartDate: ${mysqlData.startDate || '(empty)'}`);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMysqlPool();
  });
