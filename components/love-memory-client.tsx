'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Milestone = { id: number | string; date: string; title: string; desc: string; icon: string };
type Photo = { url: string; displayUrl?: string; thumbUrl?: string; filename?: string; mimeType?: string; size?: number; uploadedAt: string };
type LoveQuote = { id: number; content: string };
type AppData = { startDate: string; heroImage: string; milestones: Milestone[]; photos: Photo[]; loveQuotes: LoveQuote[] };

const HERO_IMAGES = [
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/1.jpg?v=20260524',
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/2.jpg?v=20260524',
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/3.jpg?v=20260524',
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/4.jpg?v=20260524',
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/5.jpg?v=20260524',
  'https://lovememory.oss-cn-wuhan-lr.aliyuncs.com/hero/6.jpg?v=20260524'
];
const ICONS = [
  { id: 'heart', emoji: '💕', label: '心动' },
  { id: 'airplane', emoji: '✈️', label: '旅行' },
  { id: 'house', emoji: '🏠', label: '日常' },
  { id: 'ring', emoji: '💍', label: '纪念' },
  { id: 'camera', emoji: '📷', label: '照片' },
  { id: 'star', emoji: '⭐', label: '特别' },
  { id: 'gift', emoji: '🎁', label: '礼物' },
  { id: 'cake', emoji: '🎂', label: '生日' },
  { id: 'music', emoji: '🎵', label: '音乐' },
  { id: 'food', emoji: '🍽️', label: '美食' },
  { id: 'park', emoji: '🌳', label: '公园' },
  { id: 'movie', emoji: '🎬', label: '电影' },
];
const ICON_MAP: Record<string, string> = { 'ph-heart': 'heart', 'ph-airplane-tilt': 'airplane', 'ph-house': 'house', 'ph-ring': 'ring', 'ph-camera': 'camera', 'ph-star': 'star' };
function getEmoji(icon: string) { return ICONS.find(i => i.id === (ICON_MAP[icon] || icon))?.emoji || '💕'; }

function fmt(d: string) {
  if (!d) return '--';
  return new Date(`${d}T00:00:00`).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

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
  const [editMs, setEditMs] = useState<Milestone | null>(null);
  const [msDraft, setMsDraft] = useState({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart' });
  const [msModal, setMsModal] = useState(false);
  const [settings, setSettings] = useState(false);
  const [coverMenu, setCoverMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [heroIdx, setHeroIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [hearts] = useState(() => Array.from({ length: 6 }).map(() => ({
    left: `${Math.random() * 100}%`, dur: `${15 + Math.random() * 10}s`, delay: `${-Math.random() * 20}s`,
    opacity: 0.1 + Math.random() * 0.3, size: `${16 + Math.random() * 12}px`, sway: `${3 + Math.random() * 2}s`
  })));

  const fileRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => {
      setData({ ...d, milestones: (d.milestones || []).sort((a: Milestone, b: Milestone) => new Date(b.date).getTime() - new Date(a.date).getTime()), photos: (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url })) });
    }).catch(() => setToast('加载失败')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (HERO_IMAGES.length <= 1) return; const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 6000); return () => clearInterval(t); }, []);
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
    setData(next); setSaving(true);
    try { const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }); if (!r.ok) throw new Error(); if (msg) setToast(msg); } catch { setToast('保存失败'); } finally { setSaving(false); }
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
    await save({ ...data, milestones: list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }, '已保存');
    setMsModal(false); setEditMs(null);
  }
  async function deleteMs() { if (!editMs) return; await save({ ...data, milestones: data.milestones.filter(m => m.id !== editMs.id) }, '已删除'); setMsModal(false); setEditMs(null); }

  function onDragStart(index: number) { setDragIndex(index); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
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

  // Keyboard navigation for lightbox
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

  // Preload adjacent images
  useEffect(() => {
    if (!viewPhoto || data.photos.length <= 1) return;
    const prev = data.photos[(currentPhotoIndex - 1 + data.photos.length) % data.photos.length];
    const next = data.photos[(currentPhotoIndex + 1) % data.photos.length];
    [prev, next].forEach(p => { const img = new Image(); img.src = p.displayUrl || p.url; });
  }, [viewPhoto, currentPhotoIndex]);

  if (loading) return <main className="flex min-h-screen items-center justify-center"><div className="lm-card rounded-full px-6 py-3 text-sm font-medium text-[#5c3d2a]"><span className="mr-2">💕</span>加载中...</div></main>;

  const leftPhotos = data.photos.filter((_, i) => i % 2 === 0);
  const rightPhotos = data.photos.filter((_, i) => i % 2 !== 0);

  return (
    <>
      {/* Falling hearts */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-50" style={{ background: 'rgba(239,216,195,0.4)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-50" style={{ background: 'rgba(255,182,193,0.3)' }} />
        {hearts.map((h, i) => (
          <div key={i} className="absolute -top-8 animate-fall" style={{ left: h.left, opacity: h.opacity, fontSize: h.size, animationDuration: h.dur, animationDelay: h.delay }}>
            <div className="animate-sway" style={{ animationDuration: h.sway }}>💕</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/90 border-b border-[#efd8c3]/30 px-4 py-3">
        <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#aa6f4d] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TODAY</span>
            <span className="text-sm font-semibold text-[#3d281c]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
            <span className="text-[8px] text-[#aa6f4d] tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>OUR STORY</span>
          </div>
          <button onClick={() => setSettings(true)} className="w-8 h-8 rounded-full bg-white border border-[#efd8c3] flex items-center justify-center text-sm hover:bg-amber-50">⚙</button>
        </div>
      </nav>

      <main className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto pt-20 pb-24 px-4 md:px-8 flex flex-col gap-6">
        {/* Hero */}
        <section className="relative rounded-3xl overflow-hidden shadow-lg aspect-[3.5/4.5] md:aspect-[4/3] lg:aspect-[16/9]" style={{ animation: 'slideUp 0.6s ease-out' }}>
          {heroImages.map((img, i) => <img key={i} src={img} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: heroIdx === i ? 1 : 0, transition: 'opacity 1.5s' }} />)}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 text-white text-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={() => setCoverMenu(true)}>✏</button>
          <div className="absolute top-4 left-4"><div className="px-2.5 py-1 rounded-full bg-black/30 text-[10px] text-emerald-400 font-medium tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>{saving ? 'SYNCING' : 'LOVING'}</div></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <span className="text-[10px] font-medium text-white/70 tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TOGETHER FOR</span>
            <div className="flex items-baseline mt-1">
              <span className="text-7xl font-bold leading-none" style={{ fontFamily: 'Noto Serif SC, serif', textShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>{animDays}</span>
              <span className="text-2xl font-light italic opacity-80 ml-2 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Days</span>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-white/70">
              <span>📅 {fmt(data.startDate)}</span><span>·</span><span>⏰ 下次 {nextDays} 天</span>
            </div>
          </div>
          <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
        </section>

        {/* Love Quotes */}
        {data.loveQuotes.length > 0 && (
          <div className="text-center py-2" style={{ animation: 'slideUp 0.6s ease-out 0.05s both' }}>
            <div className="relative h-8 overflow-hidden">
              {data.loveQuotes.map((quote, i) => (
                <p
                  key={quote.id}
                  className="absolute inset-0 flex items-center justify-center text-sm text-[#aa6f4d] italic transition-opacity duration-1000"
                  style={{
                    fontFamily: 'Noto Serif SC, serif',
                    opacity: quoteIdx === i ? 1 : 0
                  }}
                >
                  "{quote.content}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        <div style={{ animation: 'slideUp 0.6s ease-out 0.1s both' }}>
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>恋爱里程碑</h2>
            <span className="text-[10px] text-[#aa6f4d] font-bold tracking-widest uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>MILESTONES</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {data.milestones.map(m => (
              <div key={m.id} onClick={() => openMsEdit(m)} className="flex-none w-36 p-3 rounded-2xl bg-white border border-[#efd8c3]/40 shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
                <span className="text-xl mb-2 block">{getEmoji(m.icon)}</span>
                <p className="text-[10px] text-[#aa6f4d] mb-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>{m.date.replace(/-/g, '.')}</p>
                <p className="text-sm font-semibold text-[#3d281c] truncate">{m.title}</p>
                <p className="text-[10px] text-[#aa6f4d]/70 truncate">{m.desc || '—'}</p>
              </div>
            ))}
            <div onClick={openMsCreate} className="flex-none w-16 flex flex-col items-center justify-center gap-1 cursor-pointer group">
              <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#efd8c3] flex items-center justify-center text-[#aa6f4d] group-hover:bg-amber-50 group-hover:border-[#d48b60] transition-colors text-lg">+</div>
              <span className="text-[10px] text-[#aa6f4d]">Add</span>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>甜蜜瞬间</h2>
            <div className="flex gap-2">
              {data.photos.length > 0 && <button onClick={() => setGallery(true)} className="text-[10px] text-[#aa6f4d] font-bold tracking-widest uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>VIEW ALL</button>}
              <label className="lm-btn cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold">
                {uploading ? '上传中...' : '+ 添加'}
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onPhotoUpload} />
              </label>
            </div>
          </div>
          {data.photos.length === 0 ? (
            <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#efd8c3] flex flex-col items-center justify-center text-[#aa6f4d] cursor-pointer hover:bg-amber-50/50" onClick={() => fileRef.current?.click()}>
              <span className="text-3xl mb-2">📷</span><span className="text-sm">上传第一张照片</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {data.photos.map((p, idx) => (
                <div key={p.uploadedAt} draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={() => onDrop(idx)} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-amber-50 transition-opacity ${dragIndex === idx ? 'opacity-50' : ''}`} onClick={() => setViewPhoto(p)}>
                  <img src={p.thumbUrl || p.url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                    <button disabled={deleting === p.url} onClick={e => { e.stopPropagation(); void onDelPhoto(p); }} className="w-7 h-7 rounded-full bg-white/90 text-red-500 text-xs flex items-center justify-center">🗑</button>
                  </div>
                </div>
              ))}
              <div className="aspect-square rounded-2xl border-2 border-dashed border-[#efd8c3]/60 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/50" onClick={() => fileRef.current?.click()}>
                <span className="text-[#aa6f4d] text-lg">+</span><span className="text-[10px] text-[#aa6f4d]">Add</span>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center py-6 opacity-30"><span className="text-sm">💕</span></footer>
      </main>

      {/* Milestone Modal */}
      {msModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMsModal(false)} />
          <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{editMs ? '编辑里程碑' : '新里程碑'}</h3>
              {editMs && <button onClick={void deleteMs} className="text-red-400 text-sm">删除</button>}
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
              {ICONS.map(ic => <button key={ic.id} onClick={() => setMsDraft(d => ({ ...d, icon: ic.id }))} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${msDraft.icon === ic.id ? 'bg-[#d48b60] border-[#d48b60] scale-105' : 'bg-white border-amber-100'}`}>{ic.emoji}</button>)}
            </div>
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="标题" value={msDraft.title} onChange={e => setMsDraft(d => ({ ...d, title: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
              <input type="date" value={msDraft.date} onChange={e => setMsDraft(d => ({ ...d, date: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
              <input type="text" placeholder="备注（可选）" value={msDraft.desc} onChange={e => setMsDraft(d => ({ ...d, desc: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
            </div>
            <button onClick={void saveMs} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">保存</button>
          </div>
        </div>
      )}

      {/* Settings */}
      {settings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSettings(false)} />
          <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-[#3d281c] mb-4 text-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>设置纪念日</h3>
            <input type="date" value={data.startDate} onChange={e => { void save({ ...data, startDate: e.target.value }, '已保存'); }} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] mb-4" />
            <button onClick={() => setSettings(false)} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">完成</button>
          </div>
        </div>
      )}

      {/* Cover Menu */}
      {coverMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCoverMenu(false)} />
          <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl overflow-hidden shadow-xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="py-2.5 px-4 border-b border-gray-100 text-center"><span className="text-xs text-gray-400 font-medium">Manage Cover</span></div>
            <button onClick={() => { heroRef.current?.click(); setCoverMenu(false); }} className="w-full py-3 text-sm text-[#3d281c] border-b border-gray-100">🖼 更换封面</button>
            {data.heroImage && <button onClick={() => { void save({ ...data, heroImage: '' }, '已恢复'); setCoverMenu(false); }} className="w-full py-3 text-sm text-red-500 border-b border-gray-100">🗑 恢复默认</button>}
            <button onClick={() => setCoverMenu(false)} className="w-full py-3 text-sm text-gray-500">取消</button>
          </div>
        </div>
      )}

      {/* Gallery */}
      {gallery && (
        <div className="fixed inset-0 z-50 bg-[#fdfbf7] flex flex-col" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#efd8c3]/30">
            <button onClick={() => setGallery(false)} className="text-sm text-[#3d281c]">← 返回</button>
            <span className="text-sm font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>甜蜜瞬间</span>
            <button onClick={() => fileRef.current?.click()} className="text-sm text-[#aa6f4d]">+ 添加</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
              {data.photos.map(p => (
                <div key={p.uploadedAt} className="relative aspect-square bg-amber-50 cursor-pointer group" onClick={() => { setViewPhoto(p); setGallery(false); }}>
                  <img src={p.thumbUrl || p.url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <button disabled={deleting === p.url} onClick={e => { e.stopPropagation(); void onDelPhoto(p); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
            {data.photos.length === 0 && <p className="text-center text-[#aa6f4d] text-sm py-20">还没有照片</p>}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setViewPhoto(null)}>
          <button className="absolute top-4 right-4 text-white text-xl z-10" onClick={() => setViewPhoto(null)}>✕</button>
          {data.photos.length > 1 && (
            <>
              <button className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors z-10" onClick={e => { e.stopPropagation(); goToPhoto(currentPhotoIndex - 1); }}>‹</button>
              <button className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors z-10" onClick={e => { e.stopPropagation(); goToPhoto(currentPhotoIndex + 1); }}>›</button>
            </>
          )}
          <img src={viewPhoto.displayUrl || viewPhoto.url} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {toast && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#3d281c] text-amber-50 text-xs px-4 py-2 rounded-full shadow-lg">{toast}</div>}
    </>
  );
}
