/* 事件类别 emoji 的统一"戴法" —— 暖底小圆徽章（时间轴玻璃圆盘语言的缩小版）。
   20 个 emoji 各自够花了，底色一律 accent 暖调淡染，不配彩虹底。
   事件类别 emoji 是内容（用户明确要保留），这里只统一容器，不换成 SVG。 */

export function EventBadge({
  emoji, size = 'sm', className = ''
}: { emoji: string; size?: 'sm' | 'lg'; className?: string }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-xl rounded-2xl' : 'w-6 h-6 text-[13px] rounded-lg';
  return (
    <span
      aria-hidden
      className={`${dim} inline-flex items-center justify-center shrink-0 leading-none select-none ${className}`}
      style={{
        background: 'linear-gradient(140deg, rgba(204,146,102,0.20), rgba(173,124,87,0.10))',
        border: '1px solid rgba(173,124,87,0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
      }}
    >
      {emoji}
    </span>
  );
}
