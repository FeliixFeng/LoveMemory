import { ICONS, ICON_MAP, MOODS } from './constants';
import type { Expense } from './types';

export function getEmoji(icon: string): string {
  return ICONS.find(i => i.id === (ICON_MAP[icon] || icon))?.emoji || '💕';
}

export function fmt(d: string): string {
  if (!d) return '--';
  return new Date(`${d}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function calcTripDays(date: string, endDate?: string): number {
  if (!date || !endDate || endDate <= date) return 1;
  const start = new Date(`${date}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function fmtRange(date: string, endDate?: string): string {
  if (!date) return '--';
  if (!endDate || endDate <= date) return fmt(date);
  const s = new Date(`${date}T00:00:00`);
  const e = new Date(`${endDate}T00:00:00`);
  const sameYear = s.getFullYear() === e.getFullYear();
  const endStr = sameYear
    ? e.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    : fmt(endDate);
  return `${fmt(date)} - ${endStr}`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function getMoodEmoji(mood: string): string {
  return MOODS.find(m => m.id === mood)?.emoji || '';
}

export function calcTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
