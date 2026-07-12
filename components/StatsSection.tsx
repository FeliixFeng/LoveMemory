'use client';

import { useEffect, useRef, useState } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { calcTotalExpenses, formatCurrency } from '../lib/utils';

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        ref.current = value;
      }
    }

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display}</>;
}

export function StatsSection({
  events, photos, expenses, days
}: {
  events: Event[];
  photos: Photo[];
  expenses: Expense[];
  days: number;
}) {
  const totalExpenses = calcTotalExpenses(expenses);
  const locations = new Set(events.filter(e => e.location).map(e => e.location));

  return (
    <section className="px-4 lg:px-0 py-2" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
      <div className="lm-card rounded-2xl px-5 py-3">
        <div className="flex flex-col items-center gap-1.5">
          {/* Row 1 */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-[#5c3d2a]/55 w-[110px]">
              <span>📌</span>
              <span className="font-bold text-[#3d281c] tabular-nums"><AnimatedNumber value={events.length} duration={800} /></span>
              <span>个事件</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5c3d2a]/55 w-[110px]">
              <span>📷</span>
              <span className="font-bold text-[#3d281c] tabular-nums"><AnimatedNumber value={photos.length} duration={900} /></span>
              <span>张照片</span>
            </div>
          </div>
          {/* Row 2 */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-[#5c3d2a]/55 w-[110px]">
              <span>📍</span>
              <span className="font-bold text-[#3d281c] tabular-nums"><AnimatedNumber value={locations.size} duration={700} /></span>
              <span>座城市</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5c3d2a]/55 w-[110px]">
              <span>📅</span>
              <span className="font-bold text-[#3d281c] tabular-nums"><AnimatedNumber value={days} duration={1200} /></span>
              <span>天</span>
            </div>
          </div>
          {/* Row 3: Expense */}
          {totalExpenses > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5c3d2a]/55 mt-1 pt-1.5 border-t border-[#efd8c3]/30 w-full">
              <span>💰</span>
              <span className="font-bold text-[#d48b60] tabular-nums">{formatCurrency(Math.round(totalExpenses))}</span>
              <span>累计</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
