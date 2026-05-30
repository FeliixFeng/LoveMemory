// Minimal PWA service worker - no aggressive caching
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  // Network only - no caching to avoid stale content issues
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
