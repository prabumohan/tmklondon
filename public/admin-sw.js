/**
 * Minimal service worker for /admin PWA install (Chrome).
 * Network-first: no offline shell; API calls always go to the network.
 */
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
