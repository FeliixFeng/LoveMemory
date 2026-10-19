'use client';

import { useEffect, useRef, useState } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../lib/constants';
import { ExpenseItem } from './ExpenseItem';
import { SafeImage } from './SafeImage';
import { Overlay } from './ui/Overlay';

export function EventDetail({
  event, photos, expenses, onClose, onEdit, onAddPhoto, onDeletePhoto, onReorderPhotos, onAddExpense, onDeleteExpense, onViewPhoto, uploading, uploadProgress, deleting
}: {
  event: Event;
  photos: Photo[];
  expenses: Expense[];
  onClose: () => void;
  onEdit: () => void;
  onAddPhoto: () => void;
  onDeletePhoto: (p: Photo) => void;
  onReorderPhotos: (fromIndex: number, toIndex: number) => void;
  onAddExpense: (data: { amount: number; category: string; note: string }) => Promise<boolean>;
  onDeleteExpense: (id: number) => void;
  onViewPhoto: (photos: Photo[], index: number) => void;
  uploading: boolean;
  uploadProgress: number;
  deleting: string;
}) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState({ amount: '', category: 'food', note: '' });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const total = calcTotalExpenses(expenses);

  const formRef = useRef<HTMLDivElement>(null);
  const lastExpenseRef = useRef<HTMLDivElement>(null);
  // 记录上一次的账单数量，用来判断「新增了一条」
  const prevExpenseRef = useRef({ eventId: event.id, count: expenses.length });
  // 本次提交是否还在进行中：避免乐观更新时把表单提前关掉
  const savingRef = useRef(false);

  // 打开表单时，把输入框滚进可视区（列表长的时候表单会落在屏幕外）
  useEffect(() => {
    if (!showAddExpense) return;
    const raf = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [showAddExpense]);

  // 账单数量增加时，滚到最新一条；如果表单还开着（例如走 PIN 验证后重试成功），顺手收起
  useEffect(() => {
    const prev = prevExpenseRef.current;
    prevExpenseRef.current = { eventId: event.id, count: expenses.length };

    // 切换事件不算新增
    if (prev.eventId !== event.id || expenses.length <= prev.count) return;

    const raf = requestAnimationFrame(() => {
      lastExpenseRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    // 如果不是本次表单提交触发的（例如 PIN 验证后重试成功），顺手把表单收起
    if (showAddExpense && !savingRef.current) {
      setShowAddExpense(false);
      setExpenseDraft({ amount: '', category: 'food', note: '' });
    }
    return () => cancelAnimationFrame(raf);
  }, [expenses.length, event.id]);

  async function handleAddExpense() {
    const amount = parseFloat(expenseDraft.amount);
    if (!amount || amount <= 0 || submittingExpense) return;

    setSubmittingExpense(true);
    savingRef.current = true;
    const ok = await onAddExpense({ amount, category: expenseDraft.category, note: expenseDraft.note });
    savingRef.current = false;
    setSubmittingExpense(false);

    // 只有真正保存成功才收起表单，失败时保留草稿
    if (ok) {
      setExpenseDraft({ amount: '', category: 'food', note: '' });
      setShowAddExpense(false);
    }
  }

  return (
    <Overlay
      onClose={onClose}
      layer="sheet"
      labelledBy="event-detail-title"
      panelClassName="w-full sm:max-w-lg max-h-[85dvh] bg-lm-bg rounded-t-2xl sm:rounded-2xl overflow-y-auto pb-[env(safe-area-inset-bottom)]"
    >
        {/* Header */}
        <div className="sticky top-0 bg-lm-bg/95 backdrop-blur-sm z-10 px-5 py-4 border-b border-lm-line/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--lm-accent), var(--lm-accent-deep))',
                  boxShadow: '0 2px 8px rgba(173,124,87,0.25)'
                }}
              >
                {getEmoji(event.icon)}
              </div>
              <div>
                <h2 id="event-detail-title" className="text-base font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>
                  {event.title || '未命名事件'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-lm-body/50">
                  <span>{fmt(event.date)}</span>
                  {event.location && <span>· 📍 {event.location}</span>}
                  {event.mood && <span>· {getMoodEmoji(event.mood)}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-lm-accent/10 to-lm-accent-deep/10 text-lm-accent-deep hover:from-lm-accent/20 hover:to-lm-accent-deep/20 transition-colors font-medium">编辑</button>
              <button onClick={onClose} className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-lm-body/50 hover:bg-lm-line/30 transition-colors">✕</button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Description */}
          {event.desc && (
            <p className="text-sm text-lm-body/80 leading-relaxed">{event.desc}</p>
          )}

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-lm-ink">
                照片 {photos.length > 0 && <span className="text-lm-body/40 font-normal">({photos.length})</span>}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-lm-line/20 group cursor-pointer">
                  <SafeImage
                    src={p.thumbUrl || p.displayUrl || p.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 200px"
                    className="object-cover"
                    onClick={() => onViewPhoto(photos, i)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                  {/* Move left */}
                  {i > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorderPhotos(i, i - 1); }}
                      className="absolute bottom-1.5 left-1.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm flex items-center justify-center opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-lm-accent-deep transition-all"
                    >
                      ‹
                    </button>
                  )}
                  {/* Move right */}
                  {i < photos.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorderPhotos(i, i + 1); }}
                      className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm flex items-center justify-center opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-lm-accent-deep transition-all"
                    >
                      ›
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeletePhoto(p); }}
                    disabled={deleting === p.url}
                    className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs flex items-center justify-center opacity-70 md:opacity-40 md:group-hover:opacity-100 hover:!bg-red-500 transition-all disabled:opacity-50"
                  >
                    {deleting === p.url ? '...' : '✕'}
                  </button>
                </div>
              ))}

              {/* Add photo button */}
              <button
                onClick={onAddPhoto}
                disabled={uploading}
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-lm-line flex flex-col items-center justify-center gap-1 text-lm-body/40 hover:border-lm-accent hover:text-lm-accent transition-colors disabled:opacity-50 relative overflow-hidden"
              >
                {uploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-lm-line">
                    <div className="h-full bg-lm-accent transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <span className="text-2xl">{uploading ? '⏳' : '+'}</span>
                <span className="text-[10px]">{uploading ? `${uploadProgress}%` : '添加照片'}</span>
              </button>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-lm-ink">
                账单 {total > 0 && <span className="text-lm-accent font-normal">({formatCurrency(total)})</span>}
              </h3>
              <button
                onClick={() => setShowAddExpense(true)}
                className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white shadow-sm"
              >
                + 添加
              </button>
            </div>

            {/* Category summary bars */}
            {expenses.length > 0 && (() => {
              const byCategory: Record<string, number> = {};
              expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
              const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
              return (
                <div className="mb-3 p-3 rounded-xl bg-white/40 border border-lm-line/20 space-y-2">
                  {entries.map(([catId, amount]) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
                    const pct = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={catId} className="flex items-center gap-2">
                        <span className="text-xs w-12 text-lm-body/60">{cat?.emoji} {cat?.label}</span>
                        <div className="flex-1 h-2 bg-lm-line/20 rounded-full overflow-hidden">
                          <div className="h-full bg-lm-accent/60 rounded-full transition-[width]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-lm-body/40 w-12 text-right">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {expenses.length === 0 && !showAddExpense ? (
              <div className="py-6 text-center">
                <span className="text-2xl mb-2 block">💰</span>
                <p className="text-xs text-lm-body/30">还没有账单</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e, i) => (
                  <div key={e.id} ref={i === expenses.length - 1 ? lastExpenseRef : undefined}>
                    <ExpenseItem expense={e} onDelete={() => onDeleteExpense(e.id)} />
                  </div>
                ))}
              </div>
            )}

            {showAddExpense && (
              <div ref={formRef} className="mt-3 p-4 rounded-xl bg-gradient-to-b from-white to-lm-bg border border-lm-line/40 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="金额"
                    value={expenseDraft.amount}
                    onChange={e => setExpenseDraft(d => ({ ...d, amount: e.target.value }))}
                    className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-lm-accent transition-colors"
                  />
                  <select
                    value={expenseDraft.category}
                    onChange={e => setExpenseDraft(d => ({ ...d, category: e.target.value }))}
                    className="bg-white border border-lm-line/60 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-lm-accent transition-colors"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="备注（可选）"
                  value={expenseDraft.note}
                  onChange={e => setExpenseDraft(d => ({ ...d, note: e.target.value }))}
                  className="w-full bg-white border border-lm-line/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-lm-accent transition-colors"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddExpense(false)} disabled={submittingExpense} className="px-4 py-2 text-xs text-lm-body/60 hover:text-lm-body transition-colors disabled:opacity-50">取消</button>
                  <button onClick={handleAddExpense} disabled={submittingExpense} className="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium active:scale-95 transition-transform shadow-sm disabled:opacity-60">
                    {submittingExpense ? '保存中…' : '保存'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
    </Overlay>
  );
}
