'use client';

import { memo, useEffect, useRef, useState } from 'react';
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

export const StatsSection = memo(function StatsSection({
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
      <div className="lm-card rounded-2xl p-4">
        {/* Desktop: one row with badges */}
        <div className="hidden md:flex items-center justify-center gap-3 flex-wrap">
          {[
            { emoji: '📌', value: events.length, label: '个事件', color: 'from-pink-50 to-rose-50', border: 'border-pink-100/50', duration: 800 },
            { emoji: '📷', value: photos.length, label: '张照片', color: 'from-amber-50 to-orange-50', border: 'border-amber-100/50', duration: 900 },
            { emoji: '📍', value: locations.size, label: '座城市', color: 'from-blue-50 to-cyan-50', border: 'border-blue-100/50', duration: 700 },
            { emoji: '📅', value: days, label: '天', color: 'from-purple-50 to-violet-50', border: 'border-purple-100/50', duration: 1200 },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${item.color} border ${item.border}`}>
              <span className="text-sm">{item.emoji}</span>
              <span className="font-bold text-[#3d281c] text-xs tabular-nums"><AnimatedNumber value={item.value} duration={item.duration} /></span>
              <span className="text-[10px] text-[#5c3d2a]/50">{item.label}</span>
            </div>
          ))}
          {totalExpenses > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50">
              <span className="text-sm">💰</span>
              <span className="font-bold text-[#d48b60] text-xs tabular-nums">{formatCurrency(Math.round(totalExpenses))}</span>
              <span className="text-[10px] text-[#5c3d2a]/50">累计</span>
            </div>
          )}
        </div>

        {/* Mobile: grid badges */}
        <div className="md:hidden grid grid-cols-2 gap-2">
          {[
            { emoji: '📌', value: events.length, label: '个事件', color: 'from-pink-50 to-rose-50', border: 'border-pink-100/50', duration: 800 },
            { emoji: '📷', value: photos.length, label: '张照片', color: 'from-amber-50 to-orange-50', border: 'border-amber-100/50', duration: 900 },
            { emoji: '📍', value: locations.size, label: '座城市', color: 'from-blue-50 to-cyan-50', border: 'border-blue-100/50', duration: 700 },
            { emoji: '📅', value: days, label: '天', color: 'from-purple-50 to-violet-50', border: 'border-purple-100/50', duration: 1200 },
          ].map(item => (
            <div key={item.label} className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r ${item.color} border ${item.border}`}>
              <span className="text-sm">{item.emoji}</span>
              <span className="font-bold text-[#3d281c] text-xs tabular-nums"><AnimatedNumber value={item.value} duration={item.duration} /></span>
              <span className="text-[10px] text-[#5c3d2a]/50">{item.label}</span>
            </div>
          ))}
          {totalExpenses > 0 && (
            <div className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50">
              <span className="text-sm">💰</span>
              <span className="font-bold text-[#d48b60] text-xs tabular-nums">{formatCurrency(Math.round(totalExpenses))}</span>
              <span className="text-[10px] text-[#5c3d2a]/50">累计</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
})
