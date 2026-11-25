'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event, Photo } from '../lib/types';
import { fmtRange } from '../lib/utils';
import { getPhotoOriginalUrl, getPhotoThumbUrl } from '../lib/image';
import { useScrollLock } from '../hooks/useScrollLock';
import { useOverlayLayer } from '../hooks/useOverlayLayer';
import { Z_LAYER } from './ui/Overlay';

export function Lightbox({
  photos, index, events, onClose, onPrev, onNext
}: {
  photos: Photo[];
  index: number;
  events?: Event[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef<number | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  const caption = useMemo(() => {
    if (!photo?.eventId || !events?.length) return null;
    const ev = events.find(e => String(e.id) === photo.eventId);
    if (!ev) return null;
    return {
      title: ev.title,
      meta: [fmtRange(ev.date, ev.endDate), ev.location].filter(Boolean).join(' · ')
    };
  }, [photo?.eventId, events]);

  const originalSrc = getPhotoOriginalUrl(photo);
  const thumbSrc = getPhotoThumbUrl(photo);
  const hasThumbPreview = Boolean(thumbSrc && thumbSrc !== originalSrc);
  const loaded = loadedSrc === originalSrc;

  useScrollLock(true);
  const { isTop } = useOverlayLayer();

  // 预加载上一张与下一张原图，消除左右切图等待
  useEffect(() => {
    if (photos.length <= 1) return;
    const prevIdx = (index - 1 + photos.length) % photos.length;
    const nextIdx = (index + 1) % photos.length;
    const p1 = new window.Image();
    p1.src = getPhotoOriginalUrl(photos[prevIdx]);
    const p2 = new window.Image();
    p2.src = getPhotoOriginalUrl(photos[nextIdx]);
  }, [index, photos]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!isTop()) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext, isTop]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? onNext() : onPrev();
    }
    touchStart.current = null;
  }

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: Z_LAYER.lightbox }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        type="button"
        aria-label="关闭大图"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors z-20"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Counter & 原图加载状态微标 */}
      {(hasMultiple || !loaded) && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white/75 text-xs z-20 flex items-center gap-2"
          style={{ fontFamily: 'var(--lm-font-display)' }}
        >
          {hasMultiple && <span>{index + 1} / {photos.length}</span>}
          {!loaded && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/60">
              <span className="w-2.5 h-2.5 border border-white/30 border-t-white/80 rounded-full animate-spin" />
              原图
            </span>
          )}
        </div>
      )}

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="上一张"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors z-20 active:scale-95"
            onClick={e => { e.stopPropagation(); onPrev(); }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="下一张"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors z-20 active:scale-95"
            onClick={e => { e.stopPropagation(); onNext(); }}
          >
            ›
          </button>
        </>
      )}

      {/* Image stage: 缩略图先垫底秒开，原图就绪后无缝覆盖 */}
      <div
        className="relative flex items-center justify-center max-w-[94vw] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {hasThumbPreview && !loaded && (
          <img
            src={thumbSrc}
            alt=""
            className="max-w-[94vw] max-h-[90vh] object-contain"
          />
        )}
        {!hasThumbPreview && !loaded && (
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        <img
          key={originalSrc}
          src={originalSrc}
          alt=""
          className={`${hasThumbPreview && !loaded ? 'absolute inset-0 m-auto' : ''} max-w-[94vw] max-h-[90vh] object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoadedSrc(originalSrc)}
        />
      </div>

      {/* 回忆上下文微标 */}
      {caption && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[88vw] px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-center z-20">
          <div className="text-xs font-medium text-white/95 font-serif-cn truncate">
            {caption.title}
          </div>
          {caption.meta && (
            <div className="text-[10px] text-white/65 truncate mt-0.5 tabular-nums">
              {caption.meta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
