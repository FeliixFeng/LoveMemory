import mysql from 'mysql2/promise';
import { basename } from 'path';
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

function normalizePhotoRecord(photo) {
  const url = photo?.url || '';
  const fallbackFilename = url.startsWith('/uploads/') ? basename(url) : '';

  return {
    url,
    filename: photo?.filename || fallbackFilename,
    mimeType: photo?.mimeType || '',
    size: Number(photo?.size) || 0,
    uploadedAt: photo?.uploadedAt || new Date().toISOString()
  };
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
      filename VARCHAR(255) NOT NULL DEFAULT '',
      mime_type VARCHAR(100) NOT NULL DEFAULT '',
      file_size INT UNSIGNED NOT NULL DEFAULT 0,
      uploaded_at VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensurePhotoColumn(mysqlPool, 'filename', "ALTER TABLE photos ADD COLUMN filename VARCHAR(255) NOT NULL DEFAULT ''");
  await ensurePhotoColumn(mysqlPool, 'mime_type', "ALTER TABLE photos ADD COLUMN mime_type VARCHAR(100) NOT NULL DEFAULT ''");
  await ensurePhotoColumn(mysqlPool, 'file_size', 'ALTER TABLE photos ADD COLUMN file_size INT UNSIGNED NOT NULL DEFAULT 0');

  schemaReady = true;
}

async function ensurePhotoColumn(mysqlPool, columnName, alterSql) {
  const [rows] = await mysqlPool.query(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'photos'
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [env.MYSQL_DATABASE, columnName]
  );

  if (rows.length === 0) {
    await mysqlPool.query(alterSql);
  }
}

async function readDataWithConnection(connection) {
  const [settingsRows] = await connection.query(
    'SELECT start_date, hero_image FROM settings WHERE id = 1 LIMIT 1'
  );
  const [milestoneRows] = await connection.query(
    'SELECT id, date, title, description, icon FROM milestones ORDER BY date DESC, created_at DESC'
  );
  const [photoRows] = await connection.query(
    'SELECT url, filename, mime_type, file_size, uploaded_at FROM photos ORDER BY id DESC'
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
    photos: photoRows.map((item) =>
      normalizePhotoRecord({
        url: item.url,
        filename: item.filename,
        mimeType: item.mime_type,
        size: item.file_size,
        uploadedAt: item.uploaded_at
      })
    )
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
      const milestoneIds = newData.milestones.map((milestone) => String(milestone.id));

      if (milestoneIds.length > 0) {
        await connection.query(
          `DELETE FROM milestones WHERE id NOT IN (${milestoneIds.map(() => '?').join(', ')})`,
          milestoneIds
        );
      } else {
        await connection.query('DELETE FROM milestones');
      }

      for (const milestone of newData.milestones) {
        await connection.query(
          `
            INSERT INTO milestones (id, date, title, description, icon)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              date = VALUES(date),
              title = VALUES(title),
              description = VALUES(description),
              icon = VALUES(icon)
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
      const normalizedPhotos = newData.photos
        .map((photo) => normalizePhotoRecord(photo))
        .filter((photo) => photo.url);
      const photoUrls = normalizedPhotos.map((photo) => photo.url).filter(Boolean);
      newData.photos = normalizedPhotos;

      if (photoUrls.length > 0) {
        await connection.query(
          `DELETE FROM photos WHERE url NOT IN (${photoUrls.map(() => '?').join(', ')})`,
          photoUrls
        );
      } else {
        await connection.query('DELETE FROM photos');
      }

      for (const photo of normalizedPhotos) {
        const [existingRows] = await connection.query(
          'SELECT id FROM photos WHERE url = ? LIMIT 1',
          [photo.url]
        );

        if (existingRows.length > 0) {
          await connection.query(
            `
              UPDATE photos
              SET filename = ?, mime_type = ?, file_size = ?, uploaded_at = ?
              WHERE id = ?
            `,
            [photo.filename, photo.mimeType, photo.size, photo.uploadedAt, existingRows[0].id]
          );
          continue;
        }

        await connection.query(
          `
            INSERT INTO photos (url, filename, mime_type, file_size, uploaded_at)
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            photo.url,
            photo.filename,
            photo.mimeType,
            photo.size,
            photo.uploadedAt
          ]
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
