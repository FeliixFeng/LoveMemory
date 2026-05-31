'use client';

import { useEffect, useState } from 'react';
import { Wish } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { FallingHearts } from './FallingHearts';
import { SkeletonCard } from './SkeletonCard';

const EMOJI_OPTIONS = ['💝', '🌸', '✈️', '🎬', '🍽️', '🏔️', '🎵', '📚', '🎁', '💍'];

export function WishesPage() {
  const { token, withAuth } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWish, setNewWish] = useState({ title: '', description: '', emoji: '💝' });
  const [showHearts, setShowHearts] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch('/api/wishes').then(r => r.json()).then(d => {
      setWishes(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, []);

  async function createWish() {
    if (!newWish.title.trim()) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch('/api/wishes', { method: 'POST', headers, body: JSON.stringify(newWish) });
    if (r.ok) {
      const { wish } = await r.json();
      setWishes(prev => [...prev, wish]);
      setNewWish({ title: '', description: '', emoji: '💝' });
      setShowAdd(false);
    }
  }

  async function toggleWish(wish: Wish) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/wishes/${wish.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ isCompleted: !wish.isCompleted, completedAt: !wish.isCompleted ? new Date().toISOString() : null })
    });
    if (r.ok) {
      const { wish: updated } = await r.json();
      setWishes(prev => prev.map(w => w.id === wish.id ? updated : w));
      if (!wish.isCompleted) {
        setShowHearts(true);
        setTimeout(() => setShowHearts(false), 3000);
      }
    }
  }

  async function deleteWish(id: number) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/wishes/${id}`, { method: 'DELETE', headers });
    if (r.ok) {
      setWishes(prev => prev.filter(w => w.id !== id));
    }
  }

  if (loading) return <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const pending = wishes.filter(w => !w.isCompleted);
  const completed = wishes.filter(w => w.isCompleted);

  return (
    <div className="space-y-4">
      {showHearts && <FallingHearts />}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirm(null)} />
          <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <h3 className="text-base font-bold text-[#3d281c] mb-2 text-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>{confirm.title}</h3>
            <p className="text-sm text-[#aa6f4d] text-center mb-5">{confirm.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-3 bg-white border border-[#efd8c3] text-[#3d281c] rounded-xl font-medium">取消</button>
              <button onClick={() => { confirm.onConfirm(); setConfirm(null); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium">确认</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>💝 愿望清单</h1>
        <button
          onClick={() => withAuth(() => setShowAdd(true))}
          className="px-3 py-1.5 bg-[#aa6f4d] text-white rounded-xl text-xs font-medium"
        >+ 添加</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="lm-card rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={newWish.emoji}
              onChange={e => setNewWish(d => ({ ...d, emoji: e.target.value }))}
              className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none"
            >
              {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input
              type="text"
              value={newWish.title}
              onChange={e => setNewWish(d => ({ ...d, title: e.target.value }))}
              placeholder="愿望标题"
              className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
            />
          </div>
          <input
            type="text"
            value={newWish.description}
            onChange={e => setNewWish(d => ({ ...d, description: e.target.value }))}
            placeholder="描述（可选）"
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#5c3d2a]/60">取消</button>
            <button onClick={() => withAuth(createWish)} className="px-4 py-1.5 text-xs rounded-lg bg-[#3d281c] text-amber-50">保存</button>
          </div>
        </div>
      )}

      {/* Pending wishes */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs text-[#5c3d2a]/40 font-medium">想一起做的事</h2>
          {pending.map(wish => (
            <div key={wish.id} className="lm-card rounded-2xl p-4 flex items-start gap-3">
              <button
                onClick={() => withAuth(() => toggleWish(wish))}
                className="w-8 h-8 rounded-full border-2 border-[#efd8c3] flex items-center justify-center text-lg shrink-0 hover:border-[#d48b60] transition-colors"
              >{wish.emoji}</button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#3d281c]">{wish.title}</h3>
                {wish.description && <p className="text-xs text-[#5c3d2a]/50 mt-0.5">{wish.description}</p>}
              </div>
              <button
                onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/30 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Completed wishes */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs text-[#5c3d2a]/40 font-medium">已完成 ✓</h2>
          {completed.map(wish => (
            <div key={wish.id} className="lm-card rounded-2xl p-4 flex items-start gap-3 opacity-60">
              <button
                onClick={() => withAuth(() => toggleWish(wish))}
                className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-lg shrink-0"
              >✓</button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#3d281c] line-through">{wish.title}</h3>
                {wish.description && <p className="text-xs text-[#5c3d2a]/50 mt-0.5">{wish.description}</p>}
              </div>
              <button
                onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/30 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {wishes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-3">💝</span>
          <p className="text-sm text-[#5c3d2a]/50">还没有愿望</p>
          <p className="text-xs text-[#5c3d2a]/30 mt-1">点击"添加"创建第一个愿望</p>
        </div>
      )}
    </div>
  );
}
