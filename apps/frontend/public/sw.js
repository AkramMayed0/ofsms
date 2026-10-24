/**
 * sw.js — OFSMS Service Worker for Offline PWA Support
 * Caches static assets, app shell, and handles offline page loading.
 */

const CACHE_NAME = 'ofsms-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/ikram-logo.png',
  '/favicon.ico',
];

// ── Install Event: Pre-cache core shell ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching some assets failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate Event: Clean up old caches ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch Event: Network-first for pages, Cache-first for static assets ───────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API/backend requests (handled by application offline layer)
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  // Next.js static assets (_next/static, images, fonts) → Cache-first
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages) → Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // If offline, attempt to serve the cached page
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to cached root/app shell
          return caches.match('/');
        })
    );
  }
});
