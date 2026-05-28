'use client';

import { useRef } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';

export function EventPreviewCard({
  event, photos, expenses, onExpand, onEdit, onViewPhoto, onSwipeLeft, onSwipeRight
}: {
  event: Event | null;
  photos: Photo[];
  expenses: Expense[];
  onExpand: () => void;
  onEdit: () => void;
  onViewPhoto?: (photos: Photo[], index: number) => void;
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
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx > 0 ? onSwipeLeft?.() : onSwipeRight?.();
    }
    touchStart.current = null;
  }

  return (
    <div
      className="px-4"
      style={{ animation: 'slideUp 0.4s ease-out' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col md:flex-row gap-3">
        {/* Photos - top on mobile, right on desktop */}
        {photos.length > 0 && (
          <div className="md:order-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
            {photos.map((p, i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ width: '120px', height: '150px' }}
                onClick={() => onViewPhoto?.(photos, i)}
              >
                <img
                  src={p.thumbUrl || p.displayUrl || p.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Event info - bottom on mobile, left on desktop */}
        <div className="min-w-0 flex items-start gap-3 md:order-1 md:h-[150px] pt-2 md:pt-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
              boxShadow: '0 2px 6px rgba(170,111,77,0.2)'
            }}
          >
            {getEmoji(event.icon)}
          </div>
          <div className="flex-1 min-w-0 flex flex-col md:justify-between md:h-full py-0.5">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#3d281c] truncate" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                  {event.title || '未命名事件'}
                </h3>
                <button
                  onClick={onEdit}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-[#5c3d2a]/50 md:text-[#5c3d2a]/30 hover:text-[#5c3d2a]/60 hover:bg-[#efd8c3]/30 transition-all"
                  title="编辑"
                >
                  ✎
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[#5c3d2a]/45">
                <span>{fmt(event.date)}</span>
                {event.location && <span>· 📍 {event.location}</span>}
                {event.mood && <span>· {getMoodEmoji(event.mood)}</span>}
              </div>
            </div>

            {event.desc && (
              <p className="text-xs text-[#5c3d2a]/50 line-clamp-2">{event.desc}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#5c3d2a]/40">💰 {formatCurrency(total)}</span>
              <button
                onClick={onExpand}
                className="w-7 h-7 rounded-full bg-[#f0c8a8] text-white flex items-center justify-center hover:bg-[#e8b690] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
