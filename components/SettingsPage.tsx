'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SettingsPatch } from '../app/lib/schemas';
import { HERO_SLIDES, type HeroSlide } from '../lib/constants';
import { collectPlaces, resolveCity, resolvePlace } from '../lib/place';
import { useAuth } from './SiteLayoutClient';
import { useAppData } from '../hooks/useAppData';
import { fmt } from '../lib/utils';
import { deriveThumbFromUrl } from '../lib/image';
import { Toast } from './Toast';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { SafeImage } from './SafeImage';
import { PinIcon } from './NavIcons';

const TABS = [
  { key: 'date' as const, label: '档案' },
  { key: 'cover' as const, label: '封面' },
  { key: 'quotes' as const, label: '语录' },
  { key: 'countdowns' as const, label: '倒计时' },
];

const QUICK_HOME_CITIES = ['武汉', '上海', '北京', '成都', '杭州', '深圳'];

export function SettingsPage() {
  const { token, withAuth } = useAuth();
  const { data, loading, toast, setToast, saveSettings, loadData, days } = useAppData();
  const [tab, setTab] = useState<'date' | 'cover' | 'quotes' | 'countdowns'>('date');
  const [newQuote, setNewQuote] = useState('');
  const [newCountdown, setNewCountdown] = useState({ label: '', date: '', emoji: '🎂' });
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const [namesDraft, setNamesDraft] = useState<string[]>(() => [
    data.coupleNames?.[0] || '',
    data.coupleNames?.[1] || ''
  ]);
  const [homeCityDraft, setHomeCityDraft] = useState<string>(data.homeCity || '');

  useEffect(() => {
    setNamesDraft([data.coupleNames?.[0] || '', data.coupleNames?.[1] || '']);
  }, [data.coupleNames]);

  useEffect(() => {
    setHomeCityDraft(data.homeCity || '');
  }, [data.homeCity]);

  const placesCount = useMemo(() => collectPlaces(data.events).length, [data.events]);

  function handleNameBlur() {
    const trimmed = [namesDraft[0]?.trim() || '', namesDraft[1]?.trim() || ''].filter(Boolean);
    const original = (data.coupleNames || []).filter(Boolean);
    if (JSON.stringify(trimmed) !== JSON.stringify(original)) {
      withAuth(() => void save({ coupleNames: trimmed }, '已保存'));
    }
  }

  function handleHomeCityBlur() {
    const raw = homeCityDraft.trim();
    const resolved = raw ? (resolveCity(raw) || resolvePlace(raw)) : null;
    const normalized = resolved ? resolved.city : raw;
    setHomeCityDraft(normalized);
    if (normalized !== (data.homeCity || '')) {
      withAuth(() => void save({ homeCity: normalized }, normalized ? `已设常驻城市：${normalized}` : '已清除常驻城市'));
    }
  }

  function handleExportBackup() {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'LoveMemory',
        data
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovememory-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('已导出回忆备份');
    } catch {
      setToast('导出失败');
    }
  }

  async function save(patch: SettingsPatch, msg?: string) {
    try {
      await saveSettings(patch, msg);
    } catch {
      loadData();
      setToast('保存失败');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-36 bg-lm-line/20 rounded-3xl animate-pulse" />
        <div className="h-10 bg-lm-line/20 rounded-full animate-pulse" />
        <div className="h-44 bg-lm-line/20 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const visibleDefaults: HeroSlide[] = HERO_SLIDES.filter(
    s => !(data.hiddenDefaultCovers || []).includes(s.web) && !(data.hiddenDefaultCovers || []).includes(s.mobile)
  );
  const hasHidden = (data.hiddenDefaultCovers || []).length > 0;
  const nameA = namesDraft[0]?.trim() || data.coupleNames?.[0] || '峰';
  const nameB = namesDraft[1]?.trim() || data.coupleNames?.[1] || '欣';

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

      {/* 顶栏一体化：标题 + 导出备份 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="w-4 h-px bg-lm-accent/70 shrink-0" />
          <span className="text-[10px] tracking-[0.28em] uppercase text-lm-accent font-display shrink-0">OUR SPACE</span>
          <h1 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn shrink-0">我们</h1>
        </div>

        <button
          type="button"
          onClick={handleExportBackup}
          className="lm-glass-chip px-3 py-1 rounded-full text-xs font-medium text-lm-accent-deep inline-flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
          title="将全部文字与照片链接导出为本地 JSON 存档"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17" />
          </svg>
          <span>导出备份</span>
        </button>
      </div>

      {/* 情侣档案顶卡 —— 告别冰冷后台的起点 */}
      <div className="lm-glass-panel rounded-3xl p-5 relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-lm-blush/25 blur-3xl"
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* 双人重叠姓名徽章 */}
            <div className="flex items-center shrink-0">
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-lm-blush to-lm-accent text-white font-serif-cn font-bold text-base flex items-center justify-center border-2 border-white shadow-sm">
                {nameA.slice(0, 1)}
              </span>
              <span className="-ml-3 w-11 h-11 rounded-full bg-gradient-to-br from-lm-accent to-lm-accent-deep text-white font-serif-cn font-bold text-base flex items-center justify-center border-2 border-white shadow-sm">
                {nameB.slice(0, 1)}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-lm-ink font-serif-cn truncate">
                  {data.coupleNames?.length > 0 ? data.coupleNames.join(' · ') : 'OUR STORY'}
                </h2>
                {data.homeCity && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-lm-accent/12 text-lm-accent-deep text-[10px] shrink-0">
                    <PinIcon className="w-2.5 h-2.5" />
                    {data.homeCity}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-lm-body/55 mt-0.5 font-display">
                {data.startDate ? `Since ${fmt(data.startDate)}` : '设置你们在一起的第一天'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-lm-accent-deep font-display tabular-nums leading-none">
                {days}
              </span>
              <span className="text-[10px] text-lm-body/50 uppercase font-display">Days</span>
            </div>
          </div>
        </div>

        {/* 底部微统计分割行 */}
        <div className="mt-4 pt-3.5 border-t border-lm-line/45 grid grid-cols-4 gap-2 text-center">
          {[
            { label: '回忆', value: data.events.length },
            { label: '照片', value: data.photos.length },
            { label: '足迹', value: placesCount },
            { label: '账单', value: data.expenses.length },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-sm font-bold text-lm-ink font-display tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-lm-body/45 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 四段圆角磨砂切换胶囊 */}
      <div className="flex gap-1 p-1 bg-white/70 backdrop-blur-md rounded-full border border-lm-border/70 shadow-2xs">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs rounded-full transition-all duration-300 font-medium ${
              tab === t.key
                ? 'lm-glass-pill text-lm-accent-deep font-semibold shadow-xs'
                : 'text-lm-body/45 hover:text-lm-body/75'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: 情侣档案（去方框表单，改用编辑手账点线行） ===== */}
      {tab === 'date' && (
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {/* 我们的名字 */}
          <div className="lm-glass-panel rounded-3xl p-5 space-y-4">
            <div>
              <span className="text-[9.5px] tracking-[0.26em] uppercase text-lm-accent font-display">NAMES</span>
              <h3 className="text-sm font-bold text-lm-ink font-serif-cn mt-0.5">我们的称呼</h3>
            </div>
            <div className="space-y-3">
              {['第一位', '第二位'].map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-lm-body/45 font-display shrink-0">
                    {i === 0 ? '01' : '02'}
                  </span>
                  <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80 mb-1" />
                  <input
                    type="text"
                    value={namesDraft[i] || ''}
                    onChange={e => {
                      const next = [...namesDraft];
                      next[i] = e.target.value;
                      setNamesDraft(next);
                    }}
                    onBlur={handleNameBlur}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleNameBlur();
                    }}
                    placeholder={label}
                    maxLength={20}
                    className="w-32 text-right bg-transparent text-sm font-serif-cn text-lm-ink outline-none placeholder:text-lm-body/30 py-1 border-b border-transparent focus:border-lm-accent transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10.5px] text-lm-body/45">显示在顶部导航栏，留空则显示 OUR STORY</p>
          </div>

          {/* 纪念日 */}
          <div className="lm-glass-panel rounded-3xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[9.5px] tracking-[0.26em] uppercase text-lm-accent font-display">ANNIVERSARY</span>
              <h3 className="text-sm font-bold text-lm-ink font-serif-cn mt-0.5">在一起的那天</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-lm-body/45 font-display shrink-0">Since</span>
              <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80 mb-1" />
              <input
                type="date"
                value={data.startDate}
                onChange={e => withAuth(() => void save({ startDate: e.target.value }, '已保存'))}
                className="bg-transparent text-sm text-lm-ink font-serif-cn outline-none tabular-nums py-1"
              />
            </div>
            <p className="text-[10.5px] text-lm-body/45">首页天数、纪念日倒计时与里程碑均由此自动计算</p>
          </div>

          {/* 常驻城市 */}
          <div className="lm-glass-panel rounded-3xl p-5 space-y-3 md:col-span-2">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[9.5px] tracking-[0.26em] uppercase text-lm-accent font-display">HOME BASE</span>
                <h3 className="text-sm font-bold text-lm-ink font-serif-cn mt-0.5">常驻城市</h3>
              </div>
              {homeCityDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setHomeCityDraft('');
                    if (data.homeCity) withAuth(() => void save({ homeCity: '' }, '已清除'));
                  }}
                  className="text-[11px] text-lm-body/45 hover:text-lm-ink transition-colors"
                >
                  清除
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase text-lm-body/45 font-display shrink-0">
                <PinIcon className="w-3 h-3 text-lm-accent" />
                City
              </span>
              <span aria-hidden className="flex-1 border-b border-dotted border-lm-line/80 mb-1" />
              <input
                type="text"
                value={homeCityDraft}
                onChange={e => setHomeCityDraft(e.target.value)}
                onBlur={handleHomeCityBlur}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleHomeCityBlur();
                }}
                placeholder="输入城市名，如 武汉"
                maxLength={30}
                className="w-36 text-right bg-transparent text-sm font-serif-cn text-lm-ink outline-none placeholder:text-lm-body/30 py-1 border-b border-transparent focus:border-lm-accent transition-colors"
              />
            </div>

            {/* 快捷城市点选 / 识别状态 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-lm-body/50">
                {homeCityDraft.trim()
                  ? (() => {
                      const hit = resolveCity(homeCityDraft) || resolvePlace(homeCityDraft);
                      return hit ? `已绑定大本营：${hit.city} · ${hit.province}` : '未匹配到内置城市，将按原文本匹配';
                    })()
                  : '用于在足迹页区分同城生活与远方旅行'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_HOME_CITIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setHomeCityDraft(c);
                      if (c !== data.homeCity) withAuth(() => void save({ homeCity: c }, `已设常驻城市：${c}`));
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] transition-all ${
                      data.homeCity === c
                        ? 'lm-glass-pill text-lm-accent-deep font-medium'
                        : 'bg-white/60 text-lm-body/55 hover:text-lm-ink border border-lm-line/40'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: 首页氛围封面墙 ===== */}
      {tab === 'cover' && (
        <div className="space-y-4">
          {data.customCovers.length > 0 && (
            <div className="lm-glass-panel rounded-3xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-[0.26em] uppercase text-lm-accent font-display">CUSTOM COVERS</span>
                <span className="text-[11px] text-lm-body/45">{data.customCovers.length} 张自定义</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
                {data.customCovers.map((url, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-xs">
                    <SafeImage
                      src={deriveThumbFromUrl(url) || url}
                      fallbackSrc={url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, 200px"
                      className="object-cover"
                    />
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认移除封面', message: '确定要移除这张封面吗？', onConfirm: () => void save({ customCovers: data.customCovers.filter(c => c !== url) }, '已删除') }))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10px] flex items-center justify-center opacity-80 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
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
            className="w-full py-4 lm-glass-panel rounded-3xl border border-dashed border-lm-accent/40 text-xs font-medium text-lm-accent-deep hover:border-lm-accent transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span className="text-base">+</span>
            <span>上传一张首页氛围封面</span>
          </button>

          {visibleDefaults.length > 0 && (
            <div className="lm-glass-panel rounded-3xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-[0.26em] uppercase text-lm-accent font-display">BUILT-IN COVERS</span>
                {hasHidden && (
                  <button onClick={() => withAuth(() => void save({ hiddenDefaultCovers: [] }, '已恢复默认'))} className="text-[11px] text-lm-accent hover:underline">
                    恢复全部默认
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
                {visibleDefaults.map((slide, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-xs">
                    <SafeImage src={slide.web} alt="" fill sizes="(max-width: 640px) 33vw, 200px" className="object-cover" />
                    <button
                      onClick={() => withAuth(() => void save({ hiddenDefaultCovers: [...(data.hiddenDefaultCovers || []), slide.web] }, '已隐藏'))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10px] flex items-center justify-center opacity-80 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 transition-all"
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

      {/* ===== TAB 3: 情话手账便签 ===== */}
      {tab === 'quotes' && (
        <div className="space-y-3">
          <div className="lm-glass-panel rounded-3xl p-4 flex items-center gap-2.5">
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
              placeholder="写一句想在首页轮播的情话…"
              className="flex-1 bg-transparent px-2 py-1.5 text-sm font-serif-cn text-lm-ink outline-none placeholder:text-lm-body/35"
            />
            <button
              onClick={() => {
                if (!newQuote.trim()) return;
                withAuth(() => void save({ loveQuotes: [...data.loveQuotes, { id: Date.now(), content: newQuote.trim() }] }, '已添加'));
                setNewQuote('');
              }}
              className="lm-glass-chip px-4 py-1.5 rounded-full text-xs font-medium text-lm-accent-deep shrink-0 active:scale-95 transition-all"
            >
              + 收录
            </button>
          </div>

          {data.loveQuotes.length === 0 ? (
            <div className="lm-card rounded-3xl p-10 text-center">
              <p className="text-xs text-lm-body/40 font-serif-cn">还没有写下情话</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.loveQuotes.map((q, i) => (
                <div key={q.id} className="lm-glass-panel rounded-3xl p-4 relative flex items-start justify-between gap-3">
                  <div className="relative pl-3.5 min-w-0">
                    <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-lm-accent/70 via-lm-accent/30 to-transparent" />
                    <span className="text-[9px] tracking-[0.25em] uppercase text-lm-accent/80 font-display">
                      NOTE {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-lm-ink font-serif-cn leading-relaxed mt-1">
                      “{q.content}”
                    </p>
                  </div>
                  <button
                    onClick={() => withAuth(() => setConfirm({ title: '确认删除语录', message: '确定要删除这条语录吗？', onConfirm: () => void save({ loveQuotes: data.loveQuotes.filter(x => x.id !== q.id) }, '已删除') }))}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/25 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 4: 倒计时台历卡片 ===== */}
      {tab === 'countdowns' && (
        <div className="space-y-3">
          <div className="lm-glass-panel rounded-3xl p-4 space-y-3">
            <span className="text-[9.5px] tracking-[0.25em] uppercase text-lm-accent font-display">ADD COUNTDOWN</span>
            <div className="flex gap-2">
              <select
                value={newCountdown.emoji}
                onChange={e => setNewCountdown(d => ({ ...d, emoji: e.target.value }))}
                className="bg-white/75 border border-lm-line/50 rounded-xl px-2 py-2 text-sm outline-none"
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
                placeholder="重要日子的名称…"
                className="flex-1 bg-white/75 border border-lm-line/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newCountdown.date}
                onChange={e => setNewCountdown(d => ({ ...d, date: e.target.value }))}
                className="flex-1 bg-white/75 border border-lm-line/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-lm-accent"
              />
              <button
                onClick={() => {
                  if (!newCountdown.label || !newCountdown.date) return;
                  withAuth(() => void save({ countdowns: [...(data.countdowns || []), { ...newCountdown, id: Date.now() }] }, '已添加'));
                  setNewCountdown({ label: '', date: '', emoji: '🎂' });
                }}
                className="lm-glass-chip px-4 py-2 rounded-full text-xs font-medium text-lm-accent-deep shrink-0 active:scale-95 transition-all"
              >
                + 添加
              </button>
            </div>
          </div>

          {(data.countdowns || []).length === 0 ? (
            <div className="lm-card rounded-3xl p-10 text-center">
              <p className="text-xs text-lm-body/40 font-serif-cn">暂无倒计时</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(data.countdowns || []).map(c => {
                const daysLeft = (() => {
                  const now = new Date();
                  const target = new Date(`${c.date}T00:00:00`);
                  let next = new Date(now.getFullYear(), target.getMonth(), target.getDate());
                  if (next.getTime() < now.getTime()) next.setFullYear(next.getFullYear() + 1);
                  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
                })();
                return (
                  <div key={c.id} className="lm-glass-panel rounded-3xl p-4 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lm-blush/60 to-lm-accent/30 border border-lm-accent/30 flex items-center justify-center text-xl shrink-0">
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-lm-ink font-serif-cn truncate">{c.label}</p>
                      <p className="text-[11px] text-lm-body/50 mt-0.5 tabular-nums">{fmt(c.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold text-lm-accent-deep font-display tabular-nums leading-none">
                        {daysLeft}
                      </span>
                      <span className="block text-[9.5px] text-lm-body/45 mt-0.5">天后</span>
                    </div>
                    <button
                      onClick={() => withAuth(() => setConfirm({ title: '确认删除倒计时', message: '确定要删除这个倒计时吗？', onConfirm: () => void save({ countdowns: (data.countdowns || []).filter(x => x.id !== c.id) }, '已删除') }))}
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-lm-body/25 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      ×
                    </button>
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
