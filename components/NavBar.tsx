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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/90 border-b border-[#efd8c3]/30 px-4 py-2">
      <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto flex justify-between items-center">
        {/* Left: Date */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#aa6f4d] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TODAY</span>
          <span suppressHydrationWarning className="text-sm font-semibold text-[#3d281c]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        {/* Center: Title (mobile) / Nav links (desktop) */}
        <div className="flex flex-col items-center">
          <Link href="/" className="md:hidden">
            <span className="text-lg font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
          </Link>
          <span className="text-[8px] text-[#aa6f4d] tracking-[0.3em] uppercase md:hidden" style={{ fontFamily: 'Playfair Display, serif' }}>OUR STORY</span>
          <div className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${active ? 'bg-[#aa6f4d]/10 text-[#aa6f4d] font-semibold' : 'text-[#5c3d2a]/40 hover:text-[#5c3d2a]/60 hover:bg-[#efd8c3]/20'}`}
                >
                  <span className="text-sm">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Auth + Settings */}
        <div className="flex gap-2">
          <button suppressHydrationWarning onClick={onPin} className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors ${isAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-[#efd8c3] text-[#5c3d2a]/50 hover:bg-amber-50'}`}>
            {isAuthenticated ? '🔓' : '🔒'}
          </button>
          {onSettings && (
            <button onClick={onSettings} className="w-8 h-8 rounded-full bg-white border border-[#efd8c3] flex items-center justify-center text-sm hover:bg-amber-50">⚙</button>
          )}
        </div>
      </div>
    </nav>
  );
}
