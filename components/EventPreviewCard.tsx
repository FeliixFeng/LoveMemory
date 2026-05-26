'use client';

import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';

export function EventPreviewCard({
  event, photos, expenses, onExpand, onEdit, onViewPhoto
}: {
  event: Event | null;
  photos: Photo[];
  expenses: Expense[];
  onExpand: () => void;
  onEdit: () => void;
  onViewPhoto?: (p: Photo) => void;
}) {
  if (!event) return null;

  const total = calcTotalExpenses(expenses);

  return (
    <div className="px-4" style={{ animation: 'slideUp 0.4s ease-out' }}>
      {/* Horizontal photo scroll */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
          {photos.map((p, i) => (
            <div
              key={i}
              className="shrink-0 rounded-xl overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ width: '120px', height: '150px' }}
              onClick={() => onViewPhoto?.(p)}
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

      {/* Event info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
              boxShadow: '0 2px 6px rgba(170,111,77,0.2)'
            }}
          >
            {getEmoji(event.icon)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              {event.title || '未命名事件'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5c3d2a]/45">
              <span>{fmt(event.date)}</span>
              {event.location && <span>· 📍 {event.location}</span>}
              {event.mood && <span>· {getMoodEmoji(event.mood)}</span>}
              {total > 0 && <span>· 💰 {formatCurrency(total)}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-[11px] rounded-lg bg-[#efd8c3]/30 text-[#5c3d2a]/60 hover:bg-[#efd8c3]/50 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={onExpand}
            className="px-3 py-1.5 text-[11px] rounded-lg bg-[#3d281c] text-amber-50 hover:bg-[#5c3d2a] transition-colors"
          >
            详情
          </button>
        </div>
      </div>

      {event.desc && (
        <p className="text-xs text-[#5c3d2a]/55 mt-2 line-clamp-2">{event.desc}</p>
      )}
    </div>
  );
}
