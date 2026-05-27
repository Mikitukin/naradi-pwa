// Service Worker pro Nářadí App PWA
// Minimální implementace pro PWA install prompt

const CACHE_NAME = 'naradi-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests (no offline caching for now)
  event.respondWith(fetch(event.request));
});
