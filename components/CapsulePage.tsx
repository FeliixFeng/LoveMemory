'use client';

import { useEffect, useState, useMemo } from 'react';
import { Capsule } from '../lib/types';
import { useAuth } from './SiteLayoutClient';
import { SkeletonCard } from './SkeletonCard';

const EMOJI_OPTIONS = ['💌', '💝', '🎁', '🌸', '💌', '💕', '🌹', '✨'];

export function CapsulePage() {
  const { token, withAuth } = useAuth();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ title: '', content: '', emoji: '💌', unlockDate: '' });
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch('/api/capsules').then(r => r.json()).then(d => {
      setCapsules(Array.isArray(d) ? d : []);
    }).finally(() => setLoading(false));
  }, []);

  async function createCapsule() {
    if (!newCapsule.title.trim() || !newCapsule.unlockDate) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch('/api/capsules', { method: 'POST', headers, body: JSON.stringify(newCapsule) });
    if (r.ok) {
      const { capsule } = await r.json();
      setCapsules(prev => [capsule, ...prev]);
      setNewCapsule({ title: '', content: '', emoji: '💌', unlockDate: '' });
      setShowAdd(false);
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
      setOpenId(capsule.id);
    }
  }

  async function deleteCapsule(id: number) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`/api/capsules/${id}`, { method: 'DELETE', headers });
    if (r.ok) {
      setCapsules(prev => prev.filter(c => c.id !== id));
    }
  }

  function getDaysLeft(unlockDate: string): number {
    const now = new Date();
    const target = new Date(`${unlockDate}T00:00:00`);
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
  }

  if (loading) return <div className="grid grid-cols-2 gap-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className="space-y-4">
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

      {/* View capsule content */}
      {openId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenId(null)} />
          <div className="relative w-full sm:max-w-md bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-6" style={{ animation: 'slideUp 0.3s ease-out' }}>
            {(() => {
              const c = capsules.find(x => x.id === openId);
              if (!c) return null;
              return (
                <div className="text-center space-y-4">
                  <span className="text-5xl">{c.emoji}</span>
                  <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{c.title}</h2>
                  <p className="text-sm text-[#5c3d2a]/80 whitespace-pre-wrap">{c.content}</p>
                  <button onClick={() => setOpenId(null)} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium">关闭</button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>⏰ 时光胶囊</h1>
        <button
          onClick={() => withAuth(() => setShowAdd(true))}
          className="px-3 py-1.5 bg-[#aa6f4d] text-white rounded-xl text-xs font-medium"
        >+ 写信</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="lm-card rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={newCapsule.emoji}
              onChange={e => setNewCapsule(d => ({ ...d, emoji: e.target.value }))}
              className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none"
            >
              {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
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
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#5c3d2a]/60">取消</button>
            <button onClick={() => withAuth(createCapsule)} className="px-4 py-1.5 text-xs rounded-lg bg-[#3d281c] text-amber-50">封存</button>
          </div>
        </div>
      )}

      {/* Capsule list */}
      {capsules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-3">💌</span>
          <p className="text-sm text-[#5c3d2a]/50">还没有时光胶囊</p>
          <p className="text-xs text-[#5c3d2a]/30 mt-1">点击"写信"给未来的ta写一封信</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
