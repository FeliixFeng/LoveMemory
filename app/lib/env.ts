import path from 'node:path';

export function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');
}

export function getPin() {
  return process.env.APP_PIN || '';
}
