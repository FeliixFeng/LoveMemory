'use client';

import { memo, useRef, useEffect, useMemo, useState } from 'react';
import { Event } from '../lib/types';
import { getEmoji } from '../lib/utils';

/* ── 几何常量 ───────────────────────────────────────────────
   节点放在固定高度的槽里垂直居中：选中/未选中尺寸变化时，
   下方文字基线不动，避免点一下整行文字往下跳。
   ──────────────────────────────────────────────────────── */
const SLOT_W = 86;      // 每个节点的横向槽宽
const SLOT_H = 72;      // 节点槽高度 = 选中态节点直径
const GAP = 28;         // 相邻槽间距
const PAD_TOP = 24;     // 滚动容器 pt-6
const LINE_Y = PAD_TOP + SLOT_H / 2;  // 连接线中心 y

const NODE_IDLE = 56;
const NODE_ACTIVE = 72;
const EASE = 'cubic-bezier(.2,.8,.2,1)';

/* 磨砂玻璃节点：多层白色渐变（薄→厚）+ 背景模糊 + 1px 亮边 + 内高光。
   封面照片会从圆点后面透上来一层毛玻璃，比原来的半透明白圆更有材质感。
   注意：祖先元素不能有 mask / filter / opacity，否则 backdrop-filter 采样不到封面。 */
function glassNode(active: boolean) {
  return {
    // 玻璃的「透」靠把白色压到极低——只留边缘、内高光和反光点来交代材质，
    // 中间几乎完全让给背景照片。选中态也不靠加白，靠更亮的边 + 外圈光晕。
    background: active
      ? 'linear-gradient(150deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.05) 46%, rgba(20,14,10,0.07) 100%)'
      : 'linear-gradient(150deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 45%, rgba(20,14,10,0.10) 100%)',
    border: active ? '1px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.40)',
    boxShadow: active
      ? 'inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -2px 6px rgba(20,14,10,0.08), 0 0 0 1px rgba(255,255,255,0.35), 0 10px 26px rgba(0,0,0,0.24)'
      : 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -3px 7px rgba(20,14,10,0.12), 0 0 0 1px rgba(50,32,22,0.10), 0 3px 12px rgba(0,0,0,0.20)',
    backdropFilter: active
      ? 'blur(22px) saturate(1.35) brightness(1.10)'
      : 'blur(18px) saturate(1.25)',
    WebkitBackdropFilter: active
      ? 'blur(22px) saturate(1.35) brightness(1.10)'
      : 'blur(18px) saturate(1.25)'
  } as const;
}

/* 左上角镜面高光，玻璃的“反光点” */
function Glint({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        left: '13%',
        top: '6%',
        width: '44%',
        height: '26%',
        background: 'radial-gradient(ellipse at 42% 45%, rgba(255,255,255,0.85), rgba(255,255,255,0) 72%)',
        filter: 'blur(2.5px)',
        opacity: active ? 0.5 : 0.75
      }}
    />
  );
}

export const HorizontalTimeline = memo(function HorizontalTimeline({
  events, selectedId, onSelect, scrollRef: externalScrollRef
}: {
  events: Event[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
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
    const el = scrollRef.current;
    if (!el || !selectedId || !padX) return;
    const node = el.querySelector<HTMLElement>(`[data-event-id="${selectedId}"]`);
    if (!node) return;
    // 手动计算居中位置：scrollIntoView 会连带滚动整个页面
    const target = node.offsetLeft - (el.clientWidth - node.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
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

  // Use external ref if provided, otherwise internal
  const setScrollRef = (el: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (externalScrollRef) (externalScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  // 第一个节点是装饰起点，连接线从它的中心连到最后一个节点的中心
  const lineLeft = padX + SLOT_W / 2;
  const lineWidth = items.length * (SLOT_W + GAP);

  return (
    <div ref={outerRef} className="px-4 pt-6 pb-3">
      <div
        ref={setScrollRef}
        className="flex items-start overflow-x-auto overscroll-x-contain no-scrollbar pt-6 pb-1 relative"
        style={{ gap: `${GAP}px`, paddingLeft: `${padX}px`, paddingRight: `${padX}px` }}
      >
        {/* 连接线：单根 1px，去掉原来的模糊光晕 */}
        {items.length > 1 && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${LINE_Y}px`,
              left: `${lineLeft}px`,
              width: `${lineWidth}px`,
              height: '1px',
              transform: 'translateY(-0.5px)',
              background:
                'linear-gradient(to right, rgba(255,255,255,0.10), rgba(255,255,255,0.34) 12%, rgba(255,255,255,0.34) 88%, rgba(255,255,255,0.10))'
            }}
          />
        )}

        {/* 装饰起点 */}
        <div className="shrink-0 relative z-10 flex items-center justify-center" style={{ minWidth: `${SLOT_W}px`, height: `${SLOT_H}px` }}>
          <div
            className="rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              width: '40px',
              height: '40px',
              fontSize: '16px',
              ...glassNode(false),
              opacity: 0.8
            }}
          >
            <Glint active={false} />
            ✨
          </div>
        </div>

        {items.map((item, i) => {
          if (item.kind === 'year') {
            return (
              <div
                key={`year-${item.year}-${i}`}
                className="shrink-0 relative z-10 flex items-center justify-center"
                style={{ minWidth: `${SLOT_W}px`, height: `${SLOT_H}px` }}
              >
                <div
                  style={{
                    padding: '3px 9px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.30)',
                    background: 'linear-gradient(150deg, rgba(58,42,30,0.34) 0%, rgba(58,42,30,0.14) 100%)',
                    backdropFilter: 'blur(12px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px rgba(0,0,0,0.18)',
                    fontFamily: 'var(--lm-font-display)',
                    fontSize: '9.5px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.82)',
                    lineHeight: 1.3
                  }}
                >
                  {item.year}
                </div>
              </div>
            );
          }

          const ev = item.event;
          const isSelected = String(ev.id) === selectedId;
          const size = isSelected ? NODE_ACTIVE : NODE_IDLE;

          return (
            <button
              key={ev.id}
              data-event-id={ev.id}
              onClick={() => onSelect(String(ev.id))}
              className="shrink-0 relative z-10 flex flex-col items-center group"
              style={{ minWidth: `${SLOT_W}px` }}
            >
              <div className="flex items-center justify-center relative" style={{ height: `${SLOT_H}px` }}>
                {/* 选中光晕：暖白呼吸光，压在节点后面 */}
                {isSelected && (
                  <span
                    aria-hidden
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: `${size + 62}px`,
                      height: `${size + 62}px`,
                      background:
                        'radial-gradient(circle, rgba(255,255,255,0.62) 0%, rgba(255,248,238,0.20) 46%, rgba(255,248,238,0) 72%)',
                      filter: 'blur(8px)',
                      animation: 'lm-breathe 3.6s ease-in-out infinite'
                    }}
                  />
                )}
                <div
                  className="rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer group-hover:scale-[1.06]"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    fontSize: `${isSelected ? 30 : 24}px`,
                    ...glassNode(isSelected),
                    transition: `width 280ms ${EASE}, height 280ms ${EASE}, font-size 280ms ${EASE}, box-shadow 280ms ${EASE}, transform 200ms ${EASE}`
                  }}
                >
                  <Glint active={isSelected} />
                  <span className="relative">{getEmoji(ev.icon)}</span>
                </div>
              </div>

              <span
                className="mt-1 truncate text-center leading-tight"
                style={{
                  maxWidth: '80px',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                  transition: `color 280ms ${EASE}`
                }}
              >
                {ev.title || '未命名'}
              </span>
              <span
                className="leading-tight"
                style={{
                  marginTop: '2px',
                  fontSize: '9.5px',
                  letterSpacing: '0.03em',
                  color: isSelected ? 'var(--lm-blush)' : 'rgba(255,255,255,0.3)',
                  fontWeight: isSelected ? 600 : 400,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  transition: `color 280ms ${EASE}`
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
})
