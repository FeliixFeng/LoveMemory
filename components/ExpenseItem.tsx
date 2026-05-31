'use client';

import { Expense } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../lib/constants';

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-50 text-orange-600',
  transport: 'bg-blue-50 text-blue-600',
  accommodation: 'bg-purple-50 text-purple-600',
  tickets: 'bg-pink-50 text-pink-600',
  shopping: 'bg-emerald-50 text-emerald-600',
  gift: 'bg-rose-50 text-rose-600',
  other: 'bg-gray-50 text-gray-600',
};

export function ExpenseItem({
  expense, onDelete
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
  const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/60 border border-[#efd8c3]/30">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${colorClass}`}>
        {cat?.emoji || '📝'}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-[#3d281c]">{cat?.label || expense.category}</span>
        {expense.note && <p className="text-[10px] text-[#5c3d2a]/50 truncate">{expense.note}</p>}
      </div>
      <span className="text-sm font-semibold text-[#d48b60]">{formatCurrency(expense.amount)}</span>
      <button
        onClick={onDelete}
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
