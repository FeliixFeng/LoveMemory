'use client';

import { useEffect, useState } from 'react';
import { Wish, Capsule } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { FallingHearts } from './FallingHearts';
import { SkeletonCard } from './SkeletonCard';
import { ConfirmDialog } from './modals/ConfirmDialog';

const WISH_EMOJI_OPTIONS = ['💝', '🌸', '✈️', '🎬', '🍽️', '🏔️', '🎵', '📚', '🎁', '💍'];
const CAPSULE_EMOJI_OPTIONS = ['💌', '💝', '🎁', '🌸', '💕', '🌹', '✨', '🎂'];

type Tab = 'wishes' | 'capsules';

export function WishesCapsulesPage() {
  const { token, withAuth } = useAuth();
  const [tab, setTab] = useState<Tab>('wishes');
  const [loading, setLoading] = useState(true);

  // Wishes state
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [showAddWish, setShowAddWish] = useState(false);
  const [newWish, setNewWish] = useState({ title: '', description: '', emoji: '💝' });
  const [showHearts, setShowHearts] = useState(false);

  // Capsules state
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [showAddCapsule, setShowAddCapsule] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ title: '', content: '', emoji: '💌', unlockDate: '' });
  const [openCapsuleId, setOpenCapsuleId] = useState<number | null>(null);

  // Shared
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/wishes').then(r => r.json()),
      fetch('/api/capsules').then(r => r.json())
    ]).then(([w, c]) => {
      setWishes(Array.isArray(w) ? w : []);
      setCapsules(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  // --- Wish functions ---
  async function createWish() {
    if (!newWish.title.trim()) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch('/api/wishes', { method: 'POST', headers, body: JSON.stringify(newWish) });
    if (r.ok) {
      const { wish } = await r.json();
      setWishes(prev => [...prev, wish]);
      setNewWish({ title: '', description: '', emoji: '💝' });
      setShowAddWish(false);
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
    if (r.ok) setWishes(prev => prev.filter(w => w.id !== id));
  }

  // --- Capsule functions ---
  async function createCapsule() {
    if (!newCapsule.title.trim() || !newCapsule.unlockDate) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch('/api/capsules', { method: 'POST', headers, body: JSON.stringify(newCapsule) });
    if (r.ok) {
      const { capsule } = await r.json();
      setCapsules(prev => [capsule, ...prev]);
      setNewCapsule({ title: '', content: '', emoji: '💌', unlockDate: '' });
      setShowAddCapsule(false);
    }
  }

  async function openCapsule(capsule: Capsule) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/capsules/${capsule.id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ isOpened: true })
    });
    if (r.ok) {
      const { capsule: updated } = await r.json();
      setCapsules(prev => prev.map(c => c.id === capsule.id ? updated : c));
      setOpenCapsuleId(capsule.id);
    }
  }

  async function deleteCapsule(id: number) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/capsules/${id}`, { method: 'DELETE', headers });
    if (r.ok) setCapsules(prev => prev.filter(c => c.id !== id));
  }

  function getDaysLeft(unlockDate: string): number {
    const now = new Date();
    const target = new Date(`${unlockDate}T00:00:00`);
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
  }

  if (loading) return <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const pendingWishes = wishes.filter(w => !w.isCompleted);
  const completedWishes = wishes.filter(w => w.isCompleted);

  return (
    <div className="space-y-4">
      {showHearts && <FallingHearts />}

      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}

      {/* Capsule open modal */}
      {openCapsuleId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30 modal-backdrop" onClick={() => setOpenCapsuleId(null)} />
          <div className="relative w-full sm:max-w-md bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-6 modal-content">
            {(() => {
              const c = capsules.find(x => x.id === openCapsuleId);
              if (!c) return null;
              return (
                <div className="text-center space-y-4">
                  <span className="text-5xl">{c.emoji}</span>
                  <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{c.title}</h2>
                  <p className="text-sm text-[#5c3d2a]/80 whitespace-pre-wrap">{c.content}</p>
                  <button onClick={() => setOpenCapsuleId(null)} className="w-full py-3 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl font-medium">关闭</button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Page header + Tab */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>💝 心愿</h1>
        <button
          onClick={() => withAuth(() => tab === 'wishes' ? setShowAddWish(true) : setShowAddCapsule(true))}
          className="px-3 py-1.5 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl text-xs font-medium active:scale-95 transition-transform"
        >+ {tab === 'wishes' ? '添加' : '写信'}</button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1 lm-card rounded-2xl">
        <button
          onClick={() => setTab('wishes')}
          className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === 'wishes' ? 'bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white font-semibold shadow-sm' : 'text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60'}`}
        >
          💝 愿望 {pendingWishes.length > 0 && `(${pendingWishes.length})`}
        </button>
        <button
          onClick={() => setTab('capsules')}
          className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === 'capsules' ? 'bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white font-semibold shadow-sm' : 'text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60'}`}
        >
          💌 胶囊 {capsules.length > 0 && `(${capsules.length})`}
        </button>
      </div>

      {/* ===== WISHES TAB ===== */}
      {tab === 'wishes' && (
        <>
          {/* Add wish form */}
          {showAddWish && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={newWish.emoji}
                  onChange={e => setNewWish(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {WISH_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
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
                <button onClick={() => setShowAddWish(false)} className="px-3 py-1.5 text-xs text-[#5c3d2a]/60">取消</button>
                <button onClick={() => withAuth(createWish)} className="px-4 py-1.5 text-xs rounded-lg bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white font-medium">保存</button>
              </div>
            </div>
          )}

          {/* Pending wishes */}
          {pendingWishes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs text-[#5c3d2a]/40 font-medium px-1">想一起做的事</h2>
              <div className="stagger space-y-2">
                {pendingWishes.map(wish => (
                  <div key={wish.id} className="lm-card rounded-2xl p-4 flex items-center gap-3">
                    <button
                      onClick={() => withAuth(() => toggleWish(wish))}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0c8a8] to-[#d48b60] flex items-center justify-center text-lg shrink-0 shadow-sm active:scale-95 transition-transform"
                    >{wish.emoji}</button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#3d281c]">{wish.title}</h3>
                      {wish.description && <p className="text-[11px] text-[#5c3d2a]/50 mt-0.5 truncate">{wish.description}</p>}
                    </div>
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed wishes */}
          {completedWishes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs text-[#5c3d2a]/40 font-medium px-1">已完成 ✓</h2>
              <div className="stagger space-y-2">
                {completedWishes.map(wish => (
                  <div key={wish.id} className="lm-card rounded-2xl p-4 flex items-center gap-3 opacity-60">
                    <button
                      onClick={() => withAuth(() => toggleWish(wish))}
                      className="w-10 h-10 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-lg shrink-0 active:scale-95 transition-transform"
                    >✓</button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#3d281c] line-through">{wish.title}</h3>
                      {wish.description && <p className="text-[11px] text-[#5c3d2a]/50 mt-0.5 truncate">{wish.description}</p>}
                    </div>
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wishes.length === 0 && !showAddWish && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-3">💝</span>
              <p className="text-sm text-[#5c3d2a]/50">还没有愿望</p>
              <p className="text-xs text-[#5c3d2a]/30 mt-1">点击"添加"创建第一个愿望</p>
            </div>
          )}
        </>
      )}

      {/* ===== CAPSULES TAB ===== */}
      {tab === 'capsules' && (
        <>
          {/* Add capsule form */}
          {showAddCapsule && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={newCapsule.emoji}
                  onChange={e => setNewCapsule(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {CAPSULE_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  value={newCapsule.title}
                  onChange={e => setNewCapsule(d => ({ ...d, title: e.target.value }))}
                  placeholder="标题"
                  className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
                />
              </div>
              <textarea
                value={newCapsule.content}
                onChange={e => setNewCapsule(d => ({ ...d, content: e.target.value }))}
                placeholder="写给未来的信..."
                rows={4}
                className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60] resize-none"
              />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-[#5c3d2a]/40">解锁日期：</span>
                <input
                  type="date"
                  value={newCapsule.unlockDate}
                  onChange={e => setNewCapsule(d => ({ ...d, unlockDate: e.target.value }))}
                  className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddCapsule(false)} className="px-3 py-1.5 text-xs text-[#5c3d2a]/60">取消</button>
                <button onClick={() => withAuth(createCapsule)} className="px-4 py-1.5 text-xs rounded-lg bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white font-medium">封存</button>
              </div>
            </div>
          )}

          {/* Capsule grid */}
          {capsules.length === 0 && !showAddCapsule ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-3">💌</span>
              <p className="text-sm text-[#5c3d2a]/50">还没有时光胶囊</p>
              <p className="text-xs text-[#5c3d2a]/30 mt-1">点击"写信"给未来的ta写一封信</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 stagger">
              {capsules.map(capsule => {
                const daysLeft = getDaysLeft(capsule.unlockDate);
                const canOpen = daysLeft <= 0 || capsule.isOpened;
                return (
                  <div
                    key={capsule.id}
                    className={`lm-card rounded-2xl p-4 text-center space-y-2 ${canOpen ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
                    onClick={() => canOpen && withAuth(() => openCapsule(capsule))}
                  >
                    <span className="text-3xl">{capsule.emoji}</span>
                    <h3 className="text-sm font-bold text-[#3d281c] truncate" style={{ fontFamily: 'Noto Serif SC, serif' }}>{capsule.title}</h3>
                    {canOpen ? (
                      <p className="text-xs text-emerald-500 font-medium">{capsule.isOpened ? '已打开' : '可打开'}</p>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-[#aa6f4d]" style={{ fontFamily: 'Playfair Display, serif' }}>{daysLeft}</p>
                        <p className="text-[10px] text-[#5c3d2a]/40">天后解锁</p>
                      </div>
                    )}
                    {!canOpen && (
                      <p className="text-[10px] text-[#5c3d2a]/30">🔒 {capsule.unlockDate}</p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个时光胶囊吗？', onConfirm: () => deleteCapsule(capsule.id) }));
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors mx-auto"
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
