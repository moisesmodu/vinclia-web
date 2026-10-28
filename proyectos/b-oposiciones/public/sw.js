// Service worker mínimo: la app se instala y las páginas visitadas funcionan sin conexión.
const CACHE = 'aprova-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/ca', '/es']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/preguntas')) {
    // Red primero; si no hay conexión, la última copia (para practicar sin cobertura).
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); return res; }).catch(() => caches.match(r)));
    return;
  }
  if (u.pathname.startsWith('/api/')) return;
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); return res; })));
    return;
  }
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); return res; }).catch(() => caches.match(r).then((m) => m || caches.match('/ca'))));
  }
});
