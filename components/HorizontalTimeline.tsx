'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Event } from '../lib/types';
import { getEmoji } from '../lib/utils';

export function HorizontalTimeline({
  events, selectedId, onSelect
}: {
  events: Event[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [padX, setPadX] = useState(0);
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setPadX(Math.floor(entry.contentRect.width / 2));
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !selectedId || !padX) return;
    const el = scrollRef.current.querySelector(`[data-event-id="${selectedId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedId, padX]);

  function shortDate(d: string) {
    if (!d) return '';
    const dt = new Date(`${d}T00:00:00`);
    return `${dt.getMonth() + 1}月${dt.getDate()}日`;
  }

  function getYear(d: string) {
    if (!d) return '';
    return new Date(`${d}T00:00:00`).getFullYear().toString();
  }

  // Interleave year markers — placed AFTER the last event of each year
  type TimelineItem = { kind: 'event'; event: Event } | { kind: 'year'; year: string };
  const items: TimelineItem[] = useMemo(() => {
    const result: TimelineItem[] = [];
    let lastYear = '';
    for (const ev of sorted) {
      const y = getYear(ev.date);
      if (y && y !== lastYear && lastYear !== '') {
        result.push({ kind: 'year', year: lastYear });
      }
      lastYear = y;
      result.push({ kind: 'event', event: ev });
    }
    if (lastYear) result.push({ kind: 'year', year: lastYear });
    return result;
  }, [sorted]);

  const nodeSize = 80;
  const nodeGap = 52;
  const nodeMinWidth = 92;

  const yearNodeSize = 36;

  return (
    <div ref={outerRef} className="px-4 pt-6 pb-3">
      <div ref={scrollRef} className="flex items-start overflow-x-auto no-scrollbar pt-6 pb-1 relative" style={{ gap: `${nodeGap}px`, paddingLeft: `${padX}px`, paddingRight: `${padX}px` }}>
        {/* Connecting line */}
        {items.length > 1 && (
          <>
            <div
              className="absolute rounded-full"
              style={{
                top: '55px',
                left: `${padX + nodeMinWidth / 2}px`,
                width: `${(items.length - 1) * (nodeMinWidth + nodeGap)}px`,
                height: '1.5px',
                background: 'linear-gradient(to right, rgba(212,139,96,0.15), rgba(212,139,96,0.5) 20%, rgba(170,111,77,0.65) 50%, rgba(212,139,96,0.5) 80%, rgba(212,139,96,0.15))'
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                top: '52px',
                left: `${padX + nodeMinWidth / 2}px`,
                width: `${(items.length - 1) * (nodeMinWidth + nodeGap)}px`,
                height: '8px',
                background: 'linear-gradient(to right, transparent, rgba(212,139,96,0.15) 20%, rgba(170,111,77,0.2) 50%, rgba(212,139,96,0.15) 80%, transparent)',
                filter: 'blur(4px)'
              }}
            />
          </>
        )}

        {/* Decorative start node */}
        <div
          className="flex flex-col items-center shrink-0 relative z-10"
          style={{ minWidth: `${nodeMinWidth}px` }}
        >
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '62px',
              height: '62px',
              background: 'rgba(0,0,0,0.15)',
              border: '2px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)',
              fontSize: '22px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              opacity: 0.6
            }}
          >
            ✨
          </div>
        </div>

        {items.map((item, i) => {
          if (item.kind === 'year') {
            return (
              <div
                key={`year-${item.year}-${i}`}
                className="flex flex-col items-center shrink-0 relative z-10"
                style={{ minWidth: `${nodeMinWidth}px` }}
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: `${yearNodeSize}px`,
                    height: `${yearNodeSize}px`,
                    marginTop: '13px',
                    background: 'linear-gradient(135deg, rgba(212,139,96,0.5), rgba(170,111,77,0.5))',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.08em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  {item.year}
                </div>
              </div>
            );
          }

          const ev = item.event;
          const isSelected = String(ev.id) === selectedId;
          const size = isSelected ? nodeSize : 62;
          return (
            <button
              key={ev.id}
              data-event-id={ev.id}
              onClick={() => onSelect(String(ev.id))}
              className="flex flex-col items-center shrink-0 relative z-10"
              style={{ minWidth: `${nodeMinWidth}px` }}
            >
              {isSelected && (
                <div
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: `${size + 18}px`,
                    height: `${size + 18}px`,
                    top: '-18px',
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
                  marginTop: isSelected ? '-9px' : '0',
                  fontSize: isSelected ? '32px' : '26px',
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
                  maxWidth: '88px',
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
      </div>
    </div>
  );
}
