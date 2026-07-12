'use client';

import { useEffect, useState } from 'react';
import { AppData } from '../lib/types';
import { HERO_IMAGES } from '../lib/constants';
import { useAuth } from './SiteLayoutClient';
import { fmt } from '../lib/utils';
import { Toast } from './Toast';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { SafeImage } from './SafeImage';

const TABS = [
  { key: 'date' as const, label: '纪念日', icon: '📅' },
  { key: 'cover' as const, label: '封面', icon: '🖼' },
  { key: 'quotes' as const, label: '语录', icon: '💬' },
  { key: 'countdowns' as const, label: '倒计时', icon: '⏰' },
];

export function SettingsPage() {
  const { token, withAuth } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<'date' | 'cover' | 'quotes' | 'countdowns'>('date');
  const [newQuote, setNewQuote] = useState('');
  const [newCountdown, setNewCountdown] = useState({ label: '', date: '', emoji: '🎂' });
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => {
      setData({ ...d, events: d.events || [], photos: d.photos || [], expenses: d.expenses || [], loveQuotes: d.loveQuotes || [], customCovers: d.customCovers || [], hiddenDefaultCovers: d.hiddenDefaultCovers || [], countdowns: d.countdowns || [] });
    }).catch(() => setToast('加载失败'));
  }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2000); return () => clearTimeout(t); }, [toast]);

  async function save(next: AppData, msg?: string) {
    if (!data) return;
    const prev = data;
    setData(next);
    if (msg) setToast(msg);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch('/api/data', { method: 'POST', headers, body: JSON.stringify(next) });
      if (!r.ok) throw new Error();
    } catch {
      setData(prev);
      setToast('保存失败');
    }
  }

  if (!data) return <div className="space-y-4"><div className="h-10 bg-[#efd8c3]/20 rounded-xl animate-pulse" /><div className="h-40 bg-[#efd8c3]/20 rounded-2xl animate-pulse" /></div>;

  const visibleDefaults = HERO_IMAGES.filter(u => !(data.hiddenDefaultCovers || []).includes(u));
  const hasHidden = (data.hiddenDefaultCovers || []).length > 0;

  return (
    <div className="space-y-4">
      <Toast message={toast} />

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">⚙️</span>
        <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>设置</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 lm-card rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === t.key ? 'bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white font-semibold shadow-sm' : 'text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60 hover:bg-[#efd8c3]/20'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Date tab */}
      {tab === 'date' && (
        <div className="lm-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📅</span>
            <h2 className="text-sm font-bold text-[#3d281c]">在一起的日子</h2>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100">
            <span className="text-2xl">💕</span>
            <div>
              <p className="text-xs text-[#5c3d2a]/50">起始日期</p>
              <p className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{fmt(data.startDate)}</p>
            </div>
          </div>
          <input
            type="date"
            value={data.startDate}
            onChange={e => withAuth(() => void save({ ...data, startDate: e.target.value }, '已保存'))}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
          />
        </div>
      )}

      {/* Cover tab */}
      {tab === 'cover' && (
        <div className="space-y-4">
          {data.customCovers.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🖼</span>
                <p className="text-xs font-medium text-[#5c3d2a]/60">我的封面</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {data.customCovers.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm">
                    <SafeImage src={url} alt="" fill sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认移除封面', message: '确定要移除这张封面吗？', onConfirm: () => void save({ ...data, customCovers: data.customCovers.filter(c => c !== url) }, '已删除') }))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="lm-card rounded-2xl p-4">
            <button
              onClick={() => withAuth(() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('image', file);
                  const headers: Record<string, string> = {};
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const r = await fetch('/api/upload', { method: 'POST', headers, body: fd });
                  if (r.ok) {
                    const d = await r.json();
                    const url = d.displayUrl || d.url;
                    void save({ ...data, customCovers: [...data.customCovers, url] }, '封面已添加');
                  }
                };
                input.click();
              })}
              className="w-full py-3 bg-white border-2 border-dashed border-[#efd8c3] rounded-xl text-sm text-[#5c3d2a]/40 hover:border-[#d48b60] hover:text-[#d48b60] transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              <span>添加封面图片</span>
            </button>
          </div>

          {visibleDefaults.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <p className="text-xs font-medium text-[#5c3d2a]/60">默认封面</p>
                </div>
                {hasHidden && (
                  <button onClick={() => withAuth(() => void save({ ...data, hiddenDefaultCovers: [] }, '已恢复默认'))} className="text-[10px] text-[#d48b60] hover:underline">恢复全部默认</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {visibleDefaults.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm">
                    <SafeImage src={url} alt="" fill sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />
                    <button
                      onClick={() => withAuth(() => void save({ ...data, hiddenDefaultCovers: [...(data.hiddenDefaultCovers || []), url] }, '已隐藏'))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quotes tab */}
      {tab === 'quotes' && (
        <div className="space-y-3">
          <div className="lm-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">💬</span>
              <p className="text-xs font-medium text-[#5c3d2a]/60">添加新语录</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuote}
                onChange={e => setNewQuote(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newQuote.trim()) {
                    withAuth(() => void save({ ...data, loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
                    setNewQuote('');
                  }
                }}
                placeholder="输入一句情话..."
                className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
              <button onClick={() => {
                if (!newQuote.trim()) return;
                withAuth(() => void save({ ...data, loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
                setNewQuote('');
              }} className="px-4 py-2 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0 active:scale-95 transition-transform">添加</button>
            </div>
          </div>

          {data.loveQuotes.length === 0 ? (
            <div className="lm-card rounded-2xl p-8 text-center">
              <span className="text-3xl mb-2 block">💬</span>
              <p className="text-xs text-[#5c3d2a]/30">暂无语录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.loveQuotes.map((q, i) => (
                <div key={q.id} className="lm-card rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#efd8c3]/30 flex items-center justify-center text-[10px] text-[#5c3d2a]/30 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{q.content}</span>
                  <button onClick={() => withAuth(() => setConfirm({ title: '确认删除语录', message: '确定要删除这条语录吗？', onConfirm: () => void save({ ...data, loveQuotes: data.loveQuotes.filter(x => x.id !== q.id) }, '已删除') }))} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Countdowns tab */}
      {tab === 'countdowns' && (
        <div className="space-y-3">
          <div className="lm-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⏰</span>
              <p className="text-xs font-medium text-[#5c3d2a]/60">添加倒计时</p>
            </div>
            <div className="flex gap-2">
              <select
                value={newCountdown.emoji}
                onChange={e => setNewCountdown(d => ({ ...d, emoji: e.target.value }))}
                className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none focus:border-[#d48b60] transition-colors"
              >
                <option value="🎂">🎂 生日</option>
                <option value="💝">💝 纪念日</option>
                <option value="🎄">🎄 节日</option>
                <option value="✈️">✈️ 旅行</option>
                <option value="🎉">🎉 其他</option>
              </select>
              <input
                type="text"
                value={newCountdown.label}
                onChange={e => setNewCountdown(d => ({ ...d, label: e.target.value }))}
                placeholder="名称"
                className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newCountdown.date}
                onChange={e => setNewCountdown(d => ({ ...d, date: e.target.value }))}
                className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
              <button
                onClick={() => {
                  if (!newCountdown.label || !newCountdown.date) return;
                  withAuth(() => void save({ ...data, countdowns: [...(data.countdowns || []), { ...newCountdown, id: Date.now() }] }, '已添加'));
                  setNewCountdown({ label: '', date: '', emoji: '🎂' });
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0 active:scale-95 transition-transform"
              >添加</button>
            </div>
          </div>

          {(data.countdowns || []).length === 0 ? (
            <div className="lm-card rounded-2xl p-8 text-center">
              <span className="text-3xl mb-2 block">⏰</span>
              <p className="text-xs text-[#5c3d2a]/30">暂无倒计时</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(data.countdowns || []).map(c => {
                const daysLeft = (() => {
                  const now = new Date();
                  const target = new Date(`${c.date}T00:00:00`);
                  let next = new Date(now.getFullYear(), target.getMonth(), target.getDate());
                  if (next.getTime() < now.getTime()) next.setFullYear(next.getFullYear() + 1);
                  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
                })();
                return (
                  <div key={c.id} className="lm-card rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0c8a8] to-[#d48b60] flex items-center justify-center text-lg shrink-0">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#3d281c] truncate">{c.label}</p>
                      <p className="text-[10px] text-[#5c3d2a]/40">{c.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#d48b60]" style={{ fontFamily: 'Playfair Display, serif' }}>{daysLeft}</p>
                      <p className="text-[9px] text-[#5c3d2a]/40">天后</p>
                    </div>
                    <button onClick={() => withAuth(() => setConfirm({ title: '确认删除倒计时', message: '确定要删除这个倒计时吗？', onConfirm: () => void save({ ...data, countdowns: (data.countdowns || []).filter(x => x.id !== c.id) }, '已删除') }))} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/20 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
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
