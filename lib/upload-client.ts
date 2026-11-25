'use client';

import imageCompression from 'browser-image-compression';
import type { Photo } from './types';

const COMPRESS_OPTIONS = {
  maxSizeMB: 1.5,           // 最大 1.5MB
  maxWidthOrHeight: 2048,   // 长边不超过 2048px
  useWebWorker: true,       // 用 Web Worker 不阻塞 UI
  fileType: 'image/jpeg',   // 统一输出 JPEG
  initialQuality: 0.85      // 85% 质量
};

export class UploadAuthError extends Error {
  constructor() {
    super('auth');
    this.name = 'UploadAuthError';
  }
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  // 跳过已足够小的图（< 500KB）
  if (file.size < 500 * 1024) return file;

  try {
    const compressed = await imageCompression(file, COMPRESS_OPTIONS);
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}

export async function uploadImageFile(
  file: File,
  opts?: {
    eventId?: string;
    onProgress?: (percent: number) => void;
  }
): Promise<Photo> {
  const compressed = await compressImageFile(file);
  const fd = new FormData();
  fd.append('image', compressed, compressed.name || file.name);
  if (opts?.eventId) fd.append('eventId', opts.eventId);

  return new Promise<Photo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    const token = typeof window !== 'undefined' ? localStorage.getItem('lm_token') : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts?.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new UploadAuthError());
        return;
      }
      if (xhr.status !== 200) {
        reject(new Error('upload_failed'));
        return;
      }
      const d = JSON.parse(xhr.responseText);
      resolve({
        ...d,
        displayUrl: d.displayUrl || d.url,
        thumbUrl: d.thumbUrl || d.displayUrl || d.url
      } as Photo);
    };

    xhr.onerror = () => reject(new Error('network_error'));
    xhr.send(fd);
  });
}
