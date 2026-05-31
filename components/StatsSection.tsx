'use client';

import { Event, Photo, Expense } from '../lib/types';
import { calcTotalExpenses, formatCurrency } from '../lib/utils';

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

  const stats = [
    { label: '事件', value: events.length, emoji: '📌', color: 'from-pink-50 to-rose-50' },
    { label: '照片', value: photos.length, emoji: '📷', color: 'from-amber-50 to-orange-50' },
    { label: '花费', value: totalExpenses > 0 ? formatCurrency(totalExpenses) : '¥0', emoji: '💰', color: 'from-emerald-50 to-teal-50' },
    { label: '城市', value: locations.size, emoji: '📍', color: 'from-blue-50 to-cyan-50' },
    { label: '天数', value: days, emoji: '📅', color: 'from-purple-50 to-violet-50' },
  ];

  return (
    <section className="px-4 py-4" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl bg-gradient-to-b ${s.color} border border-white/60`}>
            <span className="text-base">{s.emoji}</span>
            <span className="text-sm font-bold text-[#3d281c]">{s.value}</span>
            <span className="text-[9px] text-[#5c3d2a]/50">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
