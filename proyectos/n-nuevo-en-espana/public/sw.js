// Service worker: las guías visitadas siguen disponibles sin conexión (como Integreat).
// Estrategia: red primero para páginas; si no hay red, la copia guardada. /api/ nunca se guarda salvo /api/guia.
const CACHE = "nee-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const guardable = req.mode === "navigate" || url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/iconos/") || url.pathname === "/api/guia";
  if (!guardable) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("/es")))
  );
});
