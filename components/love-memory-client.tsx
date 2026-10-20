'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Photo } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { HeroSection } from './HeroSection';
import { HorizontalTimeline } from './HorizontalTimeline';
import { EmptyState } from './EmptyState';
import { EventPreviewCard } from './EventPreviewCard';
import { EventDetail } from './EventDetail';
import { EventModal } from './EventModal';
import { StatsSection } from './StatsSection';
import { FloatingAddButton } from './FloatingAddButton';
import { Lightbox } from './Lightbox';
import { Toast } from './Toast';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { useAppData } from '../hooks/useAppData';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useEventCRUD } from '../hooks/useEventCRUD';
import { useExpenseCRUD } from '../hooks/useExpenseCRUD';
import { apiFetch } from '../app/lib/api-client';

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
  const { tokenRef, setShowPin, pendingOp, withAuth, setFloatingButton } = useAuth();
  const { data, setData, loading, loadError, toast, setToast, loadData, saveSettings, days, nextDays, heroImages } = useAppData();
  const [confirm, setConfirm] = useState<{ title: string; message: string; danger?: boolean; onConfirm: () => void } | null>(null);

  const animDays = useAnimatedNum(days);

  const onAuthRequired = (op: () => void) => {
    pendingOp.current = op;
    setShowPin(true);
  };

  const photos = usePhotoUpload(data, setData, saveSettings, setToast, onAuthRequired);
  const events = useEventCRUD(data, setData, setToast, onAuthRequired);
  const expenses = useExpenseCRUD(data, setData, setToast, onAuthRequired);

  const heroRef = useRef<HTMLInputElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const heroContainerRef = useRef<HTMLDivElement>(null);

  // 封面与时间轴是一体的：整块 hero 接管垂直滚轮，转成时间轴横向滚动
  useLayoutEffect(() => {
    const container = heroContainerRef.current;
    if (!container) return;

    function handleWheel(e: WheelEvent) {
      // 缩放（Ctrl/⌘ + 滚轮）直接放行
      if (e.ctrlKey || e.metaKey) return;
      // 触控板横向手势交给原生
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // 只在页面顶部接管：一旦开始下滚看正文，就恢复普通滚动
      if (window.scrollY > 8) return;

      const el = timelineScrollRef.current;
      if (!el) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;

      // deltaMode === 1 表示以「行」为单位（部分 Firefox / 鼠标），换算成像素
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;

      // 边界释放：时间轴滚到头，就把控制权还给页面
      if ((delta > 0 && atEnd) || (delta < 0 && atStart)) return;

      e.preventDefault();
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + delta));
    }

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [data.events]);

  // Set initial selected event
  useEffect(() => {
    if (data.events.length > 0 && !events.selectedEventId) {
      events.setSelectedEventId(String(data.events[0].id));
    }
  }, [data.events]);

  useEffect(() => {
    setFloatingButton(<FloatingAddButton onClick={() => withAuth(events.openEventCreate)} />);
    return () => setFloatingButton(null);
  }, [withAuth]);

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><div className="lm-card rounded-full px-6 py-3 text-sm font-medium text-lm-body"><span className="mr-2">💕</span>加载中...</div></main>;

  if (loadError) return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="lm-card rounded-2xl p-6 text-center">
        <span className="text-3xl mb-3 block">😥</span>
        <p className="text-sm text-lm-ink mb-1 font-bold">加载失败</p>
        <p className="text-xs text-lm-body/50 mb-4">网络连接似乎有问题</p>
        <button onClick={() => { /* @ts-ignore */ }} className="px-5 py-2 bg-lm-accent-deep text-white rounded-xl text-sm font-medium active:scale-95 transition-transform">重新加载</button>
      </div>
    </main>
  );

  return (
    <>
      <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto pt-16 pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-8 px-0 md:px-8 flex flex-col gap-4">
        <div ref={heroContainerRef} className="px-4 lg:px-0">
          <HeroSection
            heroImages={heroImages}
            animDays={animDays} nextDays={nextDays} startDate={data.startDate}
            quotes={data.loveQuotes} countdowns={data.countdowns}
            onHeroUpload={photos.onHeroUpload} heroRef={heroRef}
          >
            <HorizontalTimeline events={data.events} selectedId={events.selectedEventId} onSelect={events.setSelectedEventId} scrollRef={timelineScrollRef} />
          </HeroSection>
        </div>

        {data.events.length > 0 ? (
          <EventPreviewCard
            event={events.selectedEvent}
            photos={events.selectedPhotos}
            expenses={events.selectedExpenses}
            onExpand={() => events.setEventDetailId(events.selectedEventId)}
            onEdit={() => withAuth(() => { if (events.selectedEvent) events.openEventEdit(events.selectedEvent); })}
            onViewPhoto={(p, i) => photos.setViewPhoto({ photos: p, index: i })}
            onAddPhoto={() => withAuth(() => photos.fileRef.current?.click())}
            onSwipeLeft={() => {
              const idx = data.events.findIndex(e => String(e.id) === events.selectedEventId);
              if (idx < data.events.length - 1) events.setSelectedEventId(String(data.events[idx + 1].id));
            }}
            onSwipeRight={() => {
              const idx = data.events.findIndex(e => String(e.id) === events.selectedEventId);
              if (idx > 0) events.setSelectedEventId(String(data.events[idx - 1].id));
            }}
          />
        ) : (
          <EmptyState onAdd={() => withAuth(events.openEventCreate)} />
        )}

        <StatsSection events={data.events} photos={data.photos} expenses={data.expenses} days={days} />

        <footer className="px-6 pt-2 pb-2 text-center">
          <p className="text-[10px] text-lm-body/20">💕 LoveMemory · Made with ❤️ for us</p>
        </footer>
      </main>

      {events.eventModal && (
        <EventModal
          editEvent={events.editEvent} draft={events.eventDraft} setDraft={events.setEventDraft}
          onSave={() => void events.saveEvent()}
          onDelete={() => setConfirm({ title: '确认删除事件', message: '删除事件将同时删除关联的照片和账单，确定要删除吗？', onConfirm: () => { void events.deleteEvent(); setConfirm(null); } })}
          onClose={() => events.setEventModal(false)}
        />
      )}

      {events.detailEvent && (
        <EventDetail
          event={events.detailEvent}
          photos={data.photos.filter(p => p.eventId === events.eventDetailId)}
          expenses={data.expenses.filter(e => e.eventId === events.eventDetailId)}
          onClose={() => events.setEventDetailId(null)}
          onEdit={() => withAuth(() => { if (events.detailEvent) events.openEventEdit(events.detailEvent); })}
          onAddPhoto={() => withAuth(() => photos.fileRef.current?.click())}
          onDeletePhoto={p => withAuth(() => setConfirm({ title: '确认删除照片', message: '删除后无法恢复，确定要删除吗？', onConfirm: () => { void photos.onDelPhoto(p); setConfirm(null); } }))}
          onReorderPhotos={(from, to) => {
            const eventPhotos = data.photos.filter(p => p.eventId === events.eventDetailId);
            const otherPhotos = data.photos.filter(p => p.eventId !== events.eventDetailId);
            const swapped = [...eventPhotos];
            [swapped[from], swapped[to]] = [swapped[to], swapped[from]];
            const orderedUrls = swapped.map(p => p.url);
            setData(prev => ({ ...prev, photos: [...otherPhotos, ...swapped] }));
            void apiFetch('/api/photos/order', {
              method: 'PUT',
              body: { eventId: events.eventDetailId, urls: orderedUrls }
            }).catch(() => {
              setToast('排序保存失败，请重试');
              loadData();
            });
          }}
          onAddExpense={(d) => expenses.addExpense(events.eventDetailId!, d)}
          onDeleteExpense={id => withAuth(() => setConfirm({ title: '确认删除账单', message: '确定要删除这条账单吗？', onConfirm: () => { void expenses.deleteExpense(id); setConfirm(null); } }))}
          onViewPhoto={(p, i) => photos.setViewPhoto({ photos: p, index: i })}
          uploading={photos.uploading}
          uploadProgress={photos.uploadProgress}
          deleting={photos.deleting}
        />
      )}

      {photos.viewPhoto && (
        <Lightbox
          photos={photos.viewPhoto.photos}
          index={photos.viewPhoto.index}
          onClose={() => photos.setViewPhoto(null)}
          onPrev={() => photos.setViewPhoto(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
          onNext={() => photos.setViewPhoto(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
        />
      )}

      {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} danger={confirm.danger} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      <Toast message={toast} />
      <input ref={photos.fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => photos.onPhotoUpload(e, events.selectedEventId)} />
    </>
  );
}
