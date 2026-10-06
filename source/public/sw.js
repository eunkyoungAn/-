// Each GitHub Pages repository owns its own cache and scope.
const BASE = new URL('./', self.location.href);
const CACHE_PREFIX = 'career-catcher-' + BASE.pathname + '-shell-';
const CACHE = CACHE_PREFIX + 'v2';
const ASSETS = ['app.js','app.css','icon-192.png','icon-512.png'].map(name => new URL(name, BASE).href);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !ASSETS.includes(event.request.url)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
