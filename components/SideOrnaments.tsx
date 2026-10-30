'use client';

import { useAppData } from '../hooks/useAppData';

/* 超宽屏（≥1280px）内容两侧留白的「书脊」装饰 —— 杂志侧边栏的语汇。
   只在有余量的断点出现，窄屏不渲染；全部 pointer-events-none，不挡交互。
   内容随数据走：左边双方名字，右边起始日 + 在一起天数。 */

function Hairline() {
  return <span aria-hidden className="block w-px h-9 bg-lm-accent/20" />;
}

export function SideOrnaments() {
  const { data, days } = useAppData();
  const names = (data.coupleNames || []).filter(Boolean).join(' · ');
  const since = data.startDate ? data.startDate.replace(/-/g, '.') : '';

  return (
    <div aria-hidden className="hidden xl:block fixed inset-0 pointer-events-none z-0 select-none">
      {/* 左书脊：双方名字（没填回退 OUR STORY） */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 flex flex-col items-center gap-3">
        <Hairline />
        <span
          className="text-[10px] tracking-[0.5em] uppercase text-lm-accent/30 font-display"
          style={{ writingMode: 'vertical-rl' }}
        >
          {names || 'OUR STORY'}
        </span>
        <Hairline />
      </div>

      {/* 右书脊：起始日 · 天数 */}
      {since && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center gap-3">
          <Hairline />
          <span
            className="text-[10px] tracking-[0.4em] uppercase text-lm-accent/30 font-display tabular-nums"
            style={{ writingMode: 'vertical-rl' }}
          >
            SINCE {since} · {days} DAYS
          </span>
          <Hairline />
        </div>
      )}
    </div>
  );
}
