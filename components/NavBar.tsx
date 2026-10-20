'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/album', label: '相册', icon: '📷' },
  { href: '/footprint', label: '足迹', icon: '🗺️' },
  { href: '/wishes', label: '心愿', icon: '💝' },
  { href: '/more', label: '更多', icon: '⋯' },
];

export function NavBar({ isAuthenticated, onSettings, onPin }: { isAuthenticated: boolean; onSettings?: () => void; onPin?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-lm-bg/85 backdrop-blur-xl border-b border-lm-accent/10">
      <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto flex items-center px-4 py-2.5">
        {/* Desktop: logo + links (left-aligned) */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <Link href="/" className="shrink-0">
            <span className="text-base font-bold text-gradient font-serif-cn">珍藏回忆</span>
          </Link>
          <span className="w-px h-4 bg-lm-accent/40" />
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${active ? 'bg-lm-accent/10 text-lm-accent font-semibold' : 'text-lm-ink-strong/40 hover:text-lm-ink-strong/60 hover:bg-lm-line/20'}`}
                >
                  <span className="text-sm">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile: centered title */}
        <div className="flex md:hidden flex-1 flex-col items-center">
          <Link href="/">
            <span className="text-lg font-bold text-gradient font-serif-cn">珍藏回忆</span>
          </Link>
          <span className="text-[8px] text-lm-accent tracking-[0.3em] uppercase font-display">OUR STORY</span>
        </div>

        {/* Desktop: spacer */}
        <div className="hidden md:block flex-1" />

        {/* Right: date + auth */}
        <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-[9px] font-bold tracking-[0.2em] text-lm-accent uppercase font-display">TODAY</span>
            <span suppressHydrationWarning className="text-xs font-semibold text-lm-ink">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button suppressHydrationWarning onClick={onPin} className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all ${isAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-lm-accent/20 text-lm-body/50 hover:bg-amber-50 hover:border-lm-clay/30'}`}>
            {isAuthenticated ? '🔓' : '🔒'}
          </button>
          {onSettings && (
            <button onClick={onSettings} className="w-8 h-8 rounded-full bg-white border border-lm-accent/20 flex items-center justify-center text-sm hover:bg-amber-50 hover:border-lm-clay/30 transition-all">⚙</button>
          )}
        </div>
      </div>
    </nav>
  );
}
