'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/album', label: '相册', icon: '📷' },
  { href: '/wishes', label: '愿望', icon: '💝' },
  { href: '/capsule', label: '胶囊', icon: '⏰' },
  { href: '/more', label: '更多', icon: '⋯' },
];

export function NavBar({ isAuthenticated, onSettings, onPin }: { isAuthenticated: boolean; onSettings?: () => void; onPin?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/80 backdrop-blur-md border-b border-[#efd8c3]/20">
      <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto flex justify-between items-center px-4 py-2.5">
        {/* Left: Logo + Date */}
        <div className="flex items-center gap-3">
          <Link href="/" className="hidden md:block">
            <span className="text-base font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
          </Link>
          <div className="hidden md:block w-px h-4 bg-[#efd8c3]/40" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[0.2em] text-[#aa6f4d] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TODAY</span>
            <span suppressHydrationWarning className="text-xs font-semibold text-[#3d281c]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Center: Nav links (desktop) / Title (mobile) */}
        <div className="flex flex-col items-center">
          <Link href="/" className="md:hidden">
            <span className="text-lg font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
          </Link>
          <span className="text-[8px] text-[#aa6f4d] tracking-[0.3em] uppercase md:hidden" style={{ fontFamily: 'Playfair Display, serif' }}>OUR STORY</span>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${active ? 'text-[#aa6f4d] font-semibold' : 'text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60'}`}
                >
                  <span className="text-sm">{link.icon}</span>
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#aa6f4d] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Auth + Settings */}
        <div className="flex items-center gap-2">
          <button suppressHydrationWarning onClick={onPin} className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all ${isAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-[#efd8c3] text-[#5c3d2a]/50 hover:bg-amber-50 hover:border-[#d48b60]/30'}`}>
            {isAuthenticated ? '🔓' : '🔒'}
          </button>
          {onSettings && (
            <button onClick={onSettings} className="w-8 h-8 rounded-full bg-white border border-[#efd8c3] flex items-center justify-center text-sm hover:bg-amber-50 hover:border-[#d48b60]/30 transition-all">⚙</button>
          )}
        </div>
      </div>
    </nav>
  );
}
