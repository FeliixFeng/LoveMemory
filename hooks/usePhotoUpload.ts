'use client';

import { useRef, useState } from 'react';
import { Photo, AppData } from '../lib/types';
import { apiFetch, ApiError } from '../app/lib/api-client';
import { UploadAuthError, uploadImageFile } from '../lib/upload-client';
import type { SettingsPatch } from '../app/lib/schemas';

export function usePhotoUpload(
  data: AppData,
  setData: (updater: (prev: AppData) => AppData) => void,
  saveSettings: (patch: SettingsPatch, msg?: string) => Promise<void>,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void) => void
) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState('');
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function doUpload(file: File, eventId?: string): Promise<Photo> {
    try {
      return await uploadImageFile(file, {
        eventId,
        onProgress: setUploadProgress
      });
    } catch (err) {
      if (err instanceof UploadAuthError) {
        onAuthRequired(() => { void doUpload(file, eventId); });
      }
      throw err;
    }
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
      setData(prev => ({ ...prev, photos: [...up.reverse(), ...prev.photos] }));
      setToast('已上传');
    } catch (err) {
      if (!(err instanceof UploadAuthError)) setToast('上传失败');
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
      const affectedEvents = data.events.filter(
        ev => ev.coverPhoto && (ev.coverPhoto === p.url || ev.coverPhoto === p.displayUrl)
      );
      setData(prev => ({
        ...prev,
        photos: prev.photos.filter(x => x.url !== p.url),
        events: prev.events.map(ev =>
          ev.coverPhoto && (ev.coverPhoto === p.url || ev.coverPhoto === p.displayUrl)
            ? { ...ev, coverPhoto: '' }
            : ev
        )
      }));
      for (const ev of affectedEvents) {
        void apiFetch(`/api/events/${ev.id}`, { method: 'PUT', body: { coverPhoto: '' } }).catch(() => {});
      }
      setToast('已删除');
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
      await saveSettings({ customCovers: [...data.customCovers, url] }, '封面已添加');
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => { void onHeroUpload(e); });
      } else if (!(err instanceof UploadAuthError)) {
        setToast('封面保存失败');
      }
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
