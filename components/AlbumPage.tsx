'use client';

import { useMemo, useState } from 'react';
import type { Event, Photo } from '../lib/types';
import { getEmoji, fmtRange, getMoodEmoji } from '../lib/utils';
import { getPhotoOriginalUrl, getPhotoThumbUrl, resolveEventCoverUrls } from '../lib/image';
import { useAppData } from '../hooks/useAppData';
import { Lightbox } from './Lightbox';
import { SkeletonPage } from './SkeletonCard';
import { SafeImage } from './SafeImage';
import { Overlay } from './ui/Overlay';
import { PinIcon, CameraIcon } from './NavIcons';

type ViewMode = 'albums' | 'stream';

type ActiveAlbum = {
  key: string;
  eyebrow: string;
  title: string;
  moodOrIcon?: string;
  dateRange?: string;
  location?: string;
  desc?: string;
  photos: Photo[];
};

export function AlbumPage() {
  const { data, loading } = useAppData();
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [activeAlbumKey, setActiveAlbumKey] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);

  // 按事件聚合照片
  const photosByEvent = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const p of data.photos) {
      if (!p.eventId) continue;
      const list = map.get(p.eventId) || [];
      list.push(p);
      map.set(p.eventId, list);
    }
    return map;
  }, [data.photos]);

  const eventsWithPhotos = useMemo(() => {
    return data.events.filter(e => (photosByEvent.get(String(e.id))?.length ?? 0) > 0);
  }, [data.events, photosByEvent]);

  const standalonePhotos = useMemo(() => {
    return data.photos.filter(p => !p.eventId);
  }, [data.photos]);

  // 当前打开的影集弹窗数据
  const activeAlbum: ActiveAlbum | null = useMemo(() => {
    if (!activeAlbumKey) return null;
    if (activeAlbumKey === 'standalone') {
      if (standalonePhotos.length === 0) return null;
      return {
        key: 'standalone',
        eyebrow: 'SPONTANEOUS',
        title: '拾光碎片 · 自由瞬间',
        desc: '未归入特定事件的日常散落瞬间',
        photos: standalonePhotos
      };
    }
    const ev = eventsWithPhotos.find(e => String(e.id) === activeAlbumKey);
    if (!ev) return null;
    const evPhotos = photosByEvent.get(String(ev.id)) || [];
    return {
      key: String(ev.id),
      eyebrow: 'ALBUM',
      title: ev.title || '无标题记忆',
      moodOrIcon: getMoodEmoji(ev.mood) || getEmoji(ev.icon),
      dateRange: fmtRange(ev.date, ev.endDate),
      location: ev.location || undefined,
      desc: ev.desc || undefined,
      photos: evPhotos
    };
  }, [activeAlbumKey, eventsWithPhotos, photosByEvent, standalonePhotos]);

  // 全量时间线流分组（按年月）
  const timelineGroups = useMemo(() => {
    const eventMap = new Map<string, Event>();
    data.events.forEach(e => eventMap.set(String(e.id), e));

    const photosWithDate = data.photos.map(p => {
      const parentEvent = p.eventId ? eventMap.get(p.eventId) : undefined;
      const dateStr = parentEvent?.date || p.uploadedAt?.slice(0, 10) || '2024-01-01';
      return {
        photo: p,
        dateStr,
        eventTitle: parentEvent?.title || '拾光定格',
        yearMonth: dateStr.slice(0, 7)
      };
    });

    photosWithDate.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    const groups: { [key: string]: typeof photosWithDate } = {};
    photosWithDate.forEach(item => {
      if (!groups[item.yearMonth]) groups[item.yearMonth] = [];
      groups[item.yearMonth].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return {
      allPhotos: photosWithDate.map(i => i.photo),
      groups: sortedKeys.map(key => ({
        yearMonth: key,
        items: groups[key]
      }))
    };
  }, [data.events, data.photos]);

  if (loading) return <SkeletonPage />;

  const totalPhotos = data.photos.length;

  return (
    <div className="space-y-4">
      {/* 顶栏：标题在左，圆角胶囊切换 Tab 在右 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span aria-hidden className="w-4 h-px bg-lm-accent/70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-lm-accent font-display">ALBUM</span>
          <h1 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn">相册</h1>
          <span className="text-[10px] text-lm-body/40 font-display">· {totalPhotos} PHOTOS</span>
        </div>

        <div className="flex items-center p-0.5 bg-white/70 backdrop-blur-md rounded-full border border-lm-border/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('albums')}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-300 font-medium whitespace-nowrap ${
              viewMode === 'albums'
                ? 'lm-glass-pill text-lm-accent-deep font-semibold shadow-xs'
                : 'text-lm-body/50 hover:text-lm-body/80'
            }`}
          >
            影集
          </button>
          <button
            type="button"
            onClick={() => setViewMode('stream')}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-300 font-medium whitespace-nowrap ${
              viewMode === 'stream'
                ? 'lm-glass-pill text-lm-accent-deep font-semibold shadow-xs'
                : 'text-lm-body/50 hover:text-lm-body/80'
            }`}
          >
            胶卷
          </button>
        </div>
      </div>

      {/* 空状态 */}
      {totalPhotos === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 lm-card rounded-3xl">
          <span className="text-3xl mb-3">📸</span>
          <p className="text-sm font-bold text-lm-ink font-serif-cn mb-1">相册还是空的</p>
          <p className="text-xs text-lm-body/50">在首页记录一次事件并上传属于你们的照片吧</p>
        </div>
      ) : viewMode === 'albums' ? (
        /* 视图 A：影集橱窗 —— 移动端单列优雅铺开，平板 2 列 / 桌面 3 列多卡并览 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {eventsWithPhotos.map(event => {
            const eventPhotos = photosByEvent.get(String(event.id)) || [];
            const { thumbSrc, fallbackSrc } = resolveEventCoverUrls(event, eventPhotos, data.photos);
            const moodOrIcon = getMoodEmoji(event.mood) || getEmoji(event.icon);

            return (
              <article
                key={event.id}
                onClick={() => setActiveAlbumKey(String(event.id))}
                className="lm-card rounded-3xl overflow-hidden border border-lm-border/60 transition-all duration-300 hover:shadow-md cursor-pointer group"
              >
                <div className="relative aspect-[16/10] md:aspect-[4/3] w-full overflow-hidden bg-lm-line/10">
                  {thumbSrc && (
                    <SafeImage
                      src={thumbSrc}
                      fallbackSrc={fallbackSrc}
                      alt={event.title}
                      fill
                      sizes="(max-width: 767px) 92vw, (max-width: 1023px) 46vw, 360px"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    />
                  )}

                  {/* 底部柔光渐变 */}
                  <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                  {/* 右上角照片张数 */}
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-xs flex items-center gap-1 tabular-nums">
                      <CameraIcon className="w-3 h-3" />
                      <span>{eventPhotos.length}</span>
                    </span>
                  </div>

                  {/* 底部文字与动作胶囊 */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white flex items-end justify-between gap-2.5 pointer-events-none">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/80 mb-0.5 min-w-0">
                        <span className="shrink-0 tabular-nums">{fmtRange(event.date, event.endDate)}</span>
                        {event.location && (
                          <span className="inline-flex items-center gap-0.5 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/95 border border-white/15 truncate max-w-[140px]">
                            <PinIcon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold tracking-wide truncate drop-shadow-sm font-serif-cn flex items-center gap-1.5">
                        <span className="truncate">{event.title || '无标题记忆'}</span>
                        {moodOrIcon && <span className="text-sm font-normal drop-shadow-none shrink-0">{moodOrIcon}</span>}
                      </h3>

                      {event.desc && (
                        <p className="text-[11px] text-white/75 truncate mt-0.5">
                          {event.desc}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 lm-glass-chip px-2.5 py-1 rounded-full text-[11px] font-medium text-lm-accent-deep tracking-[0.02em] shadow-xs group-hover:scale-105 transition-transform">
                      翻开
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* 独立照片（拾光碎片）纳入同一网格对齐排布 */}
          {standalonePhotos.length > 0 && (
            <article
              onClick={() => setActiveAlbumKey('standalone')}
              className="lm-card rounded-3xl overflow-hidden border border-lm-border/60 transition-all duration-300 hover:shadow-md cursor-pointer group"
            >
              <div className="relative aspect-[16/10] md:aspect-[4/3] w-full overflow-hidden bg-lm-line/10">
                <SafeImage
                  src={getPhotoThumbUrl(standalonePhotos[0])}
                  fallbackSrc={getPhotoOriginalUrl(standalonePhotos[0])}
                  alt="拾光碎片"
                  fill
                  sizes="(max-width: 767px) 92vw, (max-width: 1023px) 46vw, 360px"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                <div className="absolute top-3 right-3 pointer-events-none">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-xs flex items-center gap-1 tabular-nums">
                    <CameraIcon className="w-3 h-3" />
                    <span>{standalonePhotos.length}</span>
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 text-white flex items-end justify-between gap-2.5 pointer-events-none">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/75 font-display">SPONTANEOUS</span>
                    <h3 className="text-base font-bold font-serif-cn truncate mt-0.5">拾光碎片 · 自由瞬间</h3>
                    <p className="text-[11px] text-white/75 truncate mt-0.5">
                      未归入事件的 {standalonePhotos.length} 张照片
                    </p>
                  </div>
                  <span className="shrink-0 lm-glass-chip px-2.5 py-1 rounded-full text-[11px] font-medium text-lm-accent-deep tracking-[0.02em] shadow-xs group-hover:scale-105 transition-transform">
                    翻开
                  </span>
                </div>
              </div>
            </article>
          )}
        </div>
      ) : (
        /* 视图 B：时光胶卷流（按年份与月份缩略图平铺） */
        <div className="space-y-5">
          {timelineGroups.groups.map(group => {
            const [year, month] = group.yearMonth.split('-');
            return (
              <div key={group.yearMonth} className="space-y-2">
                <div className="flex items-baseline gap-2 pt-1 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lm-accent" />
                  <h3 className="text-sm font-bold text-lm-ink font-serif-cn">
                    {year} 年 {Number(month)} 月
                  </h3>
                  <span className="text-[10px] text-lm-body/40 font-display tabular-nums">
                    {group.items.length} 张照片
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5">
                  {group.items.map(item => {
                    const globalIdx = timelineGroups.allPhotos.indexOf(item.photo);
                    return (
                      <div
                        key={item.photo.url}
                        className="aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 cursor-pointer relative group shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
                        onClick={() => setViewPhoto({ photos: timelineGroups.allPhotos, index: globalIdx >= 0 ? globalIdx : 0 })}
                      >
                        <SafeImage
                          src={getPhotoThumbUrl(item.photo)}
                          fallbackSrc={getPhotoOriginalUrl(item.photo)}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 32vw, (max-width: 1023px) 22vw, 180px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate drop-shadow-xs font-serif-cn">
                            {item.eventTitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 影集内页抽屉：网格内用缩略图，点单张进 Lightbox 看原图 */}
      {activeAlbum && (
        <Overlay
          onClose={() => setActiveAlbumKey(null)}
          layer="sheet"
          labelledBy="album-sheet-title"
          panelClassName="w-full sm:max-w-3xl max-h-[86dvh] bg-lm-bg rounded-t-3xl sm:rounded-3xl overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:shadow-2xl"
        >
          <div className="sticky top-0 bg-lm-bg/92 backdrop-blur-xl z-10 px-5 py-4 border-b border-lm-line/40 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] text-lm-body/55 flex-wrap">
                <span className="tracking-[0.22em] uppercase text-lm-accent font-display">{activeAlbum.eyebrow}</span>
                {activeAlbum.dateRange && (
                  <>
                    <span className="text-lm-body/25">·</span>
                    <span className="tabular-nums">{activeAlbum.dateRange}</span>
                  </>
                )}
                {activeAlbum.location && (
                  <>
                    <span className="text-lm-body/25">·</span>
                    <span className="inline-flex items-center gap-0.5 text-lm-accent-deep/85">
                      <PinIcon className="w-2.5 h-2.5" />
                      {activeAlbum.location}
                    </span>
                  </>
                )}
                <span className="text-lm-body/25">·</span>
                <span className="tabular-nums">{activeAlbum.photos.length} 张</span>
              </div>
              <h2 id="album-sheet-title" className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn mt-1 flex items-center gap-1.5">
                <span className="truncate">{activeAlbum.title}</span>
                {activeAlbum.moodOrIcon && <span className="text-sm font-normal shrink-0">{activeAlbum.moodOrIcon}</span>}
              </h2>
            </div>

            <button
              type="button"
              aria-label="关闭影集"
              onClick={() => setActiveAlbumKey(null)}
              className="w-8 h-8 rounded-full bg-lm-line/40 text-lm-body/60 hover:bg-lm-line/70 flex items-center justify-center text-xs shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {activeAlbum.desc && (
              <p className="text-xs sm:text-sm text-lm-body/75 leading-relaxed">
                {activeAlbum.desc}
              </p>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
              {activeAlbum.photos.map((p, i) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setViewPhoto({ photos: activeAlbum.photos, index: i })}
                  className="aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 cursor-pointer relative group shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <SafeImage
                    src={getPhotoThumbUrl(p)}
                    fallbackSrc={getPhotoOriginalUrl(p)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 30vw, 160px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* Lightbox 沉浸大图（加载原图） */}
      {viewPhoto && (
        <Lightbox
          photos={viewPhoto.photos}
          index={viewPhoto.index}
          onClose={() => setViewPhoto(null)}
          onPrev={() => setViewPhoto(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
          onNext={() => setViewPhoto(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
        />
      )}
    </div>
  );
}
