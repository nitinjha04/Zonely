// Basic service worker for Zonely
const CACHE_NAME = 'zonely-cache-v1';
const CORE_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if(request.method !== 'GET') return;
  // Network-first for navigation & dynamic, cache-first for static
  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c=> c.put(request, copy));
        return resp;
      }).catch(()=> caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => {
      if(cached) return cached;
      return fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c=> c.put(request, copy));
        return resp;
      }).catch(()=> cached)
    })
  );
});
