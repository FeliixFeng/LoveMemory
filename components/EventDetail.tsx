'use client';

import { useState } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../lib/constants';
import { ExpenseItem } from './ExpenseItem';
import { SafeImage } from './SafeImage';

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
  onAddExpense: (data: { amount: number; category: string; note: string }) => void;
  onDeleteExpense: (id: number) => void;
  onViewPhoto: (photos: Photo[], index: number) => void;
  uploading: boolean;
  uploadProgress: number;
  deleting: string;
}) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState({ amount: '', category: 'food', note: '' });
  const total = calcTotalExpenses(expenses);

  function handleAddExpense() {
    const amount = parseFloat(expenseDraft.amount);
    if (!amount || amount <= 0) return;
    onAddExpense({ amount, category: expenseDraft.category, note: expenseDraft.note });
    setExpenseDraft({ amount: '', category: 'food', note: '' });
    setShowAddExpense(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg max-h-[85vh] bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-10 px-5 py-4 border-b border-[#efd8c3]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
                  boxShadow: '0 2px 8px rgba(170,111,77,0.25)'
                }}
              >
                {getEmoji(event.icon)}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                  {event.title || '未命名事件'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-[#5c3d2a]/50">
                  <span>{fmt(event.date)}</span>
                  {event.location && <span>· 📍 {event.location}</span>}
                  {event.mood && <span>· {getMoodEmoji(event.mood)}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="px-3 py-1.5 text-xs rounded-lg bg-[#efd8c3]/40 text-[#5c3d2a] hover:bg-[#efd8c3]/60 transition-colors">编辑</button>
              <button onClick={onClose} className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-[#5c3d2a]/50 hover:bg-[#efd8c3]/30 transition-colors">✕</button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Description */}
          {event.desc && (
            <p className="text-sm text-[#5c3d2a]/80 leading-relaxed">{event.desc}</p>
          )}

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#3d281c]">
                照片 {photos.length > 0 && <span className="text-[#5c3d2a]/40 font-normal">({photos.length})</span>}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#efd8c3]/20 group cursor-pointer">
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
                      className="absolute bottom-1.5 left-1.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm flex items-center justify-center opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#aa6f4d] transition-all"
                    >
                      ‹
                    </button>
                  )}
                  {/* Move right */}
                  {i < photos.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorderPhotos(i, i + 1); }}
                      className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm flex items-center justify-center opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#aa6f4d] transition-all"
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
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-[#efd8c3] flex flex-col items-center justify-center gap-1 text-[#5c3d2a]/40 hover:border-[#d48b60] hover:text-[#d48b60] transition-colors disabled:opacity-50 relative overflow-hidden"
              >
                {uploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#efd8c3]">
                    <div className="h-full bg-[#d48b60] transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} />
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
              <h3 className="text-sm font-bold text-[#3d281c]">
                账单 {total > 0 && <span className="text-[#d48b60] font-normal">({formatCurrency(total)})</span>}
              </h3>
              <button
                onClick={() => setShowAddExpense(true)}
                className="px-3 py-1 text-xs rounded-lg bg-[#d48b60] text-white"
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
                <div className="mb-3 p-3 rounded-xl bg-white/40 border border-[#efd8c3]/20 space-y-2">
                  {entries.map(([catId, amount]) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
                    const pct = total > 0 ? (amount / total) * 100 : 0;
                    return (
                      <div key={catId} className="flex items-center gap-2">
                        <span className="text-xs w-12 text-[#5c3d2a]/60">{cat?.emoji} {cat?.label}</span>
                        <div className="flex-1 h-2 bg-[#efd8c3]/20 rounded-full overflow-hidden">
                          <div className="h-full bg-[#d48b60]/60 rounded-full transition-[width]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-[#5c3d2a]/40 w-12 text-right">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {expenses.length === 0 && !showAddExpense ? (
              <div className="py-6 text-center">
                <span className="text-2xl mb-2 block">💰</span>
                <p className="text-xs text-[#5c3d2a]/30">还没有账单</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map(e => (
                  <ExpenseItem key={e.id} expense={e} onDelete={() => onDeleteExpense(e.id)} />
                ))}
              </div>
            )}

            {showAddExpense && (
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-b from-white to-[#fdfbf7] border border-[#efd8c3]/40 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="金额"
                    value={expenseDraft.amount}
                    onChange={e => setExpenseDraft(d => ({ ...d, amount: e.target.value }))}
                    className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
                  />
                  <select
                    value={expenseDraft.category}
                    onChange={e => setExpenseDraft(d => ({ ...d, category: e.target.value }))}
                    className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
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
                  className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 text-xs text-[#5c3d2a]/60 hover:text-[#5c3d2a] transition-colors">取消</button>
                  <button onClick={handleAddExpense} className="px-5 py-2 text-xs rounded-xl bg-[#3d281c] text-amber-50 font-medium active:scale-95 transition-transform">保存</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
