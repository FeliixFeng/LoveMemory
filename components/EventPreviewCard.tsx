'use client';

import { useRef } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';
import { SafeImage } from './SafeImage';

export function EventPreviewCard({
  event, photos, expenses, onExpand, onEdit, onViewPhoto, onAddPhoto,
  onSwipeLeft, onSwipeRight
}: {
  event: Event | null;
  photos: Photo[];
  expenses: Expense[];
  onExpand: () => void;
  onEdit: () => void;
  onViewPhoto?: (photos: Photo[], index: number) => void;
  onAddPhoto?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (!event) return null;

  const total = calcTotalExpenses(expenses);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = touchStart.current.x - e.changedTouches[0].clientX;
    const dy = touchStart.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx > 0 ? onSwipeLeft?.() : onSwipeRight?.();
    }
    touchStart.current = null;
  }

  return (
    <div
      className="px-4 lg:px-0"
      style={{ animation: 'slideUp 0.4s ease-out' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="lm-card rounded-2xl p-4">
        {/* Top: Icon + Title + Date */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
              boxShadow: '0 2px 8px rgba(170,111,77,0.25)'
            }}
          >
            {getEmoji(event.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#3d281c] truncate" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                {event.title || '未命名事件'}
              </h3>
              {event.mood && <span className="text-xs">{getMoodEmoji(event.mood)}</span>}
              <button
                onClick={onEdit}
                className="shrink-0 w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-[10px] text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60 hover:bg-[#efd8c3]/30 transition-all"
                title="编辑"
              >
                ✎
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5c3d2a]/45">
              <span>{fmt(event.date)}</span>
              {event.location && <span>· 📍 {event.location}</span>}
            </div>
          </div>
          {/* Expand button */}
          <button
            onClick={onExpand}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d48b60] to-[#aa6f4d] text-white flex items-center justify-center hover:shadow-md transition-all shadow-sm active:scale-95 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Description + Expense */}
        <div className="flex items-center justify-between mt-2 gap-2 min-h-[18px]">
          <p className="text-xs text-[#5c3d2a]/50 line-clamp-1 flex-1">
            {event.desc || ''}
          </p>
          {total > 0 ? (
            <span className="text-[10px] text-[#5c3d2a]/40 shrink-0 px-2 py-0.5 rounded-md bg-[#efd8c3]/20">
              💰 {formatCurrency(total)}
            </span>
          ) : (
            <span className="shrink-0 px-2 py-0.5 text-[10px] invisible">占位</span>
          )}
        </div>

        {/* Photo strip or Add photo prompt */}
        {photos.length > 0 ? (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {photos.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity shadow-sm relative"
                style={{ width: '80px', height: '80px' }}
                onClick={() => onViewPhoto?.(photos, i)}
              >
                <SafeImage
                  src={p.thumbUrl || p.displayUrl || p.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
            {photos.length > 4 && (
              <div
                className="shrink-0 rounded-xl bg-[#efd8c3]/20 flex items-center justify-center cursor-pointer hover:bg-[#efd8c3]/30 transition-colors"
                style={{ width: '80px', height: '80px' }}
                onClick={onExpand}
              >
                <span className="text-xs text-[#5c3d2a]/40 font-medium">+{photos.length - 4}</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onAddPhoto}
            className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-[#efd8c3] flex items-center justify-center gap-2 text-[#5c3d2a]/35 hover:border-[#d48b60] hover:text-[#d48b60] transition-colors"
          >
            <span className="text-lg">📷</span>
            <span className="text-xs">添加几张照片来记录这个瞬间</span>
          </button>
        )}

      </div>
    </div>
  );
}
