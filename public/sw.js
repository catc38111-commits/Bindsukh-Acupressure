// Bindsukh Acupressure & Acupuncture Center - Progressive Web App Service Worker
// Fully compliant with PWABuilder Service Worker & Offline Capability specifications

const CACHE_NAME = 'bindsukh-pwa-v2';
const OFFLINE_URL = '/index.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bindsukh-logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.png',
  '/apple-touch-icon.png'
];

// 1. Install Event: Pre-cache offline page & core critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA ServiceWorker] Pre-cache warning:', err);
      });
    })
  );
});

// 2. Activate Event: Clean up legacy caches and immediately claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA ServiceWorker] Purging legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept network calls with Network-First (for navigations) and Cache-First (for assets)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip API routes and browser extensions
  if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting an image, return cached fallback if available
          if (request.destination === 'image') {
            return caches.match('/bindsukh-logo.png') || cachedResponse;
          }
          return cachedResponse;
        });
    })
  );
});
