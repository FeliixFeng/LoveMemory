'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { calcTotalExpenses } from '../lib/utils';
import { collectPlaces } from '../lib/place';

/* 数字滚动：首屏从 0 数上去，值变化时从当前值继续数。
   ref 只在动画结束时落定 —— 中途被打断不会把起点写成终点，
   否则 diff 归零、数字直接卡在 0（主页天数变 0 就是这么来的）。 */
function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();

    function animate(now: number) {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (progress >= 1) {
        setDisplay(value);
        fromRef.current = value;
        rafRef.current = null;
        return;
      }
      setDisplay(Math.round(from + (value - from) * eased));
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

/* 统计条：不铺色块、不做卡片。
   跟上面那张卡同一套语言 —— 眉标 + 引导线，四角刻线当画框，
   格子之间用上下渐隐的发丝线（比通顶实线轻，也不跟卡片的点线引导抢），
   数字衬线大字，标签沿用卡片里的英文小字眉标。 */
const CELLS = [
  { key: 'events', label: 'Events', idx: '01' },
  { key: 'photos', label: 'Photos', idx: '02' },
  { key: 'places', label: 'Places', idx: '03' },
  { key: 'spent', label: 'Spent', idx: '04' },
];

const CORNERS = [
  'left-0 top-0 border-l border-t',
  'right-0 top-0 border-r border-t',
  'left-0 bottom-0 border-l border-b',
  'right-0 bottom-0 border-r border-b',
];

export const StatsSection = memo(function StatsSection({
  events, photos, expenses, days
}: {
  events: Event[];
  photos: Photo[];
  expenses: Expense[];
  days: number;
}) {
  const totalExpenses = calcTotalExpenses(expenses);
  /* 与足迹页同一口径：能定位的归到城市（「武汉 江汉路」并入「武汉」），
     定位不了的保留原文（家里、某个山头也算一个地方） */
  const places = collectPlaces(events.map(e => e.location));

  const hasSpent = totalExpenses > 0;

  const nodes: Record<string, React.ReactNode> = {
    events: <AnimatedNumber value={events.length} duration={800} />,
    photos: <AnimatedNumber value={photos.length} duration={900} />,
    places: <AnimatedNumber value={places.length} duration={700} />,
    // 没有账单时退回天数，第四格不留空
    spent: hasSpent
      ? (
        <>
          <span className="mr-[2px] align-baseline text-[0.52em] text-lm-accent-deep/65">¥</span>
          <AnimatedNumber value={Math.round(totalExpenses)} duration={1100} />
        </>
      )
      : <AnimatedNumber value={days} duration={1200} />,
  };

  const labels: Record<string, string> = hasSpent ? {} : { spent: 'Days' };

  return (
    <section className="px-4 lg:px-0 pt-4 pb-1" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>

      {/* 眉标：跟卡片里的「— MEMORY」同一套写法，引导线一直拉到右边缘收掉 */}
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="h-px w-5 bg-lm-accent/45" />
        <span className="text-[9px] leading-none uppercase tracking-[0.26em] text-lm-accent-deep/55 font-display">
          In numbers
        </span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-lm-line/90 to-transparent" />
      </div>

      <div className="relative mt-3 px-1 py-5 md:py-6">

        {/* 暖光晕：从顶上打下来一层，让这条不贴着背景发平 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 135% at 50% -30%, rgba(204,146,102,0.13) 0%, rgba(204,146,102,0.05) 42%, rgba(204,146,102,0) 72%)',
          }}
        />

        {/* 四角刻线：印刷套准角标，比整圈描边轻，但一眼看得出「被框住了」 */}
        {CORNERS.map(pos => (
          <span
            key={pos}
            aria-hidden
            className={`pointer-events-none absolute h-[9px] w-[9px] border-lm-accent/40 ${pos}`}
          />
        ))}

        <div className="relative grid grid-cols-4">
          {CELLS.map((cell, i) => (
            <div key={cell.key} className="relative flex flex-col items-center">
              {/* 上下渐隐的竖分隔 */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-[64%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-lm-line to-transparent"
                />
              )}

              <span className="mb-2 text-[7px] leading-none tracking-[0.3em] text-lm-accent-deep/30 font-display">
                {cell.idx}
              </span>

              <span
                className={`font-display text-[26px] leading-none tabular-nums md:text-[34px] ${
                  cell.key === 'spent' && hasSpent ? 'text-lm-accent-deep' : 'text-lm-ink'
                }`}
              >
                {nodes[cell.key]}
              </span>

              <span className="mt-2 text-[8px] leading-none uppercase tracking-[0.24em] text-lm-body/40">
                {labels[cell.key] ?? cell.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-lm-line/80 to-transparent" />
    </section>
  );
});
