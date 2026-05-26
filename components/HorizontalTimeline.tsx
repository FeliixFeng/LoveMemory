'use client';

import { useRef, useEffect } from 'react';
import { Event } from '../lib/types';
import { getEmoji } from '../lib/utils';

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
    <div className="px-4 pt-5 pb-3">
      <div ref={scrollRef} className="flex items-start overflow-x-auto no-scrollbar px-2 pt-2 pb-1 relative" style={{ gap: '48px' }}>
        {/* Connecting line */}
        {sorted.length > 1 && (
          <>
            {/* Main line */}
            <div
              className="absolute rounded-full"
              style={{
                top: '37px',
                left: '46px',
                right: '68px',
                height: '2.5px',
                background: 'linear-gradient(to right, rgba(212,139,96,0.1), #d48b60 30%, #aa6f4d 70%, rgba(170,111,77,0.15))'
              }}
            />
            {/* Glow underneath */}
            <div
              className="absolute rounded-full"
              style={{
                top: '33px',
                left: '46px',
                right: '68px',
                height: '10px',
                background: 'linear-gradient(to right, transparent, rgba(212,139,96,0.12) 30%, rgba(170,111,77,0.12) 70%, transparent)',
                filter: 'blur(5px)'
              }}
            />
            {/* Dot at each node position */}
            {sorted.map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full z-[5]"
                style={{
                  width: '5px',
                  height: '5px',
                  top: '36px',
                  left: `calc(46px + ${i} * (48px + 88px) / ${Math.max(sorted.length - 1, 1)} * ${sorted.length > 1 ? (sorted.length - 1) / sorted.length : 0})`,
                  background: 'rgba(255,255,255,0.3)',
                  boxShadow: '0 0 4px rgba(212,139,96,0.3)'
                }}
              />
            ))}
          </>
        )}

        {sorted.map((ev) => {
          const isSelected = String(ev.id) === selectedId;
          const size = isSelected ? 74 : 58;
          return (
            <button
              key={ev.id}
              data-event-id={ev.id}
              onClick={() => onSelect(String(ev.id))}
              className="flex flex-col items-center shrink-0 relative z-10"
              style={{ minWidth: '88px' }}
            >
              {/* Outer glow ring for selected */}
              {isSelected && (
                <div
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: `${size + 16}px`,
                    height: `${size + 16}px`,
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'radial-gradient(circle, rgba(212,139,96,0.25) 0%, transparent 70%)',
                    animationDuration: '2s'
                  }}
                />
              )}
              <div
                className="rounded-full flex items-center justify-center relative hover:scale-110 cursor-pointer"
                style={{
                  transition: 'transform 0.25s ease-out',
                  width: `${size}px`,
                  height: `${size}px`,
                  fontSize: isSelected ? '30px' : '24px',
                  background: isSelected
                    ? 'linear-gradient(135deg, #d48b60, #aa6f4d)'
                    : 'rgba(0,0,0,0.25)',
                  border: isSelected ? '3px solid rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.2)',
                  boxShadow: isSelected
                    ? '0 0 24px rgba(212,139,96,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {getEmoji(ev.icon)}
              </div>
              <span
                className="mt-2 truncate text-center leading-tight"
                style={{
                  maxWidth: '84px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                }}
              >
                {ev.title || '未命名'}
              </span>
              <span
                className="leading-tight"
                style={{
                  fontSize: '10px',
                  color: isSelected ? '#d48b60' : 'rgba(255,255,255,0.3)',
                  fontWeight: isSelected ? 600 : 400,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {shortDate(ev.date)}
              </span>
            </button>
          );
        })}

        <button
          onClick={onAdd}
          className="flex flex-col items-center shrink-0 relative z-10 hover:opacity-70 transition-opacity"
          style={{ minWidth: '88px' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{
              border: '2.5px dashed rgba(255,255,255,0.25)',
              background: 'rgba(0,0,0,0.15)',
              color: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(4px)'
            }}
          >
            +
          </div>
          <span className="mt-2 text-[11px] text-white/25" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>添加</span>
        </button>
      </div>
    </div>
  );
}
