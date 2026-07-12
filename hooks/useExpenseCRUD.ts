'use client';

import { AppData, Expense } from '../lib/types';
import { apiFetch, ApiError } from '../app/lib/api-client';

export function useExpenseCRUD(
  data: AppData,
  save: (next: AppData, msg?: string) => Promise<boolean>,
  setToast: (msg: string) => void,
  onAuthRequired: (op: () => void) => void
) {
  async function addExpense(eventId: string, expenseData: { amount: number; category: string; note: string }) {
    try {
      const { expense } = await apiFetch<{ expense: Expense }>(`/api/events/${eventId}/expenses`, { method: 'POST', body: expenseData });
      await save({ ...data, expenses: [...data.expenses, expense] }, '已添加');
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        onAuthRequired(() => addExpense(eventId, expenseData));
      } else {
        setToast('添加失败');
      }
    }
  }

  async function deleteExpense(id: number) {
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      await save({ ...data, expenses: data.expenses.filter(e => e.id !== id) }, '已删除');
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
