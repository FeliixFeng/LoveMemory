'use client';

import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';

export function EventPreviewCard({
  event, photos, expenses, onExpand, onEdit
}: {
  event: Event | null;
  photos: Photo[];
  expenses: Expense[];
  onExpand: () => void;
  onEdit: () => void;
}) {
  if (!event) return null;

  const total = calcTotalExpenses(expenses);
  const previewPhotos = photos.slice(0, 3);

  return (
    <div
      className="lm-card rounded-2xl overflow-hidden"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getEmoji(event.icon)}</span>
            <div>
              <h3 className="text-sm font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                {event.title || '未命名事件'}
              </h3>
              <p className="text-[11px] text-[#5c3d2a]/60">{fmt(event.date)}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onEdit}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-[#efd8c3]/40 text-[#5c3d2a] hover:bg-[#efd8c3]/60 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={onExpand}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-[#d48b60] text-white hover:bg-[#aa6f4d] transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>

        {event.desc && (
          <p className="text-xs text-[#5c3d2a]/70 mb-3 line-clamp-2">{event.desc}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-[#5c3d2a]/50">
          {event.location && <span>📍 {event.location}</span>}
          {event.mood && <span>{getMoodEmoji(event.mood)} {event.mood}</span>}
          {photos.length > 0 && <span>📷 {photos.length} 张</span>}
          {total > 0 && <span>💰 {formatCurrency(total)}</span>}
        </div>

        {previewPhotos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {previewPhotos.map((p, i) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-[#efd8c3]/20">
                <img
                  src={p.thumbUrl || p.displayUrl || p.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {photos.length > 3 && (
              <div className="w-16 h-16 rounded-lg bg-[#efd8c3]/20 flex items-center justify-center text-xs text-[#5c3d2a]/50">
                +{photos.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
