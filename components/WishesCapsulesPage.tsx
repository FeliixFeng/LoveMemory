'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Wish, Capsule, Event } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { useAppData } from '../hooks/useAppData';
import { apiFetch } from '../app/lib/api-client';
import { FallingHearts } from './FallingHearts';
import { SkeletonCard } from './SkeletonCard';
import { ConfirmDialog } from './modals/ConfirmDialog';

const WISH_EMOJI_OPTIONS = ['💝', '🌸', '✈️', '🎬', '🍽️', '🏔️', '🎵', '📚', '🎁', '💍'];
const CAPSULE_EMOJI_OPTIONS = ['💌', '💝', '🎁', '🌸', '💕', '🌹', '✨', '🎂'];

type Tab = 'wishes' | 'capsules';

export function WishesCapsulesPage() {
  const { withAuth, pendingOp, setShowPin } = useAuth();
  const { data, setData, mutate, loading } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = pathname === '/capsule' ? 'capsules' : 'wishes';

  /* 愿望和胶囊现在都读 AppDataProvider，不再各自 fetch 一份
     —— 否则在心愿页勾掉一个，首页统计和别处永远不知道 */
  const wishes = data.wishes;
  const capsules = data.capsules;

  const [showAddWish, setShowAddWish] = useState(false);
  const [newWish, setNewWish] = useState({ title: '', description: '', emoji: '💝' });
  const [showHearts, setShowHearts] = useState(false);

  const [showAddCapsule, setShowAddCapsule] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ title: '', content: '', emoji: '💌', unlockDate: '' });
  const [openCapsuleId, setOpenCapsuleId] = useState<number | null>(null);
  const [openedIds, setOpenedIds] = useState<number[]>([]);

  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const onAuthRequired = (op: () => void | Promise<void>) => {
    pendingOp.current = op;
    setShowPin(true);
  };

  const hasMemory = (wishId?: number, capsuleId?: number) =>
    data.events.some(e => (wishId != null && e.wishId === wishId) || (capsuleId != null && e.capsuleId === capsuleId));

  /* 把一次「愿望达成」或「开启胶囊」落成一条真实回忆，并回填来源，
     这样首页时间轴、相册、统计里才看得到 —— 以前这两张表是死胡同 */
  async function createMemoryFrom(source: { title: string; desc?: string; wishId?: number; capsuleId?: number }): Promise<void> {
    await mutate<{ event: Event }>(
      prev => prev,
      () => apiFetch<{ event: Event }>('/api/events', {
        method: 'POST',
        body: {
          title: source.title,
          date: new Date().toISOString().slice(0, 10),
          desc: source.desc || '',
          icon: source.wishId != null ? 'gift' : 'anniversary',
          location: '',
          mood: '',
          coverPhoto: '',
          wishId: source.wishId ?? null,
          capsuleId: source.capsuleId ?? null
        }
      }),
      {
        successMsg: '已记成回忆，去首页补张照片吧',
        errorMsg: '创建失败',
        onAuthRequired,
        onSuccess: ({ event }) => {
          setData(prev => ({ ...prev, events: [event, ...prev.events] }));
        }
      }
    );
  }

  // --- Wish ---
  async function createWish() {
    if (!newWish.title.trim()) return;
    const res = await mutate<{ wish: Wish }>(
      prev => prev,
      () => apiFetch<{ wish: Wish }>('/api/wishes', { method: 'POST', body: newWish }),
      {
        errorMsg: '创建失败',
        onAuthRequired,
        onSuccess: ({ wish }) => setData(prev => ({ ...prev, wishes: [...prev.wishes, wish] }))
      }
    );
    if (res !== null) {
      setNewWish({ title: '', description: '', emoji: '💝' });
      setShowAddWish(false);
    }
  }

  async function toggleWish(wish: Wish) {
    const next = !wish.isCompleted;
    const completedAt = next ? new Date().toISOString() : null;
    const res = await mutate(
      prev => ({
        ...prev,
        wishes: prev.wishes.map(w => (w.id === wish.id ? { ...w, isCompleted: next, completedAt } : w))
      }),
      () => apiFetch(`/api/wishes/${wish.id}`, { method: 'PUT', body: { isCompleted: next, completedAt } }),
      { errorMsg: '更新失败', onAuthRequired }
    );
    if (res !== null && next) {
      setShowHearts(true);
      setTimeout(() => setShowHearts(false), 3000);
    }
  }

  async function deleteWish(id: number) {
    await mutate(
      prev => ({ ...prev, wishes: prev.wishes.filter(w => w.id !== id) }),
      () => apiFetch(`/api/wishes/${id}`, { method: 'DELETE' }),
      { errorMsg: '删除失败', onAuthRequired }
    );
  }

  // --- Capsule ---
  async function createCapsule() {
    if (!newCapsule.title.trim() || !newCapsule.unlockDate) return;
    const res = await mutate<{ capsule: Capsule }>(
      prev => prev,
      () => apiFetch<{ capsule: Capsule }>('/api/capsules', { method: 'POST', body: newCapsule }),
      {
        errorMsg: '封存失败',
        onAuthRequired,
        onSuccess: ({ capsule }) => setData(prev => ({ ...prev, capsules: [capsule, ...prev.capsules] }))
      }
    );
    if (res !== null) {
      setNewCapsule({ title: '', content: '', emoji: '💌', unlockDate: '' });
      setShowAddCapsule(false);
    }
  }

  /* 解锁由服务端判定：未到日期，正文根本没下发，前端拿不到也没什么可遮的 */
  function openCapsule(capsule: Capsule) {
    if (capsule.locked) return;
    setOpenCapsuleId(capsule.id);
    setOpenedIds(prev => (prev.includes(capsule.id) ? prev : [...prev, capsule.id]));
  }

  async function deleteCapsule(id: number) {
    await mutate(
      prev => ({ ...prev, capsules: prev.capsules.filter(c => c.id !== id) }),
      () => apiFetch(`/api/capsules/${id}`, { method: 'DELETE' }),
      { errorMsg: '删除失败', onAuthRequired }
    );
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

      {openCapsuleId !== null && (() => {
        const c = capsules.find(x => x.id === openCapsuleId);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/30 modal-backdrop" onClick={() => setOpenCapsuleId(null)} />
            <div className="relative w-full sm:max-w-md bg-lm-bg rounded-t-2xl sm:rounded-2xl p-6 modal-content">
              <div className="text-center space-y-4">
                <span className="text-5xl">{c.emoji}</span>
                <h2 className="text-lg font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>{c.title}</h2>
                <p className="text-sm text-lm-body/80 whitespace-pre-wrap">{c.content}</p>
                {!hasMemory(undefined, c.id) && (
                  <button
                    onClick={() => withAuth(() => createMemoryFrom({ title: c.title, desc: c.content, capsuleId: c.id }))}
                    className="w-full py-2.5 rounded-xl border border-lm-accent/40 text-lm-accent-deep text-xs font-medium bg-white/50"
                  >
                    把这一刻记成回忆
                  </button>
                )}
                <button onClick={() => setOpenCapsuleId(null)} className="w-full py-3 bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white rounded-xl font-medium">关闭</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Page header + Tab */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>💝 心愿</h1>
        <button
          onClick={() => withAuth(() => tab === 'wishes' ? setShowAddWish(true) : setShowAddCapsule(true))}
          className="px-3 py-1.5 bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white rounded-xl text-xs font-medium active:scale-95 transition-transform"
        >+ {tab === 'wishes' ? '添加' : '写信'}</button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1 lm-card rounded-2xl">
        <button
          onClick={() => router.push('/wishes')}
          className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === 'wishes' ? 'bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-semibold shadow-sm' : 'text-lm-body/40 hover:text-lm-body/60'}`}
        >
          💝 愿望 {pendingWishes.length > 0 && `(${pendingWishes.length})`}
        </button>
        <button
          onClick={() => router.push('/capsule')}
          className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === 'capsules' ? 'bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-semibold shadow-sm' : 'text-lm-body/40 hover:text-lm-body/60'}`}
        >
          💌 胶囊 {capsules.length > 0 && `(${capsules.length})`}
        </button>
      </div>

      {/* ===== WISHES TAB ===== */}
      {tab === 'wishes' && (
        <>
          {showAddWish && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={newWish.emoji}
                  onChange={e => setNewWish(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white border border-lm-line/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {WISH_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  value={newWish.title}
                  onChange={e => setNewWish(d => ({ ...d, title: e.target.value }))}
                  placeholder="愿望标题"
                  className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <input
                type="text"
                value={newWish.description}
                onChange={e => setNewWish(d => ({ ...d, description: e.target.value }))}
                placeholder="描述（可选）"
                className="w-full bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddWish(false)} className="px-3 py-1.5 text-xs text-lm-body/60">取消</button>
                <button onClick={() => withAuth(createWish)} className="px-4 py-1.5 text-xs rounded-lg bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium">保存</button>
              </div>
            </div>
          )}

          {pendingWishes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs text-lm-body/40 font-medium px-1">想一起做的事</h2>
              <div className="stagger space-y-2">
                {pendingWishes.map(wish => (
                  <div key={wish.id} className="lm-card rounded-2xl p-4 flex items-center gap-3">
                    <button
                      onClick={() => withAuth(() => toggleWish(wish))}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-lm-blush to-lm-accent flex items-center justify-center text-lg shrink-0 shadow-sm active:scale-95 transition-transform"
                    >{wish.emoji}</button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-lm-ink">{wish.title}</h3>
                      {wish.description && <p className="text-[11px] text-lm-body/50 mt-0.5 truncate">{wish.description}</p>}
                    </div>
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/20 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedWishes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs text-lm-body/40 font-medium px-1">已完成 ✓</h2>
              <div className="stagger space-y-2">
                {completedWishes.map(wish => (
                  <div key={wish.id} className="lm-card rounded-2xl p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => withAuth(() => toggleWish(wish))}
                        className="w-10 h-10 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-lg shrink-0 active:scale-95 transition-transform"
                      >✓</button>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-lm-ink line-through">{wish.title}</h3>
                        {wish.description && <p className="text-[11px] text-lm-body/50 mt-0.5 truncate">{wish.description}</p>}
                      </div>
                      <button
                        onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/20 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                      >×</button>
                    </div>
                    {!hasMemory(wish.id) && (
                      <button
                        onClick={() => withAuth(() => createMemoryFrom({ title: wish.title, desc: wish.description, wishId: wish.id }))}
                        className="mt-2.5 w-full py-2 rounded-xl border border-lm-accent/30 text-lm-accent-deep text-[11px] font-medium bg-white/50 active:scale-[0.99] transition-transform"
                      >
                        记成回忆
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {wishes.length === 0 && !showAddWish && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-3">💝</span>
              <p className="text-sm text-lm-body/50">还没有愿望</p>
              <p className="text-xs text-lm-body/30 mt-1">点击"添加"创建第一个愿望</p>
            </div>
          )}
        </>
      )}

      {/* ===== CAPSULES TAB ===== */}
      {tab === 'capsules' && (
        <>
          {showAddCapsule && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={newCapsule.emoji}
                  onChange={e => setNewCapsule(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white border border-lm-line/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {CAPSULE_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  value={newCapsule.title}
                  onChange={e => setNewCapsule(d => ({ ...d, title: e.target.value }))}
                  placeholder="标题"
                  className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <textarea
                value={newCapsule.content}
                onChange={e => setNewCapsule(d => ({ ...d, content: e.target.value }))}
                placeholder="写给未来的信..."
                rows={4}
                className="w-full bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent resize-none"
              />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-lm-body/40">解锁日期：</span>
                <input
                  type="date"
                  value={newCapsule.unlockDate}
                  onChange={e => setNewCapsule(d => ({ ...d, unlockDate: e.target.value }))}
                  className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddCapsule(false)} className="px-3 py-1.5 text-xs text-lm-body/60">取消</button>
                <button onClick={() => withAuth(createCapsule)} className="px-4 py-1.5 text-xs rounded-lg bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium">封存</button>
              </div>
            </div>
          )}

          {capsules.length === 0 && !showAddCapsule ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl mb-3">💌</span>
              <p className="text-sm text-lm-body/50">还没有时光胶囊</p>
              <p className="text-xs text-lm-body/30 mt-1">点击"写信"给未来的ta写一封信</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 stagger">
              {capsules.map(capsule => {
                const daysLeft = getDaysLeft(capsule.unlockDate);
                const canOpen = !capsule.locked;
                const opened = openedIds.includes(capsule.id) || capsule.isOpened;
                return (
                  <div
                    key={capsule.id}
                    className={`lm-card rounded-2xl p-4 text-center space-y-2 ${canOpen ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
                    onClick={() => openCapsule(capsule)}
                  >
                    <span className="text-3xl">{capsule.emoji}</span>
                    <h3 className="text-sm font-bold text-lm-ink truncate" style={{ fontFamily: 'var(--lm-font-serif)' }}>{capsule.title}</h3>
                    {canOpen ? (
                      <p className="text-xs text-emerald-500 font-medium">{opened ? '已打开' : '可打开'}</p>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-lm-accent-deep" style={{ fontFamily: 'var(--lm-font-display)' }}>{daysLeft}</p>
                        <p className="text-[10px] text-lm-body/40">天后解锁</p>
                      </div>
                    )}
                    {!canOpen && (
                      <p className="text-[10px] text-lm-body/30">🔒 {capsule.unlockDate}</p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个时光胶囊吗？', onConfirm: () => deleteCapsule(capsule.id) }));
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-lm-body/20 hover:text-red-400 hover:bg-red-50 transition-colors mx-auto"
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
