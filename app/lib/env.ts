import path from 'node:path';

export function getStorageDriver() {
  return (process.env.STORAGE_DRIVER || 'json').toLowerCase();
}

export function getDataFilePath() {
  return process.env.DATA_FILE || path.join(process.cwd(), 'data/db.json');
}

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');
}

export function getPin() {
  return process.env.APP_PIN || '';
}
