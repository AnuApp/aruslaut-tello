// ═══════════════════════════════════════════════
//  ArusLaut — Service Worker (offline support)
//  Letakkan file ini di root GitHub repository
//  bersama index.html
// ═══════════════════════════════════════════════

const CACHE_NAME = 'aruslaut-v1';

// Semua aset yang di-cache saat install
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;600;700&display=swap'
];

// ── INSTALL: cache semua aset utama ──────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: hapus cache lama ────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first, fallback network ──────────
self.addEventListener('fetch', e => {
  // Hanya handle GET request
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      // Tidak ada di cache → ambil dari network, lalu simpan
      return fetch(e.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => {
          // Offline & tidak ada cache → kembalikan index.html
          return caches.match('./index.html');
        });
    })
  );
});
