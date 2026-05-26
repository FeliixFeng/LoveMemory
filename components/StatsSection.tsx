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
    { label: '事件', value: events.length, emoji: '📌' },
    { label: '照片', value: photos.length, emoji: '📷' },
    { label: '花费', value: totalExpenses > 0 ? formatCurrency(totalExpenses) : '¥0', emoji: '💰' },
    { label: '城市', value: locations.size, emoji: '📍' },
    { label: '天数', value: days, emoji: '📅' },
  ];

  return (
    <section className="lm-card rounded-2xl p-4" style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}>
      <h2 className="text-sm font-bold text-[#3d281c] mb-3" style={{ fontFamily: 'Noto Serif SC, serif' }}>我们的足迹</h2>
      <div className="grid grid-cols-5 gap-2">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center py-2 rounded-xl bg-white/50">
            <span className="text-base mb-0.5">{s.emoji}</span>
            <span className="text-sm font-bold text-[#3d281c]">{s.value}</span>
            <span className="text-[10px] text-[#5c3d2a]/50">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
