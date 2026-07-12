'use client';

import { useRef } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';
import { SafeImage } from './SafeImage';

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
      <div className="lm-card rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Photos - top on mobile, right on desktop */}
          {photos.length > 0 && (
            <div className="md:order-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="shrink-0 rounded-xl overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity shadow-sm relative"
                  style={{ width: '120px', height: '150px' }}
                  onClick={() => onViewPhoto?.(photos, i)}
                >
                  <SafeImage
                    src={p.thumbUrl || p.displayUrl || p.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Event info - bottom on mobile, left on desktop */}
          <div className="min-w-0 flex items-start gap-3 md:order-1 md:h-[150px] pt-1 md:pt-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
                boxShadow: '0 2px 8px rgba(170,111,77,0.25)'
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
                    className="shrink-0 w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-[10px] text-[#5c3d2a]/50 md:text-[#5c3d2a]/30 hover:text-[#5c3d2a]/60 hover:bg-[#efd8c3]/30 transition-all"
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
                <p className="text-xs text-[#5c3d2a]/50 line-clamp-2 mt-1">{event.desc}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#efd8c3]/20">
                  <span className="text-xs">💰</span>
                  <span className="text-xs font-medium text-[#5c3d2a]/60">{formatCurrency(total)}</span>
                </div>
                <button
                  onClick={onExpand}
                  className="w-8 h-8 rounded-full bg-[#f0c8a8] text-white flex items-center justify-center hover:bg-[#e8b690] transition-colors shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
