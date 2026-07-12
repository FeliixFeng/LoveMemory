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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#fdfbf7]/90 backdrop-blur-sm border-t border-[#efd8c3]/30">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${active ? 'text-[#aa6f4d]' : 'text-[#5c3d2a]/40'}`}
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
