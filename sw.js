/*
 * THE DRAGON CIRCLE — minimal Service Worker
 * Goals:
 *   1. Be installable on Android Chrome (presence of a SW with fetch handler is required).
 *   2. Provide a graceful offline fallback for navigation requests (returns /app.html).
 *   3. Avoid aggressive caching so future site updates deploy cleanly.
 */

const CACHE_VERSION = 'tdc-shell-v5';
const APP_SHELL = [
  '/app.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/TDC.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Don't fail install if any single optional asset is missing.
        return Promise.all(
          APP_SHELL.map((url) =>
            cache.add(url).catch(() => undefined)
          )
        );
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(req, copy).catch(() => {});
          });
          return response;
        })
        .catch(() =>
          caches.match(req).then(
            (cached) => cached || caches.match('/app.html')
          )
        )
    );
    return;
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(req, copy).catch(() => {});
            });
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
