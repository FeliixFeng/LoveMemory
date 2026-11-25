'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Event, Photo } from '../lib/types';
import { findNearestMilestone, findOnThisDay, localTodayStr, pickRandomMemory } from '../lib/flashback';
import { fmt, fmtRange, getEmoji } from '../lib/utils';
import { resolveEventCoverUrls } from '../lib/image';
import { SafeImage } from './SafeImage';
import { EventBadge } from './EventBadge';
import { PinIcon } from './NavIcons';

export function MemoryFlashback({
  startDate,
  events,
  photos,
  onSelectAndOpen,
}: {
  startDate: string;
  events: Event[];
  photos: Photo[];
  onSelectAndOpen: (eventId: string) => void;
}) {
  const todayStr = localTodayStr();

  const onThisDayHits = useMemo(() => findOnThisDay(events, todayStr), [events, todayStr]);
  const milestone = useMemo(() => findNearestMilestone(startDate, todayStr), [startDate, todayStr]);

  // 无「那年今日」命中时，随机抽一条往事放进时光盲盒（只在客户端首次挂载时随机抽，避免 SSR Hydration 报错）
  const [randomEvent, setRandomEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (onThisDayHits.length > 0 || events.length === 0) {
      setRandomEvent(null);
      return;
    }
    setRandomEvent(prev => {
      if (prev && events.some(e => String(e.id) === String(prev.id))) return prev;
      return pickRandomMemory(events, photos);
    });
  }, [onThisDayHits.length, events, photos]);

  const activeHit = onThisDayHits[0] || null;
  const displayEvent = activeHit?.event || randomEvent;

  const { thumbSrc: displayThumb, fallbackSrc: displayThumbFallback } = useMemo(() => {
    if (!displayEvent) return { thumbSrc: '', fallbackSrc: '' };
    const evPhotos = photos.filter(p => p.eventId === String(displayEvent.id));
    return resolveEventCoverUrls(displayEvent, evPhotos, photos);
  }, [displayEvent, photos]);

  if (!displayEvent && !milestone) return null;

  const bothVisible = Boolean(displayEvent && milestone);

  function handleShuffle() {
    const next = pickRandomMemory(events, photos, displayEvent ? String(displayEvent.id) : null);
    if (next) setRandomEvent(next);
  }

  return (
    <section className="px-4 lg:px-0">
      <div className={bothVisible ? 'space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0' : ''}>
        {/* 卡 1：那年今日 或 时光盲盒 */}
        {displayEvent && (
          <div className="lm-glass-panel rounded-3xl p-3.5 sm:p-4 flex items-center gap-3.5">
            {/* 缩略图或图标徽章 */}
            <button
              type="button"
              onClick={() => onSelectAndOpen(String(displayEvent.id))}
              className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-lm-line/20 flex items-center justify-center shadow-2xs active:scale-95 transition-transform"
              aria-label={`查看 ${displayEvent.title}`}
            >
              {displayThumb ? (
                <SafeImage
                  src={displayThumb}
                  fallbackSrc={displayThumbFallback}
                  alt={displayEvent.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <EventBadge emoji={getEmoji(displayEvent.icon)} />
              )}
            </button>

            {/* 文本区 */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onSelectAndOpen(String(displayEvent.id))}
            >
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="w-3 h-px bg-lm-accent/70" />
                <span className="text-[9.5px] tracking-[0.24em] uppercase text-lm-accent-deep font-display truncate">
                  {activeHit
                    ? `ON THIS DAY · ${activeHit.yearsAgo} 年前的今天`
                    : 'FLASHBACK · 时光盲盒'}
                </span>
              </div>
              <h3 className="text-sm sm:text-[15px] font-bold text-lm-ink font-serif-cn truncate mt-0.5">
                {displayEvent.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[10.5px] text-lm-body/55 mt-0.5 truncate">
                <span className="tabular-nums shrink-0">{fmtRange(displayEvent.date, displayEvent.endDate)}</span>
                {displayEvent.location && (
                  <>
                    <span className="text-lm-body/25">·</span>
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <PinIcon className="w-2.5 h-2.5 shrink-0 text-lm-accent/70" />
                      <span className="truncate">{displayEvent.location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 操作区 */}
            <div className="shrink-0 flex items-center gap-1.5">
              {!activeHit && events.length > 1 && (
                <button
                  type="button"
                  onClick={handleShuffle}
                  title="换一条回忆"
                  aria-label="换一条回忆"
                  className="lm-glass-chip w-8 h-8 rounded-full flex items-center justify-center text-lm-body/70 hover:text-lm-accent-deep active:scale-90 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectAndOpen(String(displayEvent.id))}
                className="lm-glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-lm-accent-deep active:scale-95 transition-all"
              >
                重温
              </button>
            </div>
          </div>
        )}

        {/* 卡 2：自动恋爱里程碑 */}
        {milestone && (
          <div className="lm-glass-panel rounded-3xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="w-3 h-px bg-lm-accent/70" />
                  <span className="text-[9.5px] tracking-[0.24em] uppercase text-lm-accent-deep font-display truncate">
                    NEXT MILESTONE · {fmt(milestone.targetDate)}
                  </span>
                </div>
                <h3 className="text-sm sm:text-[15px] font-bold text-lm-ink font-serif-cn mt-0.5 truncate">
                  {milestone.label}
                </h3>
              </div>

              <div className="text-right shrink-0 flex items-baseline gap-1">
                {milestone.daysLeft === 0 ? (
                  <span className="text-base font-bold text-lm-accent-deep font-serif-cn">就是今天</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-lm-accent-deep leading-none tabular-nums font-display">
                      {milestone.daysLeft}
                    </span>
                    <span className="text-[10px] text-lm-body/55">天后</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-1 w-full rounded-full bg-lm-line/55 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lm-blush via-lm-accent to-lm-accent-deep transition-all duration-700"
                  style={{ width: `${Math.max(4, milestone.progress)}%` }}
                />
              </div>
              {milestone.secondaryLabel && (
                <p className="text-[10.5px] text-lm-body/50 tabular-nums truncate">
                  {milestone.secondaryLabel}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
