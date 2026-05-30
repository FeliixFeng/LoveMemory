'use client';

import { useEffect, useState } from 'react';
import { AppData, LoveQuote, Countdown } from '../lib/types';
import { HERO_IMAGES } from '../lib/constants';
import { useAuth } from './SiteLayoutClient';
import { fmt } from '../lib/utils';

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

  if (!data) return <div className="flex items-center justify-center py-12"><span className="text-sm text-[#5c3d2a]/50">加载中...</span></div>;

  const visibleDefaults = HERO_IMAGES.filter(u => !(data.hiddenDefaultCovers || []).includes(u));
  const hasHidden = (data.hiddenDefaultCovers || []).length > 0;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#3d281c] text-amber-50 text-sm shadow-lg" style={{ animation: 'slideUp 0.3s ease-out' }}>{toast}</div>
      )}

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

      {/* Tabs */}
      <div className="flex gap-1">
        {([
          { key: 'date' as const, label: '纪念日', icon: '📅' },
          { key: 'cover' as const, label: '封面', icon: '🖼' },
          { key: 'quotes' as const, label: '语录', icon: '💬' },
          { key: 'countdowns' as const, label: '倒计时', icon: '⏰' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs rounded-lg transition-colors ${tab === t.key ? 'bg-[#aa6f4d]/10 text-[#aa6f4d] font-semibold' : 'text-[#5c3d2a]/40'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Date tab */}
      {tab === 'date' && (
        <div className="lm-card rounded-2xl p-4 space-y-3">
          <p className="text-xs text-[#5c3d2a]/40">设置你们在一起的起始日期</p>
          <p className="text-sm text-[#3d281c]">当前：{fmt(data.startDate)}</p>
          <input
            type="date"
            value={data.startDate}
            onChange={e => withAuth(() => void save({ ...data, startDate: e.target.value }, '已保存'))}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]"
          />
        </div>
      )}

      {/* Cover tab */}
      {tab === 'cover' && (
        <div className="space-y-4">
          {data.customCovers.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <p className="text-xs text-[#5c3d2a]/40">我的封面</p>
              <div className="grid grid-cols-3 gap-2">
                {data.customCovers.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-[4/3] group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认移除封面', message: '确定要移除这张封面吗？', onConfirm: () => void save({ ...data, customCovers: data.customCovers.filter(c => c !== url) }, '已删除') }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
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
              className="w-full py-2.5 bg-white border border-dashed border-[#efd8c3] rounded-xl text-sm text-[#5c3d2a]/50 hover:border-[#d48b60] hover:text-[#d48b60] transition-colors"
            >+ 添加封面图片</button>
          </div>

          {visibleDefaults.length > 0 && (
            <div className="lm-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#5c3d2a]/40">默认封面</p>
                {hasHidden && (
                  <button onClick={() => withAuth(() => void save({ ...data, hiddenDefaultCovers: [] }, '已恢复默认'))} className="text-[10px] text-[#d48b60] hover:underline">恢复全部默认</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {visibleDefaults.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-[4/3] group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => withAuth(() => void save({ ...data, hiddenDefaultCovers: [...(data.hiddenDefaultCovers || []), url] }, '已隐藏'))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
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
        <div className="lm-card rounded-2xl p-4 space-y-3">
          <p className="text-xs text-[#5c3d2a]/40">管理首页展示的情话语录</p>
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
              className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
            />
            <button onClick={() => {
              if (!newQuote.trim()) return;
              withAuth(() => void save({ ...data, loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
              setNewQuote('');
            }} className="px-4 py-2 bg-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0">添加</button>
          </div>
          <div className="space-y-2">
            {data.loveQuotes.length === 0 ? (
              <p className="text-center text-xs text-[#5c3d2a]/30 py-4">暂无语录</p>
            ) : data.loveQuotes.map(q => (
              <div key={q.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#efd8c3]/30">
                <span className="flex-1 text-sm text-[#3d281c]">{q.content}</span>
                <button onClick={() => withAuth(() => setConfirm({ title: '确认删除语录', message: '确定要删除这条语录吗？', onConfirm: () => void save({ ...data, loveQuotes: data.loveQuotes.filter(x => x.id !== q.id) }, '已删除') }))} className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/50 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countdowns tab */}
      {tab === 'countdowns' && (
        <div className="lm-card rounded-2xl p-4 space-y-3">
          <p className="text-xs text-[#5c3d2a]/40">管理倒计时，轮播显示在首页</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={newCountdown.emoji}
                onChange={e => setNewCountdown(d => ({ ...d, emoji: e.target.value }))}
                className="bg-white border border-[#efd8c3]/60 rounded-xl px-2 py-2 text-sm outline-none focus:border-[#d48b60]"
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
                className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newCountdown.date}
                onChange={e => setNewCountdown(d => ({ ...d, date: e.target.value }))}
                className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
              />
              <button
                onClick={() => {
                  if (!newCountdown.label || !newCountdown.date) return;
                  withAuth(() => void save({ ...data, countdowns: [...(data.countdowns || []), { ...newCountdown, id: Date.now() }] }, '已添加'));
                  setNewCountdown({ label: '', date: '', emoji: '🎂' });
                }}
                className="px-4 py-2 bg-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0"
              >添加</button>
            </div>
          </div>
          <div className="space-y-2">
            {(data.countdowns || []).length === 0 ? (
              <p className="text-center text-xs text-[#5c3d2a]/30 py-4">暂无倒计时</p>
            ) : (data.countdowns || []).map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#efd8c3]/30">
                <span className="text-sm">{c.emoji}</span>
                <span className="flex-1 text-sm text-[#3d281c]">{c.label}</span>
                <span className="text-xs text-[#5c3d2a]/40">{c.date}</span>
                <button onClick={() => withAuth(() => setConfirm({ title: '确认删除倒计时', message: '确定要删除这个倒计时吗？', onConfirm: () => void save({ ...data, countdowns: (data.countdowns || []).filter(x => x.id !== c.id) }, '已删除') }))} className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/50 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
