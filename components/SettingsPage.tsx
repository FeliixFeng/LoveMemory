'use client';

import { useState } from 'react';
import type { SettingsPatch } from '../app/lib/schemas';
import { HERO_SLIDES, type HeroSlide } from '../lib/constants';
import { useAuth } from './SiteLayoutClient';
import { useAppData } from '../hooks/useAppData';
import { fmt } from '../lib/utils';
import { Toast } from './Toast';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { SafeImage } from './SafeImage';
import { PageHeader } from './PageHeader';

const TABS = [
  { key: 'date' as const, label: '纪念日' },
  { key: 'cover' as const, label: '封面' },
  { key: 'quotes' as const, label: '语录' },
  { key: 'countdowns' as const, label: '倒计时' },
];

export function SettingsPage() {
  const { token, withAuth } = useAuth();
  const { data, loading, toast, setToast, saveSettings, loadData } = useAppData();
  const [tab, setTab] = useState<'date' | 'cover' | 'quotes' | 'countdowns'>('date');
  const [newQuote, setNewQuote] = useState('');
  const [newCountdown, setNewCountdown] = useState({ label: '', date: '', emoji: '🎂' });
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  async function save(patch: SettingsPatch, msg?: string) {
    try {
      await saveSettings(patch, msg);
    } catch {
      loadData();
      setToast('保存失败');
    }
  }

  if (loading) return <div className="space-y-4"><div className="h-10 bg-lm-line/20 rounded-xl animate-pulse" /><div className="h-40 bg-lm-line/20 rounded-2xl animate-pulse" /></div>;

  const visibleDefaults: HeroSlide[] = HERO_SLIDES.filter(s => !(data.hiddenDefaultCovers || []).includes(s.web) && !(data.hiddenDefaultCovers || []).includes(s.mobile));
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
      <PageHeader label="SETTINGS" title="设置" />

      {/* Tabs —— 选中态与导航玻璃胶囊同一语言，不用重渐变块 */}
      <div className="flex gap-1.5 p-1 lm-card rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs rounded-xl transition-all ${tab === t.key ? 'lm-glass-pill text-lm-accent-deep font-semibold' : 'text-lm-body/40 hover:text-lm-body/60 hover:bg-lm-line/20'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date tab —— 桌面端两张卡并排吃满容器宽度 */}
      {tab === 'date' && (
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          <div className="lm-card rounded-2xl p-5 space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold text-lm-ink font-serif-cn">我们的名字</h2>
              <span className="text-[10px] text-lm-body/40">显示在导航栏，留空显示 OUR STORY</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['第一位', '第二位'].map((label, i) => (
                <input
                  key={i}
                  type="text"
                  value={data.coupleNames[i] || ''}
                  onChange={e => {
                    const next = [...(data.coupleNames || [])];
                    next[i] = e.target.value;
                    withAuth(() => void save({ coupleNames: next.filter(Boolean) }));
                  }}
                  placeholder={label}
                  maxLength={20}
                  className="bg-white border border-lm-line/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-lm-accent transition-colors"
                />
              ))}
            </div>
          </div>

          <div className="lm-card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-lm-ink font-serif-cn">在一起的日子</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-lm-body/50 font-display">Since</span>
              <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80" />
              <span className="text-base font-bold text-lm-ink font-serif-cn">{fmt(data.startDate)}</span>
            </div>
            <input
              type="date"
              value={data.startDate}
              onChange={e => withAuth(() => void save({ startDate: e.target.value }, '已保存'))}
              className="w-full bg-white border border-lm-line/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-lm-accent transition-colors"
            />
          </div>
        </div>
      )}

      {/* Cover tab */}
      {tab === 'cover' && (
        <div className="space-y-4">
          {data.customCovers.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-lm-body/60">我的封面</p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {data.customCovers.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm">
                    <SafeImage src={url} alt="" fill sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认移除封面', message: '确定要移除这张封面吗？', onConfirm: () => void save({ customCovers: data.customCovers.filter(c => c !== url) }, '已删除') }))}
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
                    void save({ customCovers: [...data.customCovers, url] }, '封面已添加');
                  }
                };
                input.click();
              })}
              className="w-full py-3 bg-white border-2 border-dashed border-lm-line rounded-xl text-sm text-lm-body/40 hover:border-lm-accent hover:text-lm-accent transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              <span>添加封面图片</span>
            </button>
          </div>

          {visibleDefaults.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-lm-body/60">默认封面</p>
                </div>
                {hasHidden && (
                  <button onClick={() => withAuth(() => void save({ hiddenDefaultCovers: [] }, '已恢复默认'))} className="text-[10px] text-lm-accent hover:underline">恢复全部默认</button>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {visibleDefaults.map((slide, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group shadow-sm">
                    <SafeImage src={slide.web} alt="" fill sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />
                    <button
                      onClick={() => withAuth(() => void save({ hiddenDefaultCovers: [...(data.hiddenDefaultCovers || []), slide.web] }, '已隐藏'))}
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
            <p className="text-xs font-medium text-lm-body/60">添加新语录</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuote}
                onChange={e => setNewQuote(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newQuote.trim()) {
                    withAuth(() => void save({ loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
                    setNewQuote('');
                  }
                }}
                placeholder="输入一句情话..."
                className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent transition-colors"
              />
              <button onClick={() => {
                if (!newQuote.trim()) return;
                withAuth(() => void save({ loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
                setNewQuote('');
              }} className="px-4 py-2 bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white rounded-xl text-sm font-medium shrink-0 active:scale-95 transition-transform">添加</button>
            </div>
          </div>

          {data.loveQuotes.length === 0 ? (
            <div className="lm-card rounded-2xl p-8 text-center">
              <p className="text-xs text-lm-body/30">暂无语录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.loveQuotes.map((q, i) => (
                <div key={q.id} className="lm-card rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-lm-line/30 flex items-center justify-center text-[10px] text-lm-body/30 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>{q.content}</span>
                  <button onClick={() => withAuth(() => setConfirm({ title: '确认删除语录', message: '确定要删除这条语录吗？', onConfirm: () => void save({ loveQuotes: data.loveQuotes.filter(x => x.id !== q.id) }, '已删除') }))} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/20 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
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
            <p className="text-xs font-medium text-lm-body/60">添加倒计时</p>
            <div className="flex gap-2">
              <select
                value={newCountdown.emoji}
                onChange={e => setNewCountdown(d => ({ ...d, emoji: e.target.value }))}
                className="bg-white border border-lm-line/60 rounded-xl px-2 py-2 text-sm outline-none focus:border-lm-accent transition-colors"
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
                className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newCountdown.date}
                onChange={e => setNewCountdown(d => ({ ...d, date: e.target.value }))}
                className="flex-1 bg-white border border-lm-line/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent transition-colors"
              />
              <button
                onClick={() => {
                  if (!newCountdown.label || !newCountdown.date) return;
                  withAuth(() => void save({ countdowns: [...(data.countdowns || []), { ...newCountdown, id: Date.now() }] }, '已添加'));
                  setNewCountdown({ label: '', date: '', emoji: '🎂' });
                }}
                className="px-4 py-2 bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white rounded-xl text-sm font-medium shrink-0 active:scale-95 transition-transform"
              >添加</button>
            </div>
          </div>

          {(data.countdowns || []).length === 0 ? (
            <div className="lm-card rounded-2xl p-8 text-center">
              <p className="text-xs text-lm-body/30">暂无倒计时</p>
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lm-blush to-lm-accent flex items-center justify-center text-lg shrink-0">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-lm-ink truncate">{c.label}</p>
                      <p className="text-[10px] text-lm-body/40">{c.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-lm-accent" style={{ fontFamily: 'var(--lm-font-display)' }}>{daysLeft}</p>
                      <p className="text-[9px] text-lm-body/40">天后</p>
                    </div>
                    <button onClick={() => withAuth(() => setConfirm({ title: '确认删除倒计时', message: '确定要删除这个倒计时吗？', onConfirm: () => void save({ countdowns: (data.countdowns || []).filter(x => x.id !== c.id) }, '已删除') }))} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/20 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
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
