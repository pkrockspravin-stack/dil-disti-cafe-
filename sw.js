// Dil Dosti Cafe – offline shell. Live data always comes from Firebase.
const CACHE = 'ddc-sync-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never cache Firebase database traffic
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('firebasedatabase.app')) return;
  const sameOrigin = url.origin === location.origin;
  const isLib = url.hostname === 'www.gstatic.com' || url.hostname.includes('fonts.g');
  if (!sameOrigin && !isLib) return;
  // app page: network first (so updates arrive), cache as fallback
  if (sameOrigin) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Firebase library and fonts: cache first
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })));
});
