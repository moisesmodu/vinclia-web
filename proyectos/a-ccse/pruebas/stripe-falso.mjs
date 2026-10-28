// Doble local de la API de Stripe con los 5 endpoints que usa la app. Solo para pruebas (la red del entorno no llega a api.stripe.com).
import http from 'node:http';
const sesiones = new Map();
const webhooks = [];
let n = 0;
const leer = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(new URLSearchParams(b))); });
export function arrancar(puerto = 12111) {
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const json = (o, s = 200) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (!String(req.headers.authorization || '').includes('sk_test_')) return json({ error: { message: 'clave' } }, 401);
    const f = await leer(req);
    if (req.method === 'POST' && u.pathname === '/v1/checkout/sessions') {
      for (const k of ['mode', 'success_url', 'cancel_url', 'line_items[0][price_data][unit_amount]', 'line_items[0][price_data][currency]', 'client_reference_id'])
        if (!f.get(k)) return json({ error: { message: `falta ${k}` } }, 400);
      const id = `cs_test_falso${++n}`;
      const s = { id, object: 'checkout.session', url: `https://checkout.stripe.com/c/pay/${id}`, mode: f.get('mode'), payment_status: 'unpaid',
        client_reference_id: f.get('client_reference_id'), metadata: { usuarioId: f.get('metadata[usuarioId]') }, amount_total: Number(f.get('line_items[0][price_data][unit_amount]')),
        currency: f.get('line_items[0][price_data][currency]'), livemode: false, success_url: f.get('success_url'), custom_text_ok: !!f.get('custom_text[submit][message]') };
      sesiones.set(id, s);
      return json(s);
    }
    const m = u.pathname.match(/^\/v1\/checkout\/sessions\/(cs_[\w]+)$/);
    if (req.method === 'GET' && m) return sesiones.has(m[1]) ? json(sesiones.get(m[1])) : json({ error: { message: 'no existe' } }, 404);
    if (req.method === 'POST' && u.pathname === '/__pagar') { const s = sesiones.get(f.get('id')); if (s) s.payment_status = 'paid'; return json(s ?? {}); }
    if (req.method === 'GET' && u.pathname === '/v1/webhook_endpoints') return json({ object: 'list', data: webhooks, has_more: false });
    if (req.method === 'POST' && u.pathname === '/v1/webhook_endpoints') { const w = { id: `we_${++n}`, url: f.get('url'), secret: 'whsec_falso_autocreado' }; webhooks.push(w); return json(w); }
    const d = u.pathname.match(/^\/v1\/webhook_endpoints\/(we_\w+)$/);
    if (req.method === 'DELETE' && d) { const i = webhooks.findIndex((w) => w.id === d[1]); if (i >= 0) webhooks.splice(i, 1); return json({ id: d[1], deleted: true }); }
    json({ error: { message: `no implementado ${req.method} ${u.pathname}` } }, 404);
  });
  return new Promise((r) => srv.listen(puerto, () => r({ srv, sesiones, webhooks })));
}
