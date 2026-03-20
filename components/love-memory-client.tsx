'use client';

import { useEffect, useMemo, useState } from 'react';

type Milestone = {
  id: number | string;
  date: string;
  title: string;
  desc: string;
  icon: string;
};

type Photo = {
  url: string;
  displayUrl?: string;
  thumbUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: string;
};

type AppData = {
  startDate: string;
  heroImage: string;
  milestones: Milestone[];
  photos: Photo[];
};

type Quote = {
  text: string;
  author: string;
};

type MilestoneIcon = {
  id: string;
  label: string;
  symbol: string;
};

const DEFAULT_MILESTONE: Omit<Milestone, 'id'> = {
  date: '',
  title: '',
  desc: '',
  icon: 'ph-heart'
};

const DEFAULT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1600&auto=format&fit=crop'
];

const QUOTES: Quote[] = [
  { text: 'Time expands, then contracts, all in tune with the stirrings of the heart.', author: 'Haruki Murakami' },
  { text: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' },
  { text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn' },
  { text: 'Love turns ordinary moments into timeless memories.', author: 'Unknown' },
  { text: '初见乍欢，久处仍怦然。', author: '佚名' },
  { text: '那就在一起，晨昏与四季。', author: '佚名' },
  { text: '时间会告诉我们，简单的喜欢最长远。', author: '佚名' }
];

const MILESTONE_ICONS: MilestoneIcon[] = [
  { id: 'ph-heart', label: 'Love', symbol: 'Heart' },
  { id: 'ph-airplane-tilt', label: 'Travel', symbol: 'Trip' },
  { id: 'ph-house', label: 'Home', symbol: 'Home' },
  { id: 'ph-ring', label: 'Ring', symbol: 'Ring' },
  { id: 'ph-camera', label: 'Photo', symbol: 'Photo' },
  { id: 'ph-star', label: 'Star', symbol: 'Star' }
];

function normalizePhoto(photo: Photo): Photo {
  return {
    ...photo,
    displayUrl: photo.displayUrl || photo.url,
    thumbUrl: photo.thumbUrl || photo.displayUrl || photo.url
  };
}

function formatDate(dateString: string) {
  if (!dateString) return '--';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatMilestoneIcon(iconId: string) {
  return MILESTONE_ICONS.find((item) => item.id === iconId)?.symbol || iconId;
}

function sortMilestones(milestones: Milestone[]) {
  return [...milestones].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function createDefaultMilestoneDraft(): Omit<Milestone, 'id'> {
  return {
    ...DEFAULT_MILESTONE,
    date: new Date().toISOString().split('T')[0]
  };
}

export function LoveMemoryClient() {
  const [data, setData] = useState<AppData>({
    startDate: '',
    heroImage: '',
    milestones: [],
    photos: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<Omit<Milestone, 'id'>>(createDefaultMilestoneDraft());
  const [toast, setToast] = useState<string>('');
  const [currentQuote, setCurrentQuote] = useState<Quote>(QUOTES[0]);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const nextQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setCurrentQuote(nextQuote);
  }, []);

  const daysTogether = useMemo(() => {
    if (!data.startDate) return 0;
    const start = new Date(`${data.startDate}T00:00:00`);
    const diff = Date.now() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [data.startDate]);

  const nextAnniversaryDays = useMemo(() => {
    if (!data.startDate) return 0;
    const start = new Date(`${data.startDate}T00:00:00`);
    const now = new Date();
    const next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    if (next.getTime() < now.getTime()) {
      next.setFullYear(now.getFullYear() + 1);
    }
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [data.startDate]);

  const activeHeroImages = useMemo(() => {
    return data.heroImage
      ? [data.heroImage, ...DEFAULT_HERO_IMAGES.slice(0, 3)]
      : DEFAULT_HERO_IMAGES;
  }, [data.heroImage]);

  useEffect(() => {
    setCurrentHeroIndex(0);
  }, [data.heroImage]);

  useEffect(() => {
    if (activeHeroImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentHeroIndex((current) => (current + 1) % activeHeroImages.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [activeHeroImages]);

  async function parseError(response: Response, fallback: string) {
    try {
      const body = await response.json();
      return body.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data', { cache: 'no-store' });
      const nextData = (await response.json()) as AppData;
      setData({
        ...nextData,
        milestones: sortMilestones(nextData.milestones || []),
        photos: (nextData.photos || []).map(normalizePhoto)
      });
    } catch (error) {
      console.error(error);
      setToast('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }

  function refreshQuote() {
    const nextQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setCurrentQuote(nextQuote);
  }

  async function saveData(nextData: AppData, successMessage?: string) {
    setData(nextData);
    setIsSaving(true);
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextData)
      });
      if (!response.ok) {
        throw new Error(await parseError(response, '保存失败'));
      }
      if (successMessage) setToast(successMessage);
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      throw new Error(await parseError(response, '上传失败'));
    }
    return normalizePhoto(await response.json());
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: Photo[] = [];
      for (const file of files) {
        uploaded.push(await uploadSingleFile(file));
      }

      const nextData = {
        ...data,
        photos: [...uploaded.reverse(), ...data.photos]
      };
      await saveData(nextData, '照片已上传');
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function handleDeletePhoto(photo: Photo) {
    setDeletingPhotoUrl(photo.url);
    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photo.url })
      });
      if (!response.ok) {
        throw new Error(await parseError(response, '删除失败'));
      }
      const nextData = {
        ...data,
        photos: data.photos.filter((item) => item.url !== photo.url)
      };
      await saveData(nextData, '照片已删除');
      if (selectedPhoto?.url === photo.url) {
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingPhotoUrl('');
    }
  }

  async function handleHeroUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadSingleFile(file);
      await saveData({ ...data, heroImage: uploaded.displayUrl || uploaded.url }, '封面已更新');
    } catch (error) {
      console.error(error);
      setToast(error instanceof Error ? error.message : '封面上传失败');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function restoreDefaultHero() {
    await saveData({ ...data, heroImage: '' }, '已恢复默认封面');
  }

  function beginMilestoneCreate() {
    setEditingMilestone(null);
    setMilestoneDraft(createDefaultMilestoneDraft());
  }

  function beginMilestoneEdit(milestone: Milestone) {
    setEditingMilestone(milestone);
    setMilestoneDraft({
      date: milestone.date,
      title: milestone.title,
      desc: milestone.desc,
      icon: milestone.icon
    });
  }

  async function submitMilestone() {
    if (!milestoneDraft.title || !milestoneDraft.date) {
      setToast('请先填写标题和日期');
      return;
    }

    const nextMilestone: Milestone = editingMilestone
      ? { ...editingMilestone, ...milestoneDraft }
      : { ...milestoneDraft, id: Date.now() };

    const nextMilestones = editingMilestone
      ? data.milestones.map((item) => (item.id === editingMilestone.id ? nextMilestone : item))
      : [...data.milestones, nextMilestone];

    await saveData({ ...data, milestones: sortMilestones(nextMilestones) }, '里程碑已保存');
    beginMilestoneCreate();
  }

  async function deleteMilestone(id: Milestone['id']) {
    const nextMilestones = data.milestones.filter((item) => item.id !== id);
    await saveData({ ...data, milestones: nextMilestones }, '里程碑已删除');
    if (editingMilestone?.id === id) {
      beginMilestoneCreate();
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-amber-900 shadow-sm">
          Loading memories...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_16px_60px_rgba(92,61,42,0.12)]">
        <div
          className="relative min-h-[320px] bg-cover bg-center p-6 text-white md:min-h-[420px]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(35,20,10,0.08) 0%, rgba(35,20,10,0.58) 100%), url('${activeHeroImages[currentHeroIndex]}')`
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Together For</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="font-serif text-6xl leading-none md:text-8xl">{daysTogether}</span>
                <span className="pb-2 text-lg text-white/80 md:text-2xl">Days</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="cursor-pointer rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25">
                {isUploading ? 'Uploading...' : 'Update Cover'}
                <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
              </label>
              {data.heroImage ? (
                <button
                  type="button"
                  onClick={() => void restoreDefaultHero()}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20"
                >
                  Restore Default
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-16 grid gap-3 md:mt-24 md:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Anniversary</p>
              <p className="mt-2 text-lg font-medium">{formatDate(data.startDate)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Next</p>
              <p className="mt-2 text-lg font-medium">{nextAnniversaryDays} Days</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Status</p>
              <p className="mt-2 text-lg font-medium">{isSaving ? 'Syncing...' : 'In Love'}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="rounded-[28px] border border-white/70 bg-white/80 px-6 py-5 text-center shadow-[0_12px_42px_rgba(92,61,42,0.08)] transition hover:border-amber-200"
        onClick={refreshQuote}
      >
        <p className="text-xs uppercase tracking-[0.35em] text-amber-500">Quote</p>
        <p className="mt-3 font-serif text-xl leading-relaxed text-amber-950">{currentQuote.text}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-amber-600/70">{currentQuote.author}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_42px_rgba(92,61,42,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-amber-950">甜蜜瞬间</h2>
              <p className="text-sm text-amber-700/70">上传后会自动生成缩略图，浏览更流畅。</p>
            </div>
            <label className="cursor-pointer rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800">
              {isUploading ? 'Uploading...' : 'Add Photos'}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          {data.photos.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-amber-200 bg-amber-50/70 text-center text-amber-700">
              <p className="text-lg font-semibold">还没有照片</p>
              <p className="mt-2 text-sm text-amber-700/70">上传第一张照片，开始记录你们的故事。</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {data.photos.map((photo) => {
                const deleting = deletingPhotoUrl === photo.url;
                return (
                  <div key={photo.uploadedAt} className="group relative overflow-hidden rounded-[24px] bg-amber-100">
                    <button type="button" className="block w-full" onClick={() => setSelectedPhoto(photo)}>
                      <img
                        src={photo.thumbUrl || photo.displayUrl || photo.url}
                        alt="Moment"
                        loading="lazy"
                        className="aspect-[4/5] h-full w-full object-cover"
                      />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-3 text-xs text-white">
                      <span>{new Date(photo.uploadedAt).toLocaleDateString('zh-CN')}</span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void handleDeletePhoto(photo)}
                        className="rounded-full bg-white/15 px-2 py-1 font-semibold backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_42px_rgba(92,61,42,0.08)]">
            <h2 className="font-serif text-2xl font-semibold text-amber-950">纪念日设置</h2>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="date"
                value={data.startDate}
                onChange={(event) => void saveData({ ...data, startDate: event.target.value }, '纪念日已保存')}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 outline-none transition focus:border-amber-400"
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_42px_rgba(92,61,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-amber-950">恋爱里程碑</h2>
                <p className="text-sm text-amber-700/70">把重要的日子一点点留下来。</p>
              </div>
              <button
                type="button"
                onClick={beginMilestoneCreate}
                className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                New
              </button>
            </div>

            <div className="space-y-3">
              {data.milestones.map((milestone) => (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => beginMilestoneEdit(milestone)}
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-left transition hover:border-amber-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-amber-500">{milestone.date}</p>
                      <h3 className="mt-2 text-lg font-semibold text-amber-950">{milestone.title}</h3>
                      <p className="mt-1 text-sm text-amber-800/70">{milestone.desc || 'No note yet.'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                      {formatMilestoneIcon(milestone.icon)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-amber-200 bg-white/80 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {MILESTONE_ICONS.map((iconItem) => {
                  const selected = milestoneDraft.icon === iconItem.id;
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setMilestoneDraft((current) => ({ ...current, icon: iconItem.id }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? 'bg-amber-900 text-white'
                          : 'border border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {iconItem.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-3">
                <input
                  type="text"
                  placeholder="里程碑标题"
                  value={milestoneDraft.title}
                  onChange={(event) => setMilestoneDraft((current) => ({ ...current, title: event.target.value }))}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none focus:border-amber-400"
                />
                <input
                  type="date"
                  value={milestoneDraft.date}
                  onChange={(event) => setMilestoneDraft((current) => ({ ...current, date: event.target.value }))}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="一句备注"
                  value={milestoneDraft.desc}
                  onChange={(event) => setMilestoneDraft((current) => ({ ...current, desc: event.target.value }))}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 outline-none focus:border-amber-400"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void submitMilestone()}
                  className="rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
                >
                  {editingMilestone ? 'Update' : 'Save'}
                </button>
                {editingMilestone ? (
                  <button
                    type="button"
                    onClick={() => void deleteMilestone(editingMilestone.id)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </section>

      {selectedPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedPhoto(null)}>
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            Close
          </button>
          <img
            src={selectedPhoto.displayUrl || selectedPhoto.url}
            alt="Selected memory"
            className="max-h-[90vh] max-w-[90vw] rounded-[28px] object-contain shadow-2xl"
          />
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-amber-50 shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
