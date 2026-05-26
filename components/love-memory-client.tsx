'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Milestone, Photo, AppData } from '../lib/types';
import { HERO_IMAGES, ICONS, ICON_MAP } from '../lib/constants';
import { getEmoji, fmt } from '../lib/utils';
import { FallingHearts } from './FallingHearts';
import { NavBar } from './NavBar';
import { HeroSection } from './HeroSection';
import { LoveQuotes } from './LoveQuotes';
import { MilestoneList } from './MilestoneList';
import { PhotoGrid } from './PhotoGrid';
import { Gallery } from './Gallery';
import { Lightbox } from './Lightbox';
import { Toast } from './Toast';
import { MilestoneModal } from './modals/MilestoneModal';
import { SettingsModal } from './modals/SettingsModal';
import { DeleteConfirmDialog } from './modals/DeleteConfirmDialog';
import { CoverMenu } from './modals/CoverMenu';

function useAnimatedNum(target: number) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current, diff = target - start;
    if (diff === 0) return;
    let step = 0;
    const t = setInterval(() => { step++; setVal(Math.round(start + diff * (step / 30))); if (step >= 30) { setVal(target); clearInterval(t); } }, 30);
    prev.current = target;
    return () => clearInterval(t);
  }, [target]);
  return val;
}

export function LoveMemoryClient() {
  const [data, setData] = useState<AppData>({ startDate: '', heroImage: '', milestones: [], photos: [], loveQuotes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null);
  const [gallery, setGallery] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Photo | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [editMs, setEditMs] = useState<Milestone | null>(null);
  const [msDraft, setMsDraft] = useState({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart' });
  const [msModal, setMsModal] = useState(false);
  const [settings, setSettings] = useState(false);
  const [coverMenu, setCoverMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => {
      setData({ ...d, milestones: (d.milestones || []).sort((a: Milestone, b: Milestone) => new Date(b.date).getTime() - new Date(a.date).getTime()), photos: (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url })) });
    }).catch(() => setToast('加载失败')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);

  useEffect(() => { if (data.loveQuotes.length <= 1) return; const t = setInterval(() => setQuoteIdx(i => (i + 1) % data.loveQuotes.length), 4500); return () => clearInterval(t); }, [data.loveQuotes.length]);

  const days = useMemo(() => data.startDate ? Math.max(0, Math.floor((Date.now() - new Date(`${data.startDate}T00:00:00`).getTime()) / 86400000)) : 0, [data.startDate]);
  const animDays = useAnimatedNum(days);
  const nextDays = useMemo(() => {
    if (!data.startDate) return 0;
    const s = new Date(`${data.startDate}T00:00:00`), n = new Date(), nx = new Date(n.getFullYear(), s.getMonth(), s.getDate());
    if (nx.getTime() < n.getTime()) nx.setFullYear(n.getFullYear() + 1);
    return Math.ceil((nx.getTime() - n.getTime()) / 86400000);
  }, [data.startDate]);
  const heroImages = data.heroImage ? [data.heroImage, ...HERO_IMAGES] : HERO_IMAGES;

  async function save(next: AppData, msg?: string) {
    const prev = data;
    setData(next);
    if (msg) setToast(msg);
    setSaving(true);
    try {
      const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      if (!r.ok) throw new Error();
    } catch {
      setData(prev);
      setToast('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  async function doUpload(file: File) {
    const fd = new FormData(); fd.append('image', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd }); if (!r.ok) throw new Error();
    const d = await r.json(); return { ...d, displayUrl: d.displayUrl || d.url, thumbUrl: d.thumbUrl || d.displayUrl || d.url } as Photo;
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return; setUploading(true);
    try { const up: Photo[] = []; for (const f of files) up.push(await doUpload(f)); await save({ ...data, photos: [...up.reverse(), ...data.photos] }, '已上传'); } catch { setToast('上传失败'); } finally { setUploading(false); e.target.value = ''; }
  }

  async function onDelPhoto(p: Photo) {
    setDeleting(p.url);
    try { await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url }) }); await save({ ...data, photos: data.photos.filter(x => x.url !== p.url) }, '已删除'); if (viewPhoto?.url === p.url) setViewPhoto(null); } catch { setToast('删除失败'); } finally { setDeleting(''); }
  }

  async function onHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try { const u = await doUpload(file); await save({ ...data, heroImage: u.displayUrl || u.url }, '封面已更新'); } catch { setToast('上传失败'); } finally { setUploading(false); e.target.value = ''; }
  }

  function openMsCreate() { setEditMs(null); setMsDraft({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart' }); setMsModal(true); }
  function openMsEdit(m: Milestone) { setEditMs(m); setMsDraft({ date: m.date, title: m.title, desc: m.desc, icon: ICON_MAP[m.icon] || m.icon }); setMsModal(true); }

  async function saveMs() {
    if (!msDraft.title || !msDraft.date) { setToast('请填写标题和日期'); return; }
    const next: Milestone = editMs ? { ...editMs, ...msDraft } : { ...msDraft, id: Date.now() };
    const list = editMs ? data.milestones.map(m => m.id === editMs.id ? next : m) : [...data.milestones, next];
    const sorted = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMsModal(false); setEditMs(null);
    await save({ ...data, milestones: sorted }, '已保存');
  }

  async function deleteMs() { if (!editMs) return; await save({ ...data, milestones: data.milestones.filter(m => m.id !== editMs.id) }, '已删除'); setMsModal(false); setEditMs(null); }

  function onDragStart(index: number) { setDragIndex(index); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onLongPressStart(p: Photo) {
    const timer = setTimeout(() => setDeleteConfirm(p), 500);
    setLongPressTimer(timer);
  }
  function onLongPressEnd() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }
  async function confirmDelete() {
    if (!deleteConfirm) return;
    await onDelPhoto(deleteConfirm);
    setDeleteConfirm(null);
  }
  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const photos = [...data.photos];
    const [moved] = photos.splice(dragIndex, 1);
    photos.splice(targetIndex, 0, moved);
    void save({ ...data, photos }, '已排序');
    setDragIndex(null);
  }

  const currentPhotoIndex = viewPhoto ? data.photos.findIndex(p => p.url === viewPhoto.url) : -1;
  function goToPhoto(index: number) {
    const len = data.photos.length;
    if (len === 0) return;
    const next = (index + len) % len;
    setViewPhoto(data.photos[next]);
  }

  useEffect(() => {
    if (!viewPhoto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPhoto(currentPhotoIndex - 1);
      if (e.key === 'ArrowRight') goToPhoto(currentPhotoIndex + 1);
      if (e.key === 'Escape') setViewPhoto(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewPhoto, currentPhotoIndex]);

  useEffect(() => {
    if (!viewPhoto || data.photos.length <= 1) return;
    const prev = data.photos[(currentPhotoIndex - 1 + data.photos.length) % data.photos.length];
    const next = data.photos[(currentPhotoIndex + 1) % data.photos.length];
    [prev, next].forEach(p => { const img = new Image(); img.src = p.displayUrl || p.url; });
  }, [viewPhoto, currentPhotoIndex]);

  if (loading) return <main className="flex min-h-screen items-center justify-center"><div className="lm-card rounded-full px-6 py-3 text-sm font-medium text-[#5c3d2a]"><span className="mr-2">💕</span>加载中...</div></main>;

  return (
    <>
      <FallingHearts />
      <NavBar onSettings={() => setSettings(true)} />

      <main className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto pt-20 pb-24 px-4 md:px-8 flex flex-col gap-6">
        <HeroSection
          heroImages={heroImages} saving={saving}
          animDays={animDays} nextDays={nextDays} startDate={data.startDate}
          onCoverMenu={() => setCoverMenu(true)}
          onHeroUpload={onHeroUpload}
          heroRef={heroRef}
        />

        <LoveQuotes quotes={data.loveQuotes} />

        <MilestoneList
          milestones={data.milestones}
          onEdit={openMsEdit}
          onCreate={openMsCreate}
        />

        <PhotoGrid
          photos={data.photos} uploading={uploading} deleting={deleting} dragIndex={dragIndex}
          onViewPhoto={setViewPhoto}
          onDeleteConfirm={setDeleteConfirm}
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
          onLongPressStart={onLongPressStart} onLongPressEnd={onLongPressEnd}
          onAddClick={() => fileRef.current?.click()}
        />

        <footer className="text-center py-6 opacity-30"><span className="text-sm">💕</span></footer>
      </main>

      {msModal && (
        <MilestoneModal
          editMs={editMs} msDraft={msDraft} setMsDraft={setMsDraft}
          onSave={() => void saveMs()}
          onDelete={() => void deleteMs()}
          onClose={() => setMsModal(false)}
        />
      )}

      {settings && (
        <SettingsModal
          startDate={data.startDate}
          onSave={date => void save({ ...data, startDate: date }, '已保存')}
          onClose={() => setSettings(false)}
        />
      )}

      {coverMenu && (
        <CoverMenu
          hasHeroImage={!!data.heroImage}
          onChangeCover={() => { heroRef.current?.click(); setCoverMenu(false); }}
          onResetDefault={() => { void save({ ...data, heroImage: '' }, '已恢复'); setCoverMenu(false); }}
          onClose={() => setCoverMenu(false)}
        />
      )}

      {gallery && (
        <Gallery
          photos={data.photos} deleting={deleting}
          onViewPhoto={p => { setViewPhoto(p); setGallery(false); }}
          onDelete={p => void onDelPhoto(p)}
          onAdd={() => fileRef.current?.click()}
          onClose={() => setGallery(false)}
        />
      )}

      {viewPhoto && (
        <Lightbox
          photo={viewPhoto} hasMultiple={data.photos.length > 1}
          onClose={() => setViewPhoto(null)}
          onPrev={() => goToPhoto(currentPhotoIndex - 1)}
          onNext={() => goToPhoto(currentPhotoIndex + 1)}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          photo={deleteConfirm}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <Toast message={toast} />

      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onPhotoUpload} />
    </>
  );
}
