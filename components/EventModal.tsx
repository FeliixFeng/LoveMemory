'use client';

import { useEffect, useMemo, useState } from 'react';
import { Event } from '../lib/types';
import { ICONS, MOODS } from '../lib/constants';
import { ALL_CITIES, resolveCity, resolvePlace } from '../lib/place';
import { calcTripDays } from '../lib/utils';
import { Overlay } from './ui/Overlay';
import { PinIcon } from './NavIcons';
import { EventBadge } from './EventBadge';
import { SectionLabel } from './SectionLabel';

export type EventDraft = {
  title: string;
  date: string;
  endDate: string;
  desc: string;
  icon: string;
  location: string;
  city: string;
  mood: string;
};

export function EventModal({
  editEvent, draft, setDraft, homeCity = '', onSave, onDelete, onClose
}: {
  editEvent: Event | null;
  draft: EventDraft;
  setDraft: (fn: (d: EventDraft) => EventDraft) => void;
  homeCity?: string;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const resolvedCity = resolveCity(draft.city);
  const [iconOpen, setIconOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityManual, setCityManual] = useState(Boolean(editEvent));
  const [showEndDate, setShowEndDate] = useState(Boolean(draft.endDate));

  useEffect(() => {
    setCityManual(Boolean(editEvent));
    setShowEndDate(Boolean(editEvent?.endDate));
    setCityPickerOpen(false);
    setCityQuery('');
  }, [editEvent?.id]);

  const currentIcon = ICONS.find(i => i.id === draft.icon) || ICONS[0];
  const tripDays = calcTripDays(draft.date, draft.endDate);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return ALL_CITIES.slice(0, 24);
    return ALL_CITIES.filter(
      item => item.city.toLowerCase().includes(q) || item.province.toLowerCase().includes(q)
    ).slice(0, 32);
  }, [cityQuery]);

  function selectCity(cityName: string) {
    setCityManual(true);
    setDraft(d => ({ ...d, city: cityName }));
    setCityPickerOpen(false);
    setCityQuery('');
  }

  return (
    <Overlay
      onClose={onClose}
      layer="modal"
      panelClassName="w-full sm:max-w-lg bg-lm-bg rounded-t-2xl sm:rounded-2xl max-h-[88dvh] overflow-hidden flex flex-col sm:shadow-2xl"
    >
        <div className="w-10 h-1 bg-lm-line rounded-full mx-auto mt-4 shrink-0 sm:hidden" />

        {/* Header —— 编辑感页头（小标 + 衬线标题，右上关闭/删除） */}
        <div className="flex items-start justify-between px-5 pt-3.5 pb-3 shrink-0">
          <div>
            <span className="flex items-center gap-2">
              <span aria-hidden className="w-4 h-px bg-lm-accent/60" />
              <span className="text-[9px] tracking-[0.3em] uppercase text-lm-accent font-display">
                {editEvent ? 'EDIT MEMORY' : 'NEW MEMORY'}
              </span>
            </span>
            <h3 className="mt-1 text-[17px] font-bold text-lm-ink font-serif-cn">
              {editEvent ? '编辑事件' : '新事件'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {editEvent && (
              <button
                onClick={onDelete}
                className="px-2 py-1 text-[11px] text-red-500/80 hover:text-red-600 transition-colors"
              >
                删除
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="关闭"
              className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center text-lm-body/50 hover:text-lm-ink hover:bg-white/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content —— 滚动区 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* 卡片抬头：徽章 + 标题大输入（主角） */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setIconOpen(o => !o)}
              title="点击更换图标"
              aria-expanded={iconOpen}
              className="relative shrink-0 mt-0.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lm-accent/50"
            >
              <EventBadge emoji={currentIcon.emoji} size="lg" />
              <span
                aria-hidden
                className="absolute -right-1.5 -bottom-1.5 w-[18px] h-[18px] rounded-full bg-white border border-lm-line/70 shadow-sm flex items-center justify-center text-lm-body/60"
              >
                <svg
                  className={`w-2.5 h-2.5 transition-transform duration-200 ${iconOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 9l7 7 7-7" />
                </svg>
              </span>
            </button>
            <input
              type="text"
              data-autofocus
              placeholder="给这个回忆起个名字…"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              className="flex-1 min-w-0 bg-transparent text-[21px] md:text-[23px] font-serif-cn leading-snug text-lm-ink outline-none placeholder:text-lm-body/30 py-0.5"
            />
          </div>

          {/* 图标选择 —— 按需展开，紧凑小格 */}
          {iconOpen && (
            <div className="mt-3 p-3 rounded-2xl bg-white/55 border border-lm-line/50 animate-[fadeIn_0.18s_ease-out]">
              <div className="grid grid-cols-8 gap-1.5">
                {ICONS.map(ic => {
                  const on = draft.icon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      onClick={() => setDraft(d => ({ ...d, icon: ic.id }))}
                      title={ic.label}
                      aria-pressed={on}
                      className={`aspect-square rounded-[10px] flex items-center justify-center text-[15px] border transition-all ${
                        on
                          ? 'bg-gradient-to-br from-lm-accent/30 to-lm-accent-deep/15 border-lm-accent/60 shadow-[0_2px_8px_rgba(204,146,102,0.25)]'
                          : 'bg-white/70 border-transparent hover:border-lm-line hover:bg-white'
                      }`}
                    >
                      {ic.emoji}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[10px] text-lm-body/40">
                {currentIcon.emoji} {currentIcon.label} · 点选更换
              </p>
            </div>
          )}

          {/* 日期（含可选跨天开关）与地点 —— 清晰点线行 */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[9px] tracking-[0.25em] uppercase text-lm-accent shrink-0">Date</span>
              <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80 mb-[3px]" />
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="date"
                  value={draft.date}
                  onChange={e => setDraft(d => ({
                    ...d,
                    date: e.target.value,
                    endDate: d.endDate && e.target.value > d.endDate ? '' : d.endDate
                  }))}
                  className="bg-transparent text-[11px] text-lm-body/80 outline-none tabular-nums"
                />
                {showEndDate ? (
                  <>
                    <span className="text-[10px] text-lm-body/40">至</span>
                    <input
                      type="date"
                      min={draft.date}
                      value={draft.endDate}
                      onChange={e => setDraft(d => ({ ...d, endDate: e.target.value }))}
                      className="bg-transparent text-[11px] text-lm-body/80 outline-none tabular-nums"
                    />
                    {tripDays > 1 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-lm-accent/15 text-lm-accent-deep text-[9.5px] font-medium">
                        {tripDays}天
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEndDate(false);
                        setDraft(d => ({ ...d, endDate: '' }));
                      }}
                      title="切换为单日事件"
                      className="text-[10px] text-lm-body/40 hover:text-lm-ink px-1"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEndDate(true)}
                    className="px-1.5 py-0.5 rounded-full bg-white/70 border border-lm-line/60 text-[9.5px] text-lm-body/55 hover:text-lm-accent-deep hover:border-lm-accent/40 transition-colors"
                  >
                    + 跨天
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.25em] uppercase text-lm-accent shrink-0">
                <PinIcon className="w-3 h-3" />
                Place
              </span>
              <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80 mb-[3px]" />
              <input
                type="text"
                placeholder="具体地名（餐厅 / 景点 / 家里…）"
                value={draft.location}
                onChange={e => {
                  const nextLoc = e.target.value;
                  if (cityManual) {
                    setDraft(d => ({ ...d, location: nextLoc }));
                  } else {
                    const guessed = resolvePlace(nextLoc)?.city || '';
                    setDraft(d => ({ ...d, location: nextLoc, city: guessed }));
                  }
                }}
                className="w-[180px] sm:w-[220px] shrink-0 text-right bg-transparent text-[11px] text-lm-body/80 outline-none placeholder:text-lm-body/30"
              />
            </div>
          </div>

          {/* 城市归属提示与快捷切换 —— 固定高度不撑开卡片 */}
          <div className="mt-1.5 h-5 flex items-center justify-between gap-2 text-[10px] overflow-hidden">
            {resolvedCity ? (
              <>
                <span className="text-lm-accent-deep/80 inline-flex items-center gap-1 whitespace-nowrap truncate">
                  <PinIcon className="w-3 h-3 shrink-0" />
                  <span>地图定位：{resolvedCity.city} · {resolvedCity.province}</span>
                  {homeCity && resolvedCity.city === homeCity && (
                    <span className="text-lm-body/45">(常驻)</span>
                  )}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCityPickerOpen(o => !o)}
                    className="text-lm-accent hover:underline"
                  >
                    更改
                  </button>
                  <button
                    type="button"
                    onClick={() => selectCity('')}
                    className="text-lm-body/45 hover:text-lm-ink"
                  >
                    设为日常
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-lm-body/40 whitespace-nowrap truncate">
                  {draft.location.trim() ? '日常记忆（不上中国地图）' : '填地名可自动定位城市，或手动指定'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {homeCity && (
                    <button
                      type="button"
                      onClick={() => selectCity(homeCity)}
                      className="px-1.5 py-0.5 rounded-full bg-lm-accent/10 text-lm-accent-deep hover:bg-lm-accent/20 transition-colors"
                    >
                      设为{homeCity}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCityPickerOpen(o => !o)}
                    className="px-1.5 py-0.5 rounded-full bg-white/70 border border-lm-line/60 text-lm-body/65 hover:text-lm-accent-deep transition-colors"
                  >
                    {cityPickerOpen ? '收起' : '选城市'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 轻量城市选择器 —— 仅在点击「选城市 / 更改」时展开 */}
          {cityPickerOpen && (
            <div className="mt-2 p-3 rounded-2xl bg-white/70 border border-lm-line/60 space-y-2.5 animate-[fadeIn_0.18s_ease-out]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={e => setCityQuery(e.target.value)}
                  placeholder="搜城市或省份，如 武汉、黄冈、四川…"
                  className="flex-1 bg-white border border-lm-line/50 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-lm-accent"
                />
                <button
                  type="button"
                  onClick={() => selectCity('')}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-lm-line/30 text-[11px] text-lm-body/70 hover:bg-lm-line/50"
                >
                  不上地图
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-1.5 pr-1">
                {filteredCities.map(item => {
                  const active = draft.city === item.city;
                  return (
                    <button
                      key={item.city}
                      type="button"
                      onClick={() => selectCity(item.city)}
                      className={`px-2 py-1.5 rounded-lg text-left transition-all border ${
                        active
                          ? 'bg-lm-accent/15 border-lm-accent/50 text-lm-accent-deep font-medium'
                          : 'bg-white/80 border-transparent hover:border-lm-line text-lm-ink'
                      }`}
                    >
                      <div className="text-[11px] truncate">{item.city}</div>
                      <div className="text-[9px] text-lm-body/40 truncate">{item.province}</div>
                    </button>
                  );
                })}
                {filteredCities.length === 0 && (
                  <p className="col-span-full text-center text-[11px] text-lm-body/40 py-2">
                    没找到匹配城市，可直接搜索所属地级市
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 描述 —— 引文样式，落笔感 */}
          <div className="mt-5">
            <SectionLabel>描述</SectionLabel>
            <div className="relative mt-1.5">
              <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-lm-accent/55 via-lm-accent/25 to-transparent" />
              <textarea
                placeholder="记录一下这个美好的瞬间…"
                value={draft.desc}
                onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
                rows={3}
                className="w-full pl-3.5 py-1 pr-2 bg-transparent resize-none outline-none text-[13px] leading-[1.85] text-lm-ink placeholder:text-lm-body/30 rounded-r-xl focus:bg-white/60 transition-colors"
              />
            </div>
          </div>

          {/* 心情 —— 细 chips，选中 accent 实底 */}
          <div className="mt-5">
            <SectionLabel>心情</SectionLabel>
            <div className="mt-2 flex gap-1 flex-wrap">
              {MOODS.map(m => {
                const on = draft.mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setDraft(d => ({ ...d, mood: d.mood === m.id ? '' : m.id }))}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1 pl-1 pr-1.5 h-7 rounded-full text-[10px] whitespace-nowrap transition-all ${
                      on
                        ? 'bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white font-medium shadow-[0_2px_8px_rgba(173,124,87,0.25)]'
                        : 'bg-white/55 text-lm-body/65 border border-lm-line/40 hover:bg-white hover:text-lm-ink'
                    }`}
                  >
                    <span className="text-[13px] leading-none">{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions —— 移动底部固定、桌面右对齐 */}
        <div className="shrink-0 px-5 py-3.5 border-t border-lm-line/40 bg-lm-bg/95 backdrop-blur-xl flex gap-2.5 sm:justify-end pb-[calc(env(safe-area-inset-bottom)_+_0.875rem)] sm:pb-3.5">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none h-10 px-6 rounded-full text-[13px] text-lm-body/70 hover:text-lm-ink hover:bg-white/70 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="flex-1 sm:flex-none h-10 px-7 rounded-full bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white text-[13px] font-medium shadow-[0_4px_14px_rgba(173,124,87,0.3)] active:scale-[0.98] transition-transform"
          >
            {editEvent ? '保存修改' : '保存回忆'}
          </button>
        </div>
    </Overlay>
  );
}
