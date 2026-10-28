// Service worker: la app funciona sin conexión con lo ya visitado. Red primero para páginas, caché primero para estáticos.
const V = 'ccse-v1';
const PRECACHE = ['/es', '/es/temas', '/es/simulacro', '/icons/icon-192.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith('/api/auth') || u.pathname.startsWith('/api/stripe')) return;
  const estatico = u.pathname.startsWith('/_next/static') || u.pathname.startsWith('/icons/');
  if (estatico) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((x) => x.put(r, c)); return res; })));
    return;
  }
  e.respondWith(
    fetch(r)
      .then((res) => { if (res.ok) { const c = res.clone(); caches.open(V).then((x) => x.put(r, c)); } return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match('/es'))),
  );
});
