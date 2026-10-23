'use client';

import { AppData, Expense } from '../lib/types';
import { apiFetch } from '../app/lib/api-client';
import type { MutateOptions } from './useAppData';

type Mutate = <T>(
  optimistic: (prev: AppData) => AppData,
  request: () => Promise<T>,
  opts?: MutateOptions<T>
) => Promise<T | null>;

export function useExpenseCRUD(
  _data: AppData,
  setData: (updater: (prev: AppData) => AppData) => void,
  mutate: Mutate,
  onAuthRequired: (op: () => void | Promise<void>) => void
) {
  async function addExpense(eventId: string, expenseData: { amount: number; category: string; note: string }): Promise<boolean> {
    const res = await mutate<{ expense: Expense }>(
      prev => prev,
      () => apiFetch<{ expense: Expense }>(`/api/events/${eventId}/expenses`, { method: 'POST', body: expenseData }),
      {
        successMsg: '已添加',
        errorMsg: '添加失败',
        onAuthRequired,
        onSuccess: ({ expense }) => {
          setData(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
        }
      }
    );
    return res !== null;
  }

  async function deleteExpense(id: number) {
    await mutate(
      prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }),
      () => apiFetch(`/api/expenses/${id}`, { method: 'DELETE' }),
      { successMsg: '已删除', errorMsg: '删除失败', onAuthRequired }
    );
  }

  return { addExpense, deleteExpense };
}
