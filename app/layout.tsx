import type { Metadata, Viewport } from 'next';
import './globals.css';

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
  themeColor: '#d48b60'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
