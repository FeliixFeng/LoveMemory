'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Event, Photo, Expense, AppData } from '../lib/types';
import { HERO_IMAGES } from '../lib/constants';
import { useAuth } from './SiteLayoutClient';
import { HeroSection } from './HeroSection';
import { HorizontalTimeline } from './HorizontalTimeline';
import { EmptyState } from './EmptyState';
import { EventPreviewCard } from './EventPreviewCard';
import { EventDetail } from './EventDetail';
import { EventModal, EventDraft } from './EventModal';
import { StatsSection } from './StatsSection';
import { FloatingAddButton } from './FloatingAddButton';
import { Lightbox } from './Lightbox';
import { Toast } from './Toast';
import { ConfirmDialog } from './modals/ConfirmDialog';

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
  const { token, tokenRef, setShowPin, pendingOp, withAuth, setFloatingButton } = useAuth();
  const [data, setData] = useState<AppData>({ startDate: '', heroImage: '', customCovers: [], hiddenDefaultCovers: [], events: [], photos: [], expenses: [], loveQuotes: [], countdowns: [], wishes: [], capsules: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState('');

  // Event state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetailId, setEventDetailId] = useState<string | null>(null);
  const [eventModal, setEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [eventDraft, setEventDraft] = useState<EventDraft>({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart', location: '', mood: '' });

  const fileRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => {
      const events = (d.events || []).sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const photos = (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url }));
      setData({ ...d, events, photos, expenses: d.expenses || [], loveQuotes: d.loveQuotes || [], customCovers: d.customCovers || [], hiddenDefaultCovers: d.hiddenDefaultCovers || [], countdowns: d.countdowns || [], wishes: d.wishes || [], capsules: d.capsules || [] });
      if (events.length > 0 && !selectedEventId) setSelectedEventId(String(events[0].id));
    }).catch(() => setToast('加载失败')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    setFloatingButton(<FloatingAddButton onClick={() => withAuth(openEventCreate)} />);
    return () => setFloatingButton(null);
  }, [withAuth]);

  const days = useMemo(() => data.startDate ? Math.max(0, Math.floor((Date.now() - new Date(`${data.startDate}T00:00:00`).getTime()) / 86400000)) : 0, [data.startDate]);
  const animDays = useAnimatedNum(days);
  const nextDays = useMemo(() => {
    if (!data.startDate) return 0;
    const s = new Date(`${data.startDate}T00:00:00`), n = new Date(), nx = new Date(n.getFullYear(), s.getMonth(), s.getDate());
    if (nx.getTime() < n.getTime()) nx.setFullYear(n.getFullYear() + 1);
    return Math.ceil((nx.getTime() - n.getTime()) / 86400000);
  }, [data.startDate]);
  const visibleDefaults = HERO_IMAGES.filter(u => !data.hiddenDefaultCovers.includes(u));
  const heroImages = [...data.customCovers, ...visibleDefaults];

  const selectedEvent = useMemo(() => data.events.find(e => String(e.id) === selectedEventId) || null, [data.events, selectedEventId]);
  const detailEvent = useMemo(() => data.events.find(e => String(e.id) === eventDetailId) || null, [data.events, eventDetailId]);
  const selectedPhotos = useMemo(() => selectedEvent ? data.photos.filter(p => p.eventId === selectedEventId) : [], [data.photos, selectedEventId]);
  const selectedExpenses = useMemo(() => selectedEvent ? data.expenses.filter(e => e.eventId === selectedEventId) : [], [data.expenses, selectedEventId]);

  async function save(next: AppData, msg?: string, authToken?: string) {
    const prev = data;
    setData(next);
    if (msg) setToast(msg);
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const t = authToken || tokenRef.current;
      if (t) headers['Authorization'] = `Bearer ${t}`;
      const r = await fetch('/api/data', { method: 'POST', headers, body: JSON.stringify(next) });
      if (r.status === 401) {
        setData(prev);
        pendingOp.current = () => save(next, msg);
        setShowPin(true);
        return;
      }
      if (!r.ok) throw new Error();
    } catch {
      setData(prev);
      setToast('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  async function doUpload(file: File, authToken?: string, eventId?: string) {
    const fd = new FormData();
    fd.append('image', file);
    if (eventId) fd.append('eventId', eventId);
    const headers: Record<string, string> = {};
    const t = authToken || tokenRef.current;
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const r = await fetch('/api/upload', { method: 'POST', headers, body: fd });
    if (r.status === 401) {
      pendingOp.current = () => doUpload(file).then(() => {});
      setShowPin(true);
      throw new Error('auth');
    }
    if (!r.ok) throw new Error();
    const d = await r.json(); return { ...d, displayUrl: d.displayUrl || d.url, thumbUrl: d.thumbUrl || d.displayUrl || d.url } as Photo;
  }

  async function onPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const up: Photo[] = [];
      for (const f of files) up.push(await doUpload(f, undefined, selectedEventId || undefined));
      await save({ ...data, photos: [...up.reverse(), ...data.photos] }, '已上传');
    } catch (err) {
      if ((err as Error)?.message !== 'auth') setToast('上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function onDelPhoto(p: Photo) {
    setDeleting(p.url);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
      const r = await fetch('/api/upload', { method: 'DELETE', headers, body: JSON.stringify({ url: p.url }) });
      if (r.status === 401) {
        pendingOp.current = () => onDelPhoto(p);
        setShowPin(true);
        setDeleting('');
        return;
      }
      await save({ ...data, photos: data.photos.filter(x => x.url !== p.url) }, '已删除');
      if (viewPhoto && viewPhoto.photos[viewPhoto.index]?.url === p.url) setViewPhoto(null);
    } catch { setToast('删除失败'); } finally { setDeleting(''); }
  }

  async function onHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try {
      const u = await doUpload(file);
      const url = u.displayUrl || u.url;
      await save({ ...data, customCovers: [...data.customCovers, url] }, '封面已添加');
    } catch (err) { if ((err as Error)?.message !== 'auth') setToast('上传失败'); } finally { setUploading(false); e.target.value = ''; }
  }

  // Event CRUD
  function openEventCreate() {
    setEditEvent(null);
    setEventDraft({ date: new Date().toISOString().split('T')[0], title: '', desc: '', icon: 'heart', location: '', mood: '' });
    setEventModal(true);
  }

  function openEventEdit(ev: Event) {
    setEditEvent(ev);
    setEventDraft({ date: ev.date, title: ev.title, desc: ev.desc, icon: ev.icon, location: ev.location, mood: ev.mood });
    setEventModal(true);
  }

  async function saveEvent() {
    if (!eventDraft.title || !eventDraft.date) { setToast('请填写标题和日期'); return; }

    if (editEvent) {
      const events = data.events.map(e => e.id === editEvent.id ? { ...e, ...eventDraft } : e);
      const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEventModal(false); setEditEvent(null);
      await save({ ...data, events }, '已保存');
    } else {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
        const r = await fetch('/api/events', {
          method: 'POST', headers,
          body: JSON.stringify(eventDraft)
        });
        if (r.status === 401) {
          pendingOp.current = () => saveEvent();
          setShowPin(true);
          return;
        }
        if (!r.ok) throw new Error();
        const { event: created } = await r.json();
        const events = [...data.events, created].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEventModal(false);
        await save({ ...data, events }, '已创建');
        setSelectedEventId(String(created.id));
      } catch {
        setToast('创建失败');
      }
    }
  }

  async function deleteEvent() {
    if (!editEvent) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
      const r = await fetch(`/api/events/${editEvent.id}`, { method: 'DELETE', headers });
      if (r.status === 401) {
        pendingOp.current = () => deleteEvent();
        setShowPin(true);
        return;
      }
      const events = data.events.filter(e => e.id !== editEvent.id);
      const expenses = data.expenses.filter(e => e.eventId !== String(editEvent.id));
      setEventModal(false); setEditEvent(null);
      if (selectedEventId === String(editEvent.id)) setSelectedEventId(events.length > 0 ? String(events[0].id) : null);
      await save({ ...data, events, expenses }, '已删除');
    } catch { setToast('删除失败'); }
  }

  // Expense CRUD
  async function addExpense(expenseData: { amount: number; category: string; note: string }) {
    if (!eventDetailId) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
      const r = await fetch(`/api/events/${eventDetailId}/expenses`, {
        method: 'POST', headers,
        body: JSON.stringify(expenseData)
      });
      if (r.status === 401) {
        pendingOp.current = () => addExpense(expenseData);
        setShowPin(true);
        return;
      }
      if (!r.ok) throw new Error();
      const { expense } = await r.json();
      await save({ ...data, expenses: [...data.expenses, expense] }, '已添加');
    } catch { setToast('添加失败'); }
  }

  async function deleteExpense(id: number) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
      const r = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers });
      if (r.status === 401) {
        pendingOp.current = () => deleteExpense(id);
        setShowPin(true);
        return;
      }
      await save({ ...data, expenses: data.expenses.filter(e => e.id !== id) }, '已删除');
    } catch { setToast('删除失败'); }
  }

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><div className="lm-card rounded-full px-6 py-3 text-sm font-medium text-[#5c3d2a]"><span className="mr-2">💕</span>加载中...</div></main>;

  return (
    <>
      <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto pt-16 pb-20 md:pb-8 px-0 md:px-8 flex flex-col gap-4">
        {/* Hero + Timeline in one box */}
        <div className="px-4 lg:px-0">
          <HeroSection
            heroImages={heroImages} saving={saving}
            animDays={animDays} nextDays={nextDays} startDate={data.startDate}
            quotes={data.loveQuotes}
            countdowns={data.countdowns}
            onHeroUpload={onHeroUpload}
            heroRef={heroRef}
          >
            <HorizontalTimeline
              events={data.events}
              selectedId={selectedEventId}
              onSelect={setSelectedEventId}
            />
          </HeroSection>
        </div>

        {/* Event preview or empty state */}
        {data.events.length > 0 ? (
          <EventPreviewCard
            event={selectedEvent}
            photos={selectedPhotos}
            expenses={selectedExpenses}
            onExpand={() => setEventDetailId(selectedEventId)}
            onEdit={() => withAuth(() => { if (selectedEvent) openEventEdit(selectedEvent); })}
            onViewPhoto={(photos, index) => setViewPhoto({ photos, index })}
            onSwipeLeft={() => {
              const idx = data.events.findIndex(e => String(e.id) === selectedEventId);
              if (idx < data.events.length - 1) setSelectedEventId(String(data.events[idx + 1].id));
            }}
            onSwipeRight={() => {
              const idx = data.events.findIndex(e => String(e.id) === selectedEventId);
              if (idx > 0) setSelectedEventId(String(data.events[idx - 1].id));
            }}
          />
        ) : (
          <EmptyState onAdd={() => withAuth(openEventCreate)} />
        )}

        {/* Stats */}
        <StatsSection
          events={data.events}
          photos={data.photos}
          expenses={data.expenses}
          days={days}
        />

        <footer className="px-6 pt-4 pb-2 text-center space-y-2">
          <p className="text-[11px] text-[#5c3d2a]/25" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            记录每一个值得珍藏的瞬间
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-[#5c3d2a]/20">
            <span>💕 LoveMemory</span>
            <span>·</span>
            <span>用爱记录时光</span>
          </div>
          <p className="text-[9px] text-[#5c3d2a]/15">
            Made with ❤️ for us
          </p>
        </footer>
      </main>

      {eventModal && (
        <EventModal
          editEvent={editEvent} draft={eventDraft} setDraft={setEventDraft}
          onSave={() => void saveEvent()}
          onDelete={() => setConfirm({ title: '确认删除事件', message: '删除事件将同时删除关联的照片和账单，确定要删除吗？', onConfirm: () => { void deleteEvent(); setConfirm(null); } })}
          onClose={() => setEventModal(false)}
        />
      )}

      {detailEvent && (
        <EventDetail
          event={detailEvent}
          photos={data.photos.filter(p => p.eventId === eventDetailId)}
          expenses={data.expenses.filter(e => e.eventId === eventDetailId)}
          onClose={() => setEventDetailId(null)}
          onEdit={() => withAuth(() => openEventEdit(detailEvent))}
          onAddPhoto={() => withAuth(() => fileRef.current?.click())}
          onDeletePhoto={p => withAuth(() => setConfirm({ title: '确认删除照片', message: '删除后无法恢复，确定要删除吗？', onConfirm: () => { void onDelPhoto(p); setConfirm(null); } }))}
          onReorderPhotos={(from, to) => {
            const eventPhotos = data.photos.filter(p => p.eventId === eventDetailId);
            const otherPhotos = data.photos.filter(p => p.eventId !== eventDetailId);
            const swapped = [...eventPhotos];
            [swapped[from], swapped[to]] = [swapped[to], swapped[from]];
            void save({ ...data, photos: [...otherPhotos, ...swapped] });
          }}
          onAddExpense={addExpense}
          onDeleteExpense={id => withAuth(() => setConfirm({ title: '确认删除账单', message: '确定要删除这条账单吗？', onConfirm: () => { void deleteExpense(id); setConfirm(null); } }))}
          onViewPhoto={(photos, index) => setViewPhoto({ photos, index })}
          uploading={uploading}
          deleting={deleting}
        />
      )}

      {viewPhoto && (
        <Lightbox
          photo={viewPhoto.photos[viewPhoto.index]}
          hasMultiple={viewPhoto.photos.length > 1}
          onClose={() => setViewPhoto(null)}
          onPrev={() => setViewPhoto(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
          onNext={() => setViewPhoto(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <Toast message={toast} />

      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onPhotoUpload} />
    </>
  );
}
