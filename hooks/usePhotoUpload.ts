'use client';

import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Photo, AppData } from '../lib/types';
import { apiFetch, ApiError } from '../app/lib/api-client';

const COMPRESS_OPTIONS = {
  maxSizeMB: 1.5,           // 最大 1.5MB
  maxWidthOrHeight: 2048,   // 长边不超过 2048px
  useWebWorker: true,       // 用 Web Worker 不阻塞 UI
  fileType: 'image/jpeg',   // 统一输出 JPEG
  initialQuality: 0.85      // 85% 质量
};

async function compressImage(file: File): Promise<File> {
  // 跳过非图片文件
  if (!file.type.startsWith('image/')) return file;
  // 跳过已经够小的图片（< 500KB）
  if (file.size < 500 * 1024) return file;

  try {
    const compressed = await imageCompression(file, COMPRESS_OPTIONS);
    // 如果压缩后反而更大（罕见），返回原图
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file; // 压缩失败就上传原图
  }
}

export function usePhotoUpload(
  data: AppData,
  save: (next: AppData, msg?: string) => Promise<boolean>,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void) => void
) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState('');
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function doUpload(file: File, eventId?: string): Promise<Photo> {
    // 上传前压缩
    const compressed = await compressImage(file);

    const fd = new FormData();
    fd.append('image', compressed, compressed.name || file.name);
    if (eventId) fd.append('eventId', eventId);

    return new Promise<Photo>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      const token = typeof window !== 'undefined' ? localStorage.getItem('lm_token') : null;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status === 401) {
          onAuthRequired(() => doUpload(file, eventId).then(() => {}));
          reject(new Error('auth'));
          return;
        }
        if (xhr.status !== 200) { reject(new Error()); return; }
        const d = JSON.parse(xhr.responseText);
        resolve({ ...d, displayUrl: d.displayUrl || d.url, thumbUrl: d.thumbUrl || d.displayUrl || d.url } as Photo);
      };

      xhr.onerror = () => reject(new Error());
      xhr.send(fd);
    });
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>, selectedEventId: string | null) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const up: Photo[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(Math.round((i / files.length) * 100));
        up.push(await doUpload(files[i], selectedEventId || undefined));
      }
      setUploadProgress(100);
      await save({ ...data, photos: [...up.reverse(), ...data.photos] }, '已上传');
    } catch (err) {
      if ((err as Error)?.message !== 'auth') setToast('上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  }

  async function onDelPhoto(p: Photo) {
    setDeleting(p.url);
    try {
      await apiFetch('/api/upload', { method: 'DELETE', body: { url: p.url } });
      await save({ ...data, photos: data.photos.filter(x => x.url !== p.url) }, '已删除');
      if (viewPhoto && viewPhoto.photos[viewPhoto.index]?.url === p.url) setViewPhoto(null);
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => onDelPhoto(p));
      } else {
        setToast('删除失败');
      }
    } finally {
      setDeleting('');
    }
  }

  async function onHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const u = await doUpload(file);
      const url = u.displayUrl || u.url;
      await save({ ...data, customCovers: [...data.customCovers, url] }, '封面已添加');
    } catch (err) {
      if ((err as Error)?.message !== 'auth') setToast('上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return {
    uploading, uploadProgress, deleting, viewPhoto, setViewPhoto, fileRef,
    doUpload, onPhotoUpload, onDelPhoto, onHeroUpload
  };
}
