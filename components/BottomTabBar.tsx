'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', icon: '🏠', label: '首页' },
  { href: '/album', icon: '📷', label: '相册' },
  { href: '/footprint', icon: '🗺️', label: '足迹' },
  { href: '/wishes', icon: '💝', label: '心愿' },
  { href: '/more', icon: '⋯', label: '更多' },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="lm-glass-bar-bottom fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href === '/wishes' && pathname === '/capsule');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-300 ${active ? 'text-lm-accent-deep' : 'text-lm-ink-strong/40'}`}
            >
              <span
                className={`flex items-center justify-center w-10 h-[26px] rounded-full transition-all duration-300 ${
                  active ? 'lm-glass-pill' : ''
                }`}
              >
                <span className={`text-base leading-none transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{tab.icon}</span>
              </span>
              <span className={`text-[10px] leading-none transition-all duration-300 ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
