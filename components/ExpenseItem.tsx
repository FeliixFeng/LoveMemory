'use client';

import { Expense } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../lib/constants';

export function ExpenseItem({
  expense, onDelete
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/60 border border-[#efd8c3]/30">
      <div className="flex items-center gap-2">
        <span className="text-base">{cat?.emoji || '📝'}</span>
        <div>
          <span className="text-xs text-[#3d281c]">{cat?.label || expense.category}</span>
          {expense.note && <p className="text-[10px] text-[#5c3d2a]/50">{expense.note}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#d48b60]">{formatCurrency(expense.amount)}</span>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-red-400 hover:bg-red-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
