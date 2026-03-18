import mysql from 'mysql2/promise';
import env from '../config/env.js';
import { DEFAULT_DATA } from './jsonStorage.js';

let pool = null;
let schemaReady = false;

function normalizeMilestoneId(id) {
  const idString = String(id);
  if (/^\d+$/.test(idString)) {
    return Number(idString);
  }
  return idString;
}

function createPool() {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
}

async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  const mysqlPool = createPool();
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id TINYINT PRIMARY KEY,
      start_date VARCHAR(20) NOT NULL DEFAULT '',
      hero_image LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS photos (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      url TEXT NOT NULL,
      uploaded_at VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  schemaReady = true;
}

async function readDataWithConnection(connection) {
  const [settingsRows] = await connection.query(
    'SELECT start_date, hero_image FROM settings WHERE id = 1 LIMIT 1'
  );
  const [milestoneRows] = await connection.query(
    'SELECT id, date, title, description, icon FROM milestones ORDER BY date DESC, created_at DESC'
  );
  const [photoRows] = await connection.query(
    'SELECT url, uploaded_at FROM photos ORDER BY id ASC'
  );

  return {
    startDate: settingsRows[0]?.start_date || '',
    heroImage: settingsRows[0]?.hero_image || '',
    milestones: milestoneRows.map((item) => ({
      id: normalizeMilestoneId(item.id),
      date: item.date,
      title: item.title,
      desc: item.description,
      icon: item.icon
    })),
    photos: photoRows.map((item) => ({
      url: item.url,
      uploadedAt: item.uploaded_at
    }))
  };
}

export async function getDataFromMysql() {
  await ensureSchema();
  const mysqlPool = createPool();
  return readDataWithConnection(mysqlPool);
}

export async function saveDataToMysql(payload) {
  await ensureSchema();
  const mysqlPool = createPool();
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const currentData = await readDataWithConnection(connection);
    const newData = {
      ...DEFAULT_DATA,
      ...currentData,
      ...payload
    };

    await connection.query(
      `
        INSERT INTO settings (id, start_date, hero_image)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE
          start_date = VALUES(start_date),
          hero_image = VALUES(hero_image)
      `,
      [newData.startDate || '', newData.heroImage || '']
    );

    if (Array.isArray(payload.milestones)) {
      await connection.query('DELETE FROM milestones');
      for (const milestone of newData.milestones) {
        await connection.query(
          `
            INSERT INTO milestones (id, date, title, description, icon)
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            String(milestone.id),
            milestone.date || '',
            milestone.title || '',
            milestone.desc || '',
            milestone.icon || 'ph-heart'
          ]
        );
      }
    }

    if (Array.isArray(payload.photos)) {
      await connection.query('DELETE FROM photos');
      for (const photo of newData.photos) {
        await connection.query(
          `
            INSERT INTO photos (url, uploaded_at)
            VALUES (?, ?)
          `,
          [photo.url || '', photo.uploadedAt || new Date().toISOString()]
        );
      }
    }

    await connection.commit();
    return newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeMysqlPool() {
  if (!pool) {
    return;
  }
  await pool.end();
  pool = null;
  schemaReady = false;
}
