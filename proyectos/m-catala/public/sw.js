// Service worker mínim: l'app s'instal·la i les pàgines visitades funcionen sense connexió.
// No es guarden respostes privades: res de /api/* (el banc viu al localStorage del client) ni les pàgines del compte.
// En tancar sessió el client envia {tipus:'buidar'} i es buida tota la memòria cau (dispositius compartits).
const CACHE = 'aprova-v2';
const PRIVAT = /^\/(ca|es)\/(compte|entrar|validesa)(\/|$)/;
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/ca', '/es', '/ca/avui']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', (e) => { if (e.data && e.data.tipus === 'buidar') e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k))))); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/')) return; // mai a la memòria cau: respostes privades (banc premium, sessió, quotes)
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); } return res; })));
    return;
  }
  if (r.mode === 'navigate') {
    if (PRIVAT.test(u.pathname)) return; // pàgines amb dades personals: sempre xarxa, mai guardades
    e.respondWith(fetch(r).then((res) => { if (res.ok && !res.redirected) { const c = res.clone(); caches.open(CACHE).then((k) => k.put(r, c)); } return res; }).catch(() => caches.match(r).then((m) => m || caches.match(u.pathname.startsWith('/es/') ? '/es' : '/ca/avui'))));
  }
});
