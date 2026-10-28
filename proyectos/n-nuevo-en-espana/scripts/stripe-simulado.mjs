// Simulador mínimo y con estado de la API de Stripe, SOLO para pruebas locales sin red.
// Implementa lo que usa la app: crear y leer sesiones de Checkout, y cancelar suscripciones.
// Además: POST /__pagar/:id marca una sesión como pagada (lo que haría la persona en la página de Stripe).
import http from "node:http";
import crypto from "node:crypto";

const sesiones = new Map();
const subs = new Map();
const id = (p) => `${p}_${crypto.randomBytes(8).toString("hex")}`;

function leerCuerpo(req) {
  return new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(new URLSearchParams(b))); });
}
function aObjeto(params) {
  // Convierte a[b][c]=x en objetos anidados.
  const o = {};
  for (const [k, v] of params) {
    const partes = k.replace(/\]/g, "").split("[");
    let cur = o;
    partes.forEach((p, i) => { if (i === partes.length - 1) cur[p] = v; else cur = cur[p] ??= {}; });
  }
  return o;
}
const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!(req.headers.authorization ?? "").startsWith("Bearer sk_test_")) return json(res, 401, { error: { message: "clave no válida" } });
  if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
    const b = aObjeto(await leerCuerpo(req));
    const s = {
      id: id("cs_test"), object: "checkout.session", mode: b.mode, status: "open", payment_status: "unpaid",
      created: Math.floor(Date.now() / 1000), customer: null, subscription: null, customer_email: b.customer_email ?? null,
      customer_details: null, metadata: b.metadata ?? {}, line_items: b.line_items, success_url: b.success_url,
      url: `http://localhost:12111/pagar/${"x"}`
    };
    s.url = `http://localhost:12111/pagina-pago/${s.id}`;
    sesiones.set(s.id, s);
    return json(res, 200, s);
  }
  let m = url.pathname.match(/^\/v1\/checkout\/sessions\/([\w]+)$/);
  if (req.method === "GET" && m) return sesiones.has(m[1]) ? json(res, 200, sesiones.get(m[1])) : json(res, 404, { error: { message: "no existe" } });
  m = url.pathname.match(/^\/__pagar\/([\w]+)$/);
  if (req.method === "POST" && m) {
    const s = sesiones.get(m[1]);
    const b = aObjeto(await leerCuerpo(req));
    s.status = "complete"; s.payment_status = "paid"; s.customer = id("cus_test");
    s.customer_details = { email: b.email ?? s.customer_email };
    if (s.mode === "subscription") { s.subscription = id("sub_test"); subs.set(s.subscription, { id: s.subscription, object: "subscription", customer: s.customer, cancel_at_period_end: false, status: "active" }); }
    return json(res, 200, s);
  }
  m = url.pathname.match(/^\/v1\/subscriptions\/([\w]+)$/);
  if (req.method === "POST" && m) {
    const s = subs.get(m[1]); if (!s) return json(res, 404, { error: { message: "no existe" } });
    Object.assign(s, { cancel_at_period_end: (await leerCuerpo(req)).get("cancel_at_period_end") === "true" });
    return json(res, 200, s);
  }
  json(res, 404, { error: { message: `no simulado: ${req.method} ${url.pathname}` } });
}).listen(12111, () => console.log("Stripe simulado en http://localhost:12111"));
