'use client';

import { AppData, Expense } from '../lib/types';
import { apiFetch, ApiError } from '../app/lib/api-client';

export function useExpenseCRUD(
  data: AppData,
  setData: (updater: (prev: AppData) => AppData) => void,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void) => void
) {
  async function addExpense(eventId: string, expenseData: { amount: number; category: string; note: string }): Promise<boolean> {
    try {
      const { expense } = await apiFetch<{ expense: Expense }>(`/api/events/${eventId}/expenses`, { method: 'POST', body: expenseData });
      setData(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
      setToast('已添加');
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => { void addExpense(eventId, expenseData); });
      } else {
        setToast('添加失败');
      }
      return false;
    }
  }

  async function deleteExpense(id: number) {
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
      setToast('已删除');
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => deleteExpense(id));
      } else {
        setToast('删除失败');
      }
    }
  }

  return { addExpense, deleteExpense };
}
