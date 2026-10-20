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
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-lm-bg/90 backdrop-blur-sm border-t border-lm-accent/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href === '/wishes' && pathname === '/capsule');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${active ? 'text-lm-accent' : 'text-lm-ink-strong/40'}`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="text-[10px] leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
