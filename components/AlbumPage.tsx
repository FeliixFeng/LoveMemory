'use client';

import { useMemo, useState } from 'react';
import type { Event, Photo } from '../lib/types';
import { getEmoji, fmtRange, getMoodEmoji } from '../lib/utils';
import { useAppData } from '../hooks/useAppData';
import { Lightbox } from './Lightbox';
import { SkeletonPage } from './SkeletonCard';
import { SafeImage } from './SafeImage';
import { PinIcon, CameraIcon } from './NavIcons';

type ViewMode = 'albums' | 'stream';

export function AlbumPage() {
  const { data, loading } = useAppData();
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);

  // 事件与照片关联
  const eventsWithPhotos = useMemo(() => {
    return data.events.filter(e => data.photos.some(p => p.eventId === String(e.id)));
  }, [data.events, data.photos]);

  const standalonePhotos = useMemo(() => {
    return data.photos.filter(p => !p.eventId);
  }, [data.photos]);

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
      {/* 顶栏：标题在左，圆角胶囊切换 Tab 在右（全站统一的 rounded-full 与 glass-pill） */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span aria-hidden className="w-4 h-px bg-lm-accent/70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-lm-accent font-display">ALBUM</span>
          <h1 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn">相册</h1>
          <span className="text-[10px] text-lm-body/40 font-display">· {totalPhotos} PHOTOS</span>
        </div>

        {/* 切换胶囊：统一 rounded-full 弧度，呼应底栏与顶栏胶囊 */}
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
        /* 视图 A：纯净大图画册卡片 —— 统一 rounded-3xl 与首页事件卡一致 */
        <div className="space-y-4">
          {eventsWithPhotos.map(event => {
            const eventPhotos = data.photos.filter(p => p.eventId === String(event.id));
            const isExpanded = expandedId === String(event.id);
            const coverPhoto = event.coverPhoto || eventPhotos[0]?.displayUrl || eventPhotos[0]?.url;
            const moodOrIcon = getMoodEmoji(event.mood) || getEmoji(event.icon);

            return (
              <div
                key={event.id}
                className="lm-card rounded-3xl overflow-hidden border border-lm-border/60 transition-all duration-300 hover:shadow-md"
              >
                {/* 封面照片区：信息直接贴在照片底部 */}
                <div
                  className="relative aspect-[16/10] sm:aspect-[2/1] w-full cursor-pointer overflow-hidden group bg-lm-line/10"
                  onClick={() => setExpandedId(isExpanded ? null : String(event.id))}
                >
                  {coverPhoto && (
                    <SafeImage
                      src={coverPhoto}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 800px"
                      className="object-cover group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                    />
                  )}

                  {/* 仅在底部 55% 铺一层平滑自然的渐隐暗光，保留上半部分原图明亮度 */}
                  <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                  {/* 右上角张数微标：统一 rounded-full */}
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/20 shadow-xs flex items-center gap-1">
                      <CameraIcon className="w-3 h-3" />
                      <span>{eventPhotos.length}</span>
                    </span>
                  </div>

                  {/* 直接贴在照片底部的文字信息 */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white flex items-end justify-between gap-3 pointer-events-none">
                    <div className="min-w-0 flex-1">
                      {/* 日期 + 地点 */}
                      <div className="flex items-center gap-1.5 text-[11px] text-white/80 mb-0.5">
                        <span>{fmtRange(event.date, event.endDate)}</span>
                        {event.location && (
                          <span className="inline-flex items-center gap-0.5 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/95 border border-white/15">
                            <PinIcon className="w-2.5 h-2.5" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {/* 标题 + 心情表情（同行并排，字体与首页衬线对齐） */}
                      <h3 className="text-base sm:text-lg font-bold tracking-wide truncate drop-shadow-sm font-serif-cn flex items-center gap-1.5">
                        <span>{event.title || '无标题记忆'}</span>
                        {moodOrIcon && <span className="text-sm font-normal drop-shadow-none">{moodOrIcon}</span>}
                      </h3>

                      {/* 描述摘要 */}
                      {event.desc && (
                        <p className="text-[11px] text-white/75 truncate mt-0.5 max-w-xs sm:max-w-md">
                          {event.desc}
                        </p>
                      )}
                    </div>

                    {/* 翻开 / 收起胶囊：使用全站标准 lm-glass-chip + rounded-full */}
                    <button
                      type="button"
                      className="shrink-0 lm-glass-chip px-3 py-1 rounded-full text-xs font-medium text-lm-accent-deep tracking-[0.02em] flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                    >
                      <span>{isExpanded ? '收起' : '翻开'}</span>
                      <span className={`text-[9px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* 展开后的照片画廊网格 */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 bg-white/40 backdrop-blur-xs border-t border-lm-line/30 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {eventPhotos.map((p, i) => (
                        <div
                          key={p.url}
                          className="aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 cursor-pointer relative group shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
                          onClick={() => setViewPhoto({ photos: eventPhotos, index: i })}
                        >
                          <SafeImage
                            src={p.thumbUrl || p.displayUrl || p.url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 33vw, 200px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 独立照片（拾光碎片） —— 统一 rounded-3xl 视觉语言 */}
          {standalonePhotos.length > 0 && (
            <div className="lm-card rounded-3xl overflow-hidden border border-lm-border/60">
              <div
                className="relative aspect-[16/7] w-full cursor-pointer overflow-hidden group bg-lm-line/10"
                onClick={() => setExpandedId(expandedId === 'standalone' ? null : 'standalone')}
              >
                {standalonePhotos[0] && (
                  <SafeImage
                    src={standalonePhotos[0].thumbUrl || standalonePhotos[0].displayUrl || standalonePhotos[0].url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 800px"
                    className="object-cover group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/85 via-black/40 to-black/10 pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-white flex items-end justify-between pointer-events-none">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-display">SPONTANEOUS</span>
                    <h3 className="text-base font-bold font-serif-cn mt-0.5">拾光碎片 · 自由瞬间</h3>
                    <p className="text-[11px] text-white/75 mt-0.5">未归入特定事件的 {standalonePhotos.length} 张照片</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 lm-glass-chip px-3 py-1 rounded-full text-xs font-medium text-lm-accent-deep tracking-[0.02em] flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  >
                    <span>{expandedId === 'standalone' ? '收起' : '翻开'}</span>
                    <span className={`text-[9px] transition-transform duration-200 ${expandedId === 'standalone' ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                </div>
              </div>

              {expandedId === 'standalone' && (
                <div className="p-3 sm:p-4 bg-white/40 backdrop-blur-xs border-t border-lm-line/30">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {standalonePhotos.map((p, i) => (
                      <div
                        key={p.url}
                        className="aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 cursor-pointer relative group shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
                        onClick={() => setViewPhoto({ photos: standalonePhotos, index: i })}
                      >
                        <SafeImage
                          src={p.thumbUrl || p.displayUrl || p.url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 33vw, 200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 视图 B：时光胶卷流（按年份与月份全景平铺） */
        <div className="space-y-5">
          {timelineGroups.groups.map(group => {
            const [year, month] = group.yearMonth.split('-');
            return (
              <div key={group.yearMonth} className="space-y-2">
                {/* 年月标题行 */}
                <div className="flex items-baseline gap-2 pt-1 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-lm-accent" />
                  <h3 className="text-sm font-bold text-lm-ink font-serif-cn">
                    {year} 年 {Number(month)} 月
                  </h3>
                  <span className="text-[10px] text-lm-body/40 font-display">
                    {group.items.length} 张照片
                  </span>
                </div>

                {/* 照片网格：统一 rounded-xl 与舒适间距 */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {group.items.map(item => {
                    const globalIdx = timelineGroups.allPhotos.indexOf(item.photo);
                    return (
                      <div
                        key={item.photo.url}
                        className="aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 cursor-pointer relative group shadow-2xs hover:shadow-sm transition-all active:scale-[0.98]"
                        onClick={() => setViewPhoto({ photos: timelineGroups.allPhotos, index: globalIdx >= 0 ? globalIdx : 0 })}
                      >
                        <SafeImage
                          src={item.photo.thumbUrl || item.photo.displayUrl || item.photo.url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 33vw, 200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* 悬浮微标 */}
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

      {/* Lightbox 沉浸大图 */}
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
