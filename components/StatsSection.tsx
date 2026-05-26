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
    <section className="px-4 py-4" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
      <div className="flex items-center justify-between px-2">
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-lg">{s.emoji}</span>
            <span className="text-base font-bold text-[#3d281c]">{s.value}</span>
            <span className="text-[10px] text-[#5c3d2a]/40">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
