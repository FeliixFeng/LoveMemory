'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Wish, Capsule, Event } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { useAppData } from '../hooks/useAppData';
import { apiFetch } from '../app/lib/api-client';
import { computeAchievements, type AchievementCategory } from '../lib/achievements';
import { fmt } from '../lib/utils';
import { FallingHearts } from './FallingHearts';
import { SkeletonCard } from './SkeletonCard';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { Overlay } from './ui/Overlay';

const WISH_EMOJI_OPTIONS = ['💝', '🌸', '✈️', '🎬', '🍽️', '🏔️', '🎵', '📚', '🎁', '💍'];
const CAPSULE_EMOJI_OPTIONS = ['💌', '💝', '🎁', '🌸', '💕', '🌹', '✨', '🎂'];

type Tab = 'achievements' | 'wishes' | 'capsules';

const CATEGORY_META: { key: AchievementCategory; label: string; eyebrow: string }[] = [
  { key: 'time', label: '时光印记', eyebrow: 'TIME' },
  { key: 'footprint', label: '山河足迹', eyebrow: 'FOOTPRINT' },
  { key: 'memory', label: '生活定格', eyebrow: 'MEMORY' },
];

export function WishesCapsulesPage() {
  const { withAuth, pendingOp, setShowPin } = useAuth();
  const { data, setData, mutate, loading, days } = useAppData();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(pathname === '/capsule' ? 'capsules' : 'achievements');

  useEffect(() => {
    if (pathname === '/capsule') setTab('capsules');
  }, [pathname]);

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

  const achievements = useMemo(() => computeAchievements(data, days), [data, days]);
  const unlockedCount = useMemo(() => achievements.filter(a => a.unlocked).length, [achievements]);
  const unlockPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  const onAuthRequired = (op: () => void | Promise<void>) => {
    pendingOp.current = op;
    setShowPin(true);
  };

  const hasMemory = (wishId?: number, capsuleId?: number) =>
    data.events.some(e => (wishId != null && e.wishId === wishId) || (capsuleId != null && e.capsuleId === capsuleId));

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
    await mutate(
      prev => ({
        ...prev,
        wishes: prev.wishes.map(w => (w.id === wish.id ? { ...w, isCompleted: next, completedAt } : w))
      }),
      () => apiFetch(`/api/wishes/${wish.id}`, { method: 'PUT', body: { isCompleted: next, completedAt } }),
      { errorMsg: '更新失败', onAuthRequired }
    );
    if (next) {
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
    if (!unlockDate) return 0;
    const now = new Date();
    const target = new Date(`${unlockDate}T00:00:00`);
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  }

  if (loading) return <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  const pendingWishes = wishes.filter(w => !w.isCompleted);
  const completedWishes = wishes.filter(w => w.isCompleted);
  const activeCapsule = openCapsuleId !== null ? capsules.find(x => x.id === openCapsuleId) : null;

  const headerEyebrow = tab === 'achievements' ? 'MILESTONES' : tab === 'wishes' ? 'WISHES' : 'CAPSULES';

  return (
    <div className="space-y-4">
      {showHearts && <FallingHearts />}

      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
      )}

      {/* 信笺阅读浮层（规范走 Overlay 组件） */}
      {activeCapsule && (
        <Overlay
          onClose={() => setOpenCapsuleId(null)}
          layer="modal"
          panelClassName="w-full sm:max-w-md bg-lm-bg rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] sm:pb-6 sm:shadow-2xl border border-white/80"
        >
          <div className="w-10 h-1 bg-lm-line rounded-full mx-auto mb-5 sm:hidden" />
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <span className="inline-flex w-14 h-14 rounded-full bg-gradient-to-br from-lm-blush/50 to-lm-accent/25 border border-lm-accent/30 items-center justify-center text-3xl shadow-xs">
                {activeCapsule.emoji}
              </span>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span aria-hidden className="w-4 h-px bg-lm-accent/50" />
                <span className="text-[9.5px] tracking-[0.28em] uppercase text-lm-accent font-display">
                  TIME LETTER · {activeCapsule.unlockDate}
                </span>
                <span aria-hidden className="w-4 h-px bg-lm-accent/50" />
              </div>
              <h2 className="text-xl font-bold text-lm-ink font-serif-cn">{activeCapsule.title}</h2>
            </div>

            <div className="relative pl-4 py-2 bg-white/55 rounded-2xl p-4 border border-lm-line/50">
              <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-lm-accent/70 via-lm-accent/30 to-transparent" />
              <p className="text-sm leading-relaxed text-lm-body/90 whitespace-pre-wrap font-serif-cn">
                {activeCapsule.content || '（信纸空白）'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {!hasMemory(undefined, activeCapsule.id) && (
                <button
                  onClick={() => withAuth(() => createMemoryFrom({ title: activeCapsule.title, desc: activeCapsule.content, capsuleId: activeCapsule.id }))}
                  className="w-full py-2.5 rounded-full lm-glass-chip text-lm-accent-deep text-xs font-medium active:scale-[0.98] transition-transform"
                >
                  把这封信记成回忆 →
                </button>
              )}
              <button
                onClick={() => setOpenCapsuleId(null)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white text-xs font-medium shadow-sm active:scale-[0.98] transition-transform"
              >
                折好收起
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* 顶栏一体化：左侧标题，右侧三段磨砂玻璃切换胶囊（与相册/足迹保持一致） */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="w-4 h-px bg-lm-accent/70 shrink-0" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-lm-accent font-display shrink-0">{headerEyebrow}</span>
          <h1 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn shrink-0">纪念</h1>
        </div>

        <div className="flex items-center p-0.5 bg-white/70 backdrop-blur-md rounded-full border border-lm-border/70 shadow-2xs shrink-0">
          {[
            { key: 'achievements' as const, label: '勋章' },
            { key: 'wishes' as const, label: '心愿' },
            { key: 'capsules' as const, label: '胶囊' },
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-300 font-medium whitespace-nowrap ${
                tab === item.key
                  ? 'lm-glass-pill text-lm-accent-deep font-semibold shadow-xs'
                  : 'text-lm-body/50 hover:text-lm-body/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB 1: 恋爱成就勋章（默认高亮展示） ===== */}
      {tab === 'achievements' && (
        <div className="space-y-4">
          {/* 汇总仪式卡 */}
          <div className="lm-glass-panel rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[9.5px] tracking-[0.28em] uppercase text-lm-accent font-display">
                  OUR MILESTONES
                </span>
                <h2 className="text-lg font-bold text-lm-ink font-serif-cn mt-0.5">
                  已点亮 {unlockedCount} / {achievements.length} 枚恋爱勋章
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-lm-accent-deep font-display tabular-nums">
                  {unlockPercent}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-lm-line/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lm-blush via-lm-accent to-lm-accent-deep transition-all duration-700"
                style={{ width: `${Math.max(4, unlockPercent)}%` }}
              />
            </div>
          </div>

          {/* 分类勋章网格 */}
          {CATEGORY_META.map(cat => {
            const list = achievements.filter(a => a.category === cat.key);
            return (
              <div key={cat.key} className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span aria-hidden className="w-3 h-px bg-lm-accent/60" />
                  <span className="text-[9.5px] tracking-[0.25em] uppercase text-lm-accent font-display">{cat.eyebrow}</span>
                  <h3 className="text-xs font-bold text-lm-ink font-serif-cn">{cat.label}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {list.map(badge => (
                    <div
                      key={badge.id}
                      className={`rounded-2xl p-3.5 transition-all relative overflow-hidden ${
                        badge.unlocked
                          ? 'lm-glass-panel border border-lm-accent/35 shadow-xs'
                          : 'bg-white/45 border border-dashed border-lm-line/70 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                            badge.unlocked
                              ? 'bg-gradient-to-br from-lm-blush/60 to-lm-accent/25 border border-lm-accent/35 shadow-2xs'
                              : 'bg-lm-line/25 grayscale opacity-60'
                          }`}
                        >
                          {badge.symbol}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium ${
                            badge.unlocked
                              ? 'bg-lm-accent/15 text-lm-accent-deep'
                              : 'bg-lm-line/30 text-lm-body/50'
                          }`}
                        >
                          {badge.progressText}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h4 className={`text-sm font-bold font-serif-cn ${badge.unlocked ? 'text-lm-ink' : 'text-lm-body/70'}`}>
                          {badge.title}
                        </h4>
                        <p className="text-[11px] text-lm-body/55 mt-0.5 leading-snug">{badge.subtitle}</p>
                      </div>

                      {!badge.unlocked && (
                        <div className="mt-2.5 h-1 rounded-full bg-lm-line/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-lm-accent/55"
                            style={{ width: `${Math.max(4, badge.progress)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TAB 2: 共同心愿（印章手账风，告别删除线） ===== */}
      {tab === 'wishes' && (
        <div className="space-y-4">
          {/* 顶部进度与添加入口 */}
          <div className="lm-glass-panel rounded-3xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[9.5px] tracking-[0.25em] uppercase text-lm-accent font-display">BUCKET LIST</span>
              <p className="text-sm font-bold text-lm-ink font-serif-cn mt-0.5">
                {wishes.length > 0
                  ? `已实现 ${completedWishes.length} / ${wishes.length} 个共同心愿`
                  : '记录你们想一起完成的小事'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => withAuth(() => setShowAddWish(s => !s))}
              className="lm-glass-chip px-3.5 py-1.5 rounded-full text-xs font-medium text-lm-accent-deep shrink-0 active:scale-95 transition-all"
            >
              {showAddWish ? '收起' : '+ 许个愿'}
            </button>
          </div>

          {showAddWish && (
            <div className="lm-card rounded-3xl p-4 space-y-3 border border-lm-border/60">
              <div className="flex gap-2">
                <select
                  value={newWish.emoji}
                  onChange={e => setNewWish(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white/80 border border-lm-line/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {WISH_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  value={newWish.title}
                  onChange={e => setNewWish(d => ({ ...d, title: e.target.value }))}
                  placeholder="想一起做的事…"
                  className="flex-1 bg-white/80 border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <input
                type="text"
                value={newWish.description}
                onChange={e => setNewWish(d => ({ ...d, description: e.target.value }))}
                placeholder="补充一点小细节（可选）"
                className="w-full bg-white/80 border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddWish(false)} className="px-3 py-1.5 text-xs text-lm-body/60">取消</button>
                <button onClick={() => withAuth(createWish)} className="px-4 py-1.5 text-xs rounded-full bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium">保存心愿</button>
              </div>
            </div>
          )}

          {pendingWishes.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs text-lm-body/50 font-medium px-1">等待一起去实现</h2>
              <div className="space-y-2.5">
                {pendingWishes.map(wish => (
                  <div key={wish.id} className="lm-card rounded-3xl p-4 flex items-center gap-3.5 border border-lm-border/50">
                    <button
                      onClick={() => withAuth(() => toggleWish(wish))}
                      title="点击标记已实现"
                      className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lm-blush/50 to-lm-accent/25 border border-lm-accent/30 flex items-center justify-center text-lg shrink-0 shadow-2xs active:scale-95 transition-transform"
                    >
                      {wish.emoji}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-lm-ink font-serif-cn">{wish.title}</h3>
                      {wish.description && <p className="text-[11px] text-lm-body/55 mt-0.5 truncate">{wish.description}</p>}
                    </div>
                    <button
                      onClick={() => withAuth(() => toggleWish(wish))}
                      className="lm-glass-chip px-2.5 py-1 rounded-full text-[10.5px] text-lm-accent-deep font-medium shrink-0 active:scale-95 transition-all"
                    >
                      点亮
                    </button>
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/25 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedWishes.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs text-lm-body/50 font-medium px-1">已实现的美好</h2>
              <div className="space-y-2.5">
                {completedWishes.map(wish => (
                  <div key={wish.id} className="lm-glass-panel rounded-3xl p-4 relative overflow-hidden">
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => withAuth(() => toggleWish(wish))}
                        title="点击撤销完成"
                        className="w-11 h-11 rounded-2xl bg-lm-accent/15 border border-lm-accent/35 flex items-center justify-center text-lg shrink-0 active:scale-95 transition-transform"
                      >
                        {wish.emoji}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-lm-ink font-serif-cn truncate">{wish.title}</h3>
                          <span className="shrink-0 px-2 py-0.5 rounded-full border border-lm-accent/50 text-lm-accent-deep text-[9.5px] font-medium -rotate-2">
                            已实现
                          </span>
                        </div>
                        <p className="text-[11px] text-lm-body/55 mt-0.5 truncate">
                          {wish.completedAt ? `${fmt(wish.completedAt.slice(0, 10))} 达成` : '共同达成'}
                          {wish.description ? ` · ${wish.description}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这个愿望吗？', onConfirm: () => deleteWish(wish.id) }))}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/25 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    {!hasMemory(wish.id) && (
                      <button
                        onClick={() => withAuth(() => createMemoryFrom({ title: wish.title, desc: wish.description, wishId: wish.id }))}
                        className="mt-3 w-full py-2 rounded-full lm-glass-chip text-lm-accent-deep text-[11px] font-medium active:scale-[0.99] transition-transform"
                      >
                        落笔记成一段回忆 →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {wishes.length === 0 && !showAddWish && (
            <div className="lm-card rounded-3xl flex flex-col items-center justify-center py-16">
              <span aria-hidden className="w-8 h-px mb-3 block bg-lm-accent/40" />
              <p className="text-sm text-lm-body/55 font-serif-cn">还没有写下愿望</p>
              <p className="text-xs text-lm-body/35 mt-1">点击右上角「+ 许个愿」记下想一起做的事</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: 慢递胶囊（火漆情书信封风） ===== */}
      {tab === 'capsules' && (
        <div className="space-y-4">
          <div className="lm-glass-panel rounded-3xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[9.5px] tracking-[0.25em] uppercase text-lm-accent font-display">SLOW MAIL</span>
              <p className="text-sm font-bold text-lm-ink font-serif-cn mt-0.5">
                {capsules.length > 0 ? `共封存 ${capsules.length} 封时间情书` : '写一封寄往未来的信'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => withAuth(() => setShowAddCapsule(s => !s))}
              className="lm-glass-chip px-3.5 py-1.5 rounded-full text-xs font-medium text-lm-accent-deep shrink-0 active:scale-95 transition-all"
            >
              {showAddCapsule ? '收起' : '+ 写封信'}
            </button>
          </div>

          {showAddCapsule && (
            <div className="lm-card rounded-3xl p-4 space-y-3 border border-lm-border/60">
              <div className="flex gap-2">
                <select
                  value={newCapsule.emoji}
                  onChange={e => setNewCapsule(d => ({ ...d, emoji: e.target.value }))}
                  className="bg-white/80 border border-lm-line/60 rounded-xl px-2 py-2 text-sm outline-none"
                >
                  {CAPSULE_EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input
                  type="text"
                  value={newCapsule.title}
                  onChange={e => setNewCapsule(d => ({ ...d, title: e.target.value }))}
                  placeholder="信封标题"
                  className="flex-1 bg-white/80 border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <textarea
                value={newCapsule.content}
                onChange={e => setNewCapsule(d => ({ ...d, content: e.target.value }))}
                placeholder="写给未来某一天的你们…"
                rows={4}
                className="w-full bg-white/80 border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent resize-none"
              />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-lm-body/55 shrink-0">启封日期</span>
                <input
                  type="date"
                  value={newCapsule.unlockDate}
                  onChange={e => setNewCapsule(d => ({ ...d, unlockDate: e.target.value }))}
                  className="flex-1 bg-white/80 border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddCapsule(false)} className="px-3 py-1.5 text-xs text-lm-body/60">取消</button>
                <button onClick={() => withAuth(createCapsule)} className="px-4 py-1.5 text-xs rounded-full bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium">火漆封存</button>
              </div>
            </div>
          )}

          {capsules.length === 0 && !showAddCapsule ? (
            <div className="lm-card rounded-3xl flex flex-col items-center justify-center py-16">
              <span aria-hidden className="w-8 h-px mb-3 block bg-lm-accent/40" />
              <p className="text-sm text-lm-body/55 font-serif-cn">还没有时间情书</p>
              <p className="text-xs text-lm-body/35 mt-1">点击右上角「+ 写封信」寄给未来的对方</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capsules.map(capsule => {
                const daysLeft = getDaysLeft(capsule.unlockDate);
                const canOpen = !capsule.locked;
                const opened = openedIds.includes(capsule.id) || capsule.isOpened;

                return (
                  <div
                    key={capsule.id}
                    onClick={() => openCapsule(capsule)}
                    className={`lm-glass-panel rounded-3xl p-5 relative overflow-hidden transition-all ${
                      canOpen ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
                    }`}
                  >
                    {/* 右上角邮戳与删除 */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9.5px] tracking-[0.22em] uppercase text-lm-body/45 font-display">
                        {canOpen ? 'READY TO OPEN' : `UNLOCK · ${capsule.unlockDate}`}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          withAuth(() => setConfirm({ title: '确认删除', message: '确定要删除这封时光信件吗？', onConfirm: () => deleteCapsule(capsule.id) }));
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-lm-body/25 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        ×
                      </button>
                    </div>

                    {/* 中央火漆封蜡印章 */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 border-2 shadow-sm ${
                          canOpen
                            ? 'bg-gradient-to-br from-lm-blush to-lm-accent/40 border-white text-lm-ink'
                            : 'bg-gradient-to-br from-lm-accent to-lm-accent-deep border-lm-blush/60 text-white'
                        }`}
                      >
                        {capsule.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-lm-ink font-serif-cn truncate">{capsule.title}</h3>
                        {canOpen ? (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 lm-glass-chip px-2.5 py-0.5 rounded-full text-[11px] font-medium text-lm-accent-deep">
                              {opened ? '再次展信阅读' : '点击拆封阅读 →'}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-lm-body/60 mt-1 tabular-nums">
                            火漆封存中 · 还有 <span className="font-bold text-lm-accent-deep font-display">{daysLeft}</span> 天
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
