'use client';

import { useRef, useEffect } from 'react';
import { Event } from '../lib/types';
import { getEmoji, fmt } from '../lib/utils';

export function HorizontalTimeline({
  events, selectedId, onSelect, onAdd
}: {
  events: Event[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  useEffect(() => {
    if (!scrollRef.current || !selectedId) return;
    const el = scrollRef.current.querySelector(`[data-event-id="${selectedId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedId]);

  function shortDate(d: string) {
    if (!d) return '';
    const dt = new Date(`${d}T00:00:00`);
    return `${dt.getMonth() + 1}月${dt.getDate()}日`;
  }

  return (
    <section
      className="rounded-2xl p-4 timeline-texture"
      style={{
        animation: 'slideUp 0.6s ease-out 0.2s both',
        border: '1px solid rgba(239,216,195,0.4)',
        boxShadow: '0 8px 30px rgba(92,61,42,0.06)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>时间轴</h2>
        <span className="text-xs text-[#5c3d2a]/50">{sorted.length} 个事件</span>
      </div>

      <div ref={scrollRef} className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2 px-1 relative">
        {/* Connecting line */}
        {sorted.length > 1 && (
          <div
            className="absolute top-5 h-[2px] rounded-full shrink-0"
            style={{
              left: '28px',
              right: '68px',
              background: 'linear-gradient(to right, #efd8c3, #d48b60)'
            }}
          />
        )}

        {sorted.map((ev) => {
          const isSelected = String(ev.id) === selectedId;
          const size = isSelected ? 48 : 40;
          return (
            <button
              key={ev.id}
              data-event-id={ev.id}
              onClick={() => onSelect(String(ev.id))}
              className="flex flex-col items-center shrink-0 relative z-10"
              style={{ minWidth: isSelected ? '64px' : '56px' }}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  fontSize: isSelected ? '20px' : '16px',
                  background: isSelected
                    ? 'linear-gradient(135deg, #d48b60, #aa6f4d)'
                    : 'rgba(255,255,255,0.8)',
                  border: isSelected ? 'none' : '1.5px solid rgba(239,216,195,0.6)',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(212,139,96,0.4), 0 4px 12px rgba(170,111,77,0.2)'
                    : '0 2px 8px rgba(92,61,42,0.06)',
                  transform: isSelected ? 'scale(1)' : 'scale(1)'
                }}
              >
                {getEmoji(ev.icon)}
              </div>
              <span
                className="mt-1.5 truncate transition-all duration-300 text-center"
                style={{
                  maxWidth: '56px',
                  fontSize: isSelected ? '11px' : '10px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#3d281c' : '#5c3d2a'
                }}
              >
                {ev.title || '未命名'}
              </span>
              <span
                className="transition-all duration-300"
                style={{
                  fontSize: '9px',
                  color: isSelected ? '#d48b60' : 'rgba(92,61,42,0.4)',
                  fontWeight: isSelected ? 600 : 400
                }}
              >
                {shortDate(ev.date)}
              </span>
            </button>
          );
        })}

        <button
          onClick={onAdd}
          className="flex flex-col items-center shrink-0 relative z-10 hover:opacity-80 transition-opacity"
          style={{ minWidth: '56px' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{
              border: '2px dashed rgba(212,139,96,0.4)',
              background: 'rgba(255,255,255,0.5)',
              color: '#d48b60'
            }}
          >
            +
          </div>
          <span className="mt-1.5 text-[10px] text-[#5c3d2a]/40">添加</span>
        </button>
      </div>
    </section>
  );
}
