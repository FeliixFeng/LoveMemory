'use client';

import { memo, useRef } from 'react';
import { Event, Photo, Expense } from '../lib/types';
import { getEmoji, fmt, formatCurrency, calcTotalExpenses, getMoodEmoji } from '../lib/utils';
import { SafeImage } from './SafeImage';

/* 首页只放「封面级」的少量照片，其余交给相册。
   移动端 3 张（第 3 张盖 +N 角标），桌面端 7 张 + 1 格入口。 */
const MAX_MOBILE = 3;
const MAX_DESKTOP = 7;

/* 照片面板固定高度 —— 1/2/3 张的卡片不再一张高一张矮 */
const PANEL_H = 'h-[172px] md:h-[300px]';

/* 类名必须是字面量，否则 Tailwind 扫不到 */
const MD_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4'
};

export const EventPreviewCard = memo(function EventPreviewCard({
  event, photos, expenses, onExpand, onEdit, onViewPhoto, onAddPhoto,
  onSwipeLeft, onSwipeRight
}: {
  event: Event | null;
  photos: Photo[];
  expenses: Expense[];
  onExpand: () => void;
  onEdit: () => void;
  onViewPhoto?: (photos: Photo[], index: number) => void;
  onAddPhoto?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (!event) return null;

  const total = calcTotalExpenses(expenses);
  const n = photos.length;

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = touchStart.current.x - e.changedTouches[0].clientX;
    const dy = touchStart.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dx > 0 ? onSwipeLeft?.() : onSwipeRight?.();
    }
    touchStart.current = null;
  }

  /* ── 照片面板 ──────────────────────────────────────────────
     高度恒定，靠列数/行数把照片铺满，只裁不拉伸。
     格子不留圆角，交给卡片的 overflow-hidden 裁外圈。
     ───────────────────────────────────────────────────────── */
  const mobileCols = n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-2' : 'grid-cols-3';
  const mdColCount = n <= 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 2 : n <= 6 ? 3 : 4;
  const mdCols = MD_COLS[mdColCount];
  const mdRows = n >= 4 ? 'md:grid-rows-2' : 'md:grid-rows-1';
  // 末行填不满时，用「查看相册」那一格补上，避免留一个白洞
  const showAlbumCell = n > MAX_DESKTOP || n % mdColCount !== 0;
  const imgSizes =
    n === 1 ? '(max-width: 767px) 92vw, 40vw'
      : n === 2 ? '(max-width: 767px) 45vw, 30vw'
        : '(max-width: 767px) 30vw, 22vw';

  const photoPanel = (
    <div className={`relative shrink-0 ${PANEL_H} md:flex-1 md:min-w-0`}>
      {n > 0 ? (
        <div className={`grid h-full w-full gap-[3px] ${mobileCols} ${mdCols} grid-rows-1 ${mdRows}`}>
          {photos.slice(0, MAX_DESKTOP).map((p, i) => (
            <button
              key={p.url || i}
              onClick={() => onViewPhoto?.(photos, i)}
              className={`relative overflow-hidden bg-lm-accent/15 ${i >= MAX_MOBILE ? 'hidden md:block' : ''}`}
            >
              <SafeImage
                src={p.thumbUrl || p.displayUrl || p.url}
                alt=""
                fill
                sizes={imgSizes}
                className="object-cover"
              />
              {/* 移动端：第 3 张盖一层「还有 N 张」 */}
              {i === MAX_MOBILE - 1 && n > MAX_MOBILE && (
                <span className="md:hidden absolute inset-0 flex items-center justify-center bg-black/45 text-white text-sm font-semibold tracking-wide">
                  +{n - MAX_MOBILE}
                </span>
              )}
            </button>
          ))}

          {/* 桌面端：末行补齐 / 相册入口 */}
          {showAlbumCell && (
            <button
              onClick={onExpand}
              className="hidden md:flex relative items-center justify-center bg-lm-accent/10 hover:bg-lm-accent/20 transition-colors"
            >
              <span className="text-[11px] leading-snug text-lm-ink/55 font-medium text-center px-1">
                {n > MAX_DESKTOP && <span className="block tabular-nums mb-0.5">全部 {n} 张</span>}
                <span className="text-lm-accent-deep">查看相册 →</span>
              </span>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onAddPhoto}
          className="group w-full h-full flex flex-col items-center justify-center gap-1.5 bg-lm-line/25 text-lm-ink-strong/35 hover:bg-lm-accent/15 hover:text-lm-accent transition-colors"
        >
          <span className="text-2xl">📷</span>
          <span className="text-xs">添加几张照片来记录这个瞬间</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      className="px-4 lg:px-0"
      style={{ animation: 'slideUp 0.4s ease-out' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <article className="lm-glass-panel rounded-3xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[300px]">

          {/* 左：文字栏 */}
          <div className="lm-paper-panel relative flex flex-col p-4 md:p-5 min-h-[156px] md:min-h-0 md:w-[40%] md:shrink-0 md:overflow-hidden md:border-r md:border-lm-line/50">
            {/* 一层暖光打在玻璃上，让左栏不是死白 */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 w-48 h-48 rounded-full bg-lm-blush/20 blur-3xl"
            />

            {/* 眉标 */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 移动端：日期 + 地点 */}
              <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-lm-body/55 md:hidden">
                <span className="shrink-0 tabular-nums">{fmt(event.date)}</span>
                {event.location && (
                  <>
                    <span className="text-lm-body/25">·</span>
                    <span className="truncate">📍 {event.location}</span>
                  </>
                )}
              </div>
              {/* 桌面端：短横线 + MEMORY */}
              <div className="hidden md:flex items-center gap-2">
                <span aria-hidden className="h-px w-4 bg-lm-accent/45" />
                <span className="text-[9.5px] leading-none tracking-[0.24em] uppercase text-lm-accent-deep/65 font-display">Memory</span>
              </div>
              <div className="ml-auto flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                <button
                  onClick={onEdit}
                  title="编辑"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-lm-ink-strong/35 hover:text-lm-ink-strong/70 hover:bg-white/70 transition-all"
                >
                  ✎
                </button>
                <button
                  onClick={onExpand}
                  title="翻开回忆"
                  className="md:hidden w-7 h-7 rounded-full flex items-center justify-center text-lm-ink-strong/40 hover:text-lm-ink-strong/70 hover:bg-white/70 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            {/* 标题 */}
            <div className="flex items-baseline gap-2 mt-2.5 md:mt-3.5 min-w-0 shrink-0">
              <span className="text-[17px] md:text-[20px] shrink-0 leading-none">{getEmoji(event.icon)}</span>
              <h3 className="text-[17px] md:text-[26px] font-bold text-lm-ink truncate font-serif-cn leading-[1.2] tracking-tight">
                {event.title || '未命名事件'}
              </h3>
              {event.mood && <span className="text-sm shrink-0 leading-none">{getMoodEmoji(event.mood)}</span>}
            </div>

            {/* 描述：左边一道暖色渐隐竖线，做成引文的样子。
                移动端这块吃掉多余高度并把文字垂直居中——否则短描述下面会留一条空洞。 */}
            <div className="relative mt-2 md:mt-2.5 flex-1 md:flex-none min-w-0 flex items-center md:items-start">
              <div className={`relative w-full min-w-0 ${event.desc ? 'pl-2.5 md:pl-3' : ''}`}>
                {event.desc && (
                  <span aria-hidden className="absolute left-0 top-[3px] bottom-[3px] w-[2px] rounded-full bg-gradient-to-b from-lm-accent/60 via-lm-accent/25 to-transparent" />
                )}
                <p className="text-xs md:text-[13px] leading-[1.75] text-lm-body/70 line-clamp-2 md:line-clamp-3">
                  {event.desc || <span className="text-lm-body/30">还没有写描述，点右上角 ✎ 补一句</span>}
                </p>
              </div>
            </div>

            {/* 桌面端信息栏：标签 · 点线 · 值，像一张手写标签，比四宫格更耐看 */}
            <dl className="hidden md:flex flex-col gap-[10px] mt-auto pt-4 border-t border-lm-line/60">
              {([
                ['Date', fmt(event.date)],
                ['Place', event.location || '—'],
                ['Photos', `${n} 张`],
                ['Spent', total > 0 ? formatCurrency(total) : '—']
              ] as const).map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 min-w-0">
                  <dt className="shrink-0 text-[9.5px] leading-none tracking-[0.2em] uppercase text-lm-body/50 font-display">{k}</dt>
                  <span aria-hidden className="flex-1 min-w-2 border-b border-dotted border-lm-line/80" />
                  <dd className="shrink-0 max-w-[62%] truncate text-[13px] leading-none text-lm-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            {/* 底部：移动端一行元信息 / 桌面端玻璃按钮 */}
            <div className="mt-auto md:mt-3 shrink-0">
              {/* 常驻一行：有没有花费都占位，卡片高度才稳定 */}
              <div className="flex items-center gap-2 md:hidden text-[10.5px] text-lm-body/55 tabular-nums">
                <span>{n > 0 ? `${n} 张照片` : '暂无照片'}</span>
                {total > 0 && (
                  <>
                    <span aria-hidden className="w-[3px] h-[3px] rounded-full bg-lm-body/30" />
                    <span>{formatCurrency(total)}</span>
                  </>
                )}
              </div>

              <div className="hidden md:flex items-center justify-end">
                <button
                  onClick={onExpand}
                  className="lm-glass-chip group inline-flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full text-[11.5px] font-medium text-lm-accent-deep tracking-[0.02em]"
                >
                  翻开回忆
                  <span className="w-[18px] h-[18px] rounded-full bg-lm-accent/15 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 transition-transform duration-300 group-hover:translate-x-px" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 右：照片面板 */}
          {photoPanel}
        </div>
      </article>
    </div>
  );
})
