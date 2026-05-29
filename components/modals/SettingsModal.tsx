'use client';

import { useState } from 'react';
import { LoveQuote, Countdown } from '../../lib/types';
import { fmt } from '../../lib/utils';

export function SettingsModal({
  startDate, customCovers, defaultCovers, hiddenDefaults, quotes, countdowns,
  onSaveDate, onAddCover, onRemoveCover, onHideDefault, onRestoreDefaults,
  onAddQuote, onDeleteQuote, onAddCountdown, onDeleteCountdown,
  onClose
}: {
  startDate: string;
  customCovers: string[];
  defaultCovers: string[];
  hiddenDefaults: string[];
  quotes: LoveQuote[];
  countdowns: Countdown[];
  onSaveDate: (date: string) => void;
  onAddCover: () => void;
  onRemoveCover: (url: string) => void;
  onHideDefault: (url: string) => void;
  onRestoreDefaults: () => void;
  onAddQuote: (content: string) => void;
  onDeleteQuote: (id: number) => void;
  onAddCountdown: (data: { label: string; date: string; emoji: string }) => void;
  onDeleteCountdown: (id: number) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'date' | 'cover' | 'quotes' | 'countdowns'>('date');
  const [newQuote, setNewQuote] = useState('');
  const [newCountdown, setNewCountdown] = useState({ label: '', date: '', emoji: '🎂' });

  const visibleDefaults = defaultCovers.filter(u => !hiddenDefaults.includes(u));
  const hasHidden = hiddenDefaults.length > 0;

  function handleAddQuote() {
    const content = newQuote.trim();
    if (!content) return;
    onAddQuote(content);
    setNewQuote('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mt-4 mb-3" />

        {/* Tabs */}
        <div className="flex px-5 gap-1">
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

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* Date tab */}
          {tab === 'date' && (
            <div>
              <p className="text-xs text-[#5c3d2a]/40 mb-1">设置你们在一起的起始日期</p>
              <p className="text-sm text-[#3d281c] mb-3">当前：{fmt(startDate)}</p>
              <input
                type="date"
                value={startDate}
                onChange={e => onSaveDate(e.target.value)}
                className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]"
              />
            </div>
          )}

          {/* Cover tab */}
          {tab === 'cover' && (
            <div className="space-y-4">
              {/* Custom covers */}
              {customCovers.length > 0 && (
                <div>
                  <p className="text-xs text-[#5c3d2a]/40 mb-2">我的封面</p>
                  <div className="grid grid-cols-3 gap-2">
                    {customCovers.map((url, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden aspect-[4/3] group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => onRemoveCover(url)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload */}
              <div>
                <button
                  onClick={onAddCover}
                  className="w-full py-2.5 bg-white border border-dashed border-[#efd8c3] rounded-xl text-sm text-[#5c3d2a]/50 hover:border-[#d48b60] hover:text-[#d48b60] transition-colors"
                >
                  + 添加封面图片
                </button>
              </div>

              {/* Default covers */}
              {visibleDefaults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#5c3d2a]/40">默认封面</p>
                    {hasHidden && (
                      <button onClick={onRestoreDefaults} className="text-[10px] text-[#d48b60] hover:underline">
                        恢复全部默认
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleDefaults.map((url, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden aspect-[4/3] group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => onHideDefault(url)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quotes tab */}
          {tab === 'quotes' && (
            <div>
              <p className="text-xs text-[#5c3d2a]/40 mb-3">管理首页展示的情话语录</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newQuote}
                  onChange={e => setNewQuote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddQuote()}
                  placeholder="输入一句情话..."
                  className="flex-1 bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#d48b60]"
                />
                <button onClick={handleAddQuote} className="px-4 py-2 bg-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0">添加</button>
              </div>
              <div className="space-y-2">
                {quotes.length === 0 ? (
                  <p className="text-center text-xs text-[#5c3d2a]/30 py-4">暂无语录</p>
                ) : quotes.map(q => (
                  <div key={q.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#efd8c3]/30">
                    <span className="flex-1 text-sm text-[#3d281c]">{q.content}</span>
                    <button onClick={() => onDeleteQuote(q.id)} className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/50 md:text-[#5c3d2a]/30 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Countdowns tab */}
          {tab === 'countdowns' && (
            <div>
              <p className="text-xs text-[#5c3d2a]/40 mb-3">管理倒计时，轮播显示在首页</p>
              <div className="space-y-2 mb-3">
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
                      onAddCountdown(newCountdown);
                      setNewCountdown({ label: '', date: '', emoji: '🎂' });
                    }}
                    className="px-4 py-2 bg-[#aa6f4d] text-white rounded-xl text-sm font-medium shrink-0"
                  >添加</button>
                </div>
              </div>
              <div className="space-y-2">
                {countdowns.length === 0 ? (
                  <p className="text-center text-xs text-[#5c3d2a]/30 py-4">暂无倒计时</p>
                ) : countdowns.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#efd8c3]/30">
                    <span className="text-sm">{c.emoji}</span>
                    <span className="flex-1 text-sm text-[#3d281c]">{c.label}</span>
                    <span className="text-xs text-[#5c3d2a]/40">{c.date}</span>
                    <button onClick={() => onDeleteCountdown(c.id)} className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs text-[#5c3d2a]/50 md:text-[#5c3d2a]/30 hover:text-red-400 hover:bg-red-50 transition-colors">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <button onClick={onClose} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">完成</button>
        </div>
      </div>
    </div>
  );
}
