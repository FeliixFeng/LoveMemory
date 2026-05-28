import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoveMemory | 珍藏回忆',
  description: 'A warm memory space for couples.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(rs) {
              rs.forEach(function(r) { r.unregister(); });
            });
            caches && caches.keys && caches.keys().then(function(ks) {
              ks.forEach(function(k) { caches.delete(k); });
            });
          }
        `}} />
      </body>
    </html>
  );
}
