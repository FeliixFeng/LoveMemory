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

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function getMoodEmoji(mood: string): string {
  return MOODS.find(m => m.id === mood)?.emoji || '';
}

export function calcTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
