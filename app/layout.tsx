import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { THEME } from './lib/theme';

// Playfair Display 自托管（latin 子集），中文衬线走系统兜底（Songti SC）。
// 不要改回 fonts.googleapis.com——国内加载失败会阻塞首屏（2026-10-20 移除）。
const playfairDisplay = localFont({
  src: [
    { path: './fonts/PlayfairDisplay-latin.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/PlayfairDisplay-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

export const metadata: Metadata = {
  title: 'LoveMemory | 珍藏回忆',
  description: '用爱记录时光',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '珍藏回忆'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEME.accent
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={playfairDisplay.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          // 开发模式：清除 Service Worker 缓存 + 禁用浏览器缓存
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) { reg.unregister(); });
            });
            caches.keys().then(function(names) {
              names.forEach(function(name) { caches.delete(name); });
            });
          }
          // 生产模式：注册 Service Worker
          if ('serviceWorker' in navigator && location.protocol === 'https:') {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
