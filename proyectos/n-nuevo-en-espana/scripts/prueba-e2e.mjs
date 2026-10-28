// Prueba de punta a punta contra `next start` (http://localhost:3000) + Stripe simulado (scripts/stripe-simulado.mjs)
// + Postgres. Uso: ver README, sección «Pruebas». Sale con código 1 si algo falla.
import crypto from "node:crypto";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const B = "http://localhost:3000";
const SIM = "http://localhost:12111";
const db = new PrismaClient();
const stripe = new Stripe("sk_test_simulado");
let fallos = 0;
const ok = (cond, txt) => { console.log(`${cond ? "✔" : "✘"} ${txt}`); if (!cond) fallos++; };

function firmar(datos, seg) {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, exp: Math.floor(Date.now() / 1000) + seg })).toString("base64url");
  return `${cuerpo}.${crypto.createHmac("sha256", process.env.SECRETO_SESION).update(cuerpo).digest("base64url")}`;
}
function cliente() {
  let cookie = "";
  return async (ruta, opts = {}) => {
    const r = await fetch(B + ruta, { redirect: "manual", ...opts, headers: { ...(opts.headers ?? {}), cookie } });
    const sc = r.headers.get("set-cookie");
    if (sc) cookie = sc.split(";")[0];
    return r;
  };
}
async function webhook(tipo, objeto) {
  const ev = { id: `evt_${crypto.randomBytes(6).toString("hex")}`, object: "event", type: tipo, data: { object: objeto } };
  const cuerpo = JSON.stringify(ev);
  const firma = stripe.webhooks.generateTestHeaderString({ payload: cuerpo, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const r = await fetch(`${B}/api/stripe/webhook`, { method: "POST", body: cuerpo, headers: { "stripe-signature": firma, "content-type": "application/json" } });
  return { r, ev, cuerpo, firma };
}
const post = (c, ruta, body) => c(ruta, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

await db.aviso.deleteMany(); await db.recordatorio.deleteMany(); await db.usuario.deleteMany(); await db.eventoStripe.deleteMany();

// 1. Idioma y páginas públicas
let r = await fetch(`${B}/`, { redirect: "manual", headers: { "accept-language": "ar-MA,ar;q=0.9" } });
ok(r.status === 307 && r.headers.get("location").endsWith("/ar"), "/ redirige a /ar con navegador en árabe");
r = await fetch(`${B}/ar`); let html = await r.text();
ok(r.ok && html.includes('dir="rtl"') && html.includes('lang="ar"'), "/ar se sirve de derecha a izquierda");
const gratis = (await import("../content/es/es/guias/empadronamiento.json", { with: { type: "json" } })).default;
const pago = (await import("../content/es/es/guias/renovacion-residencia.json", { with: { type: "json" } })).default;
html = await (await fetch(`${B}/es/guias/empadronamiento`)).text();
ok(html.includes(gratis.pasos[2].titulo.replace(/"/g, "&quot;")) && html.includes(gratis.checklist[0].texto.slice(0, 20)), "La guía gratis se ve completa en el HTML");
html = await (await fetch(`${B}/es/guias/renovacion-residencia`)).text();
ok(html.includes(pago.titulo) && !html.includes(pago.pasos[1].texto.slice(0, 40)), "La guía de pago muestra el resumen y NO el paso a paso en el HTML");
for (const ruta of ["/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/sw.js", "/es/precios", "/zh/guias/nacionalidad", "/es/legal/condiciones", "/es/preguntas"]) {
  r = await fetch(B + ruta); ok(r.ok, `GET ${ruta} → ${r.status}`);
}

// 2. Muro de pago y recordatorios sin sesión
const anon = cliente();
r = await anon("/api/guia?slug=renovacion-residencia&idioma=es"); ok(r.status === 401, "API de guía de pago sin sesión → 401");
r = await anon("/api/guia?slug=empadronamiento&idioma=fr"); ok(r.status === 200, "API de guía gratis sin sesión → 200");
r = await post(anon, "/api/recordatorio", { email: "ana@example.com", fecha: "2026-11-02", guia: "empadronamiento", idioma: "es", consentimiento: true });
ok(r.status === 200, "Recordatorio de la guía gratis sin sesión → 200");
r = await post(anon, "/api/recordatorio", { email: "ana@example.com", fecha: "2027-05-10", guia: "renovacion-residencia", idioma: "es", consentimiento: true });
ok(r.status === 402, "Recordatorio de guía de pago sin sesión → 402");
r = await post(anon, "/api/recordatorio", { email: "ana@example.com", fecha: "2027-05-10", guia: "empadronamiento", idioma: "es", consentimiento: false });
ok(r.status === 400, "Recordatorio sin consentimiento → 400");

// 3. Suscripción: checkout → pago → webhook → acceso
const c = cliente();
r = await post(c, "/api/checkout", { plan: "suscripcion", idioma: "ar", desistimiento: false, condiciones: true });
ok(r.status === 400, "Checkout sin consentimiento de desistimiento → 400");
r = await post(c, "/api/checkout", { plan: "suscripcion", idioma: "ar", desistimiento: true, condiciones: true });
const { url } = await r.json();
const csId = url.split("/").pop();
ok(r.ok && csId.startsWith("cs_test"), "Checkout de suscripción crea sesión de Stripe");
let sesion = await (await fetch(`${SIM}/__pagar/${csId}`, { method: "POST", body: "email=Karim%40Example.com", headers: { authorization: "Bearer sk_test_simulado", "content-type": "application/x-www-form-urlencoded" } })).json();
const w1 = await webhook("checkout.session.completed", sesion);
ok(w1.r.ok, "Webhook checkout.session.completed firmado → 200");
const rep = await fetch(`${B}/api/stripe/webhook`, { method: "POST", body: w1.cuerpo, headers: { "stripe-signature": w1.firma } });
ok((await rep.json()).repetido === true, "El mismo evento repetido no se procesa dos veces");
const mala = await fetch(`${B}/api/stripe/webhook`, { method: "POST", body: w1.cuerpo, headers: { "stripe-signature": "t=1,v1=falsa" } });
ok(mala.status === 400, "Webhook con firma falsa → 400");
let u = await db.usuario.findUnique({ where: { email: "karim@example.com" } });
ok(u?.plan === "suscripcion" && u.accesoHasta > new Date(Date.now() + 28 * 864e5) && u.idioma === "ar", "Usuario creado con suscripción, ~1 mes de acceso e idioma árabe");
r = await c(`/api/acceso/stripe?session_id=${csId}`); ok(r.ok, "Vuelta de Stripe abre sesión en el dispositivo");
r = await c("/api/guia?slug=renovacion-residencia&idioma=ar"); const gj = await r.json();
ok(r.ok && gj.guia.pasos.length === pago.pasos.length, `Con sesión, la guía de pago llega completa (idioma ${gj.idiomaContenido})`);
html = await (await c("/ar/cuenta")).text(); ok(html.includes("karim@example.com"), "Mi cuenta muestra el correo");

// 4. Recordatorio de guía de pago: crear, confirmar, cron
const enDias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
r = await post(c, "/api/recordatorio", { email: "karim@example.com", fecha: enDias(70), guia: "renovacion-residencia", idioma: "ar", consentimiento: true });
ok(r.ok, "Recordatorio de guía de pago con sesión → 200");
const rec = await db.recordatorio.findFirst({ where: { guia: "renovacion-residencia" }, include: { avisos: true } });
ok(rec && !rec.confirmado && rec.avisos.length === pago.recordatorio.avisos.filter((a) => a.dias + 70 >= 0).length, `Avisos calculados a partir de la fecha (${rec?.avisos.length})`);
r = await fetch(`${B}/api/recordatorio/confirmar?t=${encodeURIComponent(firmar({ r: rec.id, t: "c" }, 600))}`, { redirect: "manual" });
ok(r.status === 307 && (await db.recordatorio.findUnique({ where: { id: rec.id } })).confirmado, "Enlace del correo confirma el recordatorio");
await db.aviso.update({ where: { id: rec.avisos[0].id }, data: { fecha: new Date(Date.now() - 3600e3) } });
r = await fetch(`${B}/api/cron/recordatorios`); ok(r.status === 401, "Cron sin secreto → 401");
r = await fetch(`${B}/api/cron/recordatorios`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
const cron = await r.json(); ok(cron.enviados === 1, `Cron envía los avisos que tocan (${JSON.stringify(cron)})`);
r = await fetch(`${B}/api/cron/recordatorios`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
ok((await r.json()).enviados === 0, "Un aviso enviado no se repite");
r = await fetch(`${B}/api/recordatorio/baja?t=${encodeURIComponent(firmar({ r: rec.id, t: "b" }, 600))}`, { redirect: "manual" });
ok(r.status === 307 && !(await db.recordatorio.findUnique({ where: { id: rec.id } })), "Baja en un clic borra el recordatorio");

// 5. Renovación mensual, cancelación y fin de acceso
const fin = Math.floor(Date.now() / 1000) + 60 * 864e2;
await webhook("invoice.paid", { object: "invoice", customer: sesion.customer, lines: { data: [{ period: { start: 0, end: fin } }] } });
u = await db.usuario.findUnique({ where: { email: "karim@example.com" } });
ok(Math.abs(u.accesoHasta.getTime() / 1000 - (fin + 2 * 86400)) < 5, "invoice.paid amplía el acceso al final del periodo");
r = await c("/api/cuenta/cancelar", { method: "POST" }); ok(r.ok, "Cancelar suscripción desde Mi cuenta → 200");
await webhook("customer.subscription.deleted", { object: "subscription", id: sesion.subscription, ended_at: Math.floor(Date.now() / 1000) - 1 });
r = await c("/api/guia?slug=renovacion-residencia&idioma=ar"); ok(r.status === 401, "Al terminar la suscripción se cierra el acceso");

// 6. Pack de 12 meses (sin webhook: lo concede la página de gracias)
const c2 = cliente();
r = await post(c2, "/api/checkout", { plan: "pack", idioma: "fr", desistimiento: true, condiciones: true });
const cs2 = (await r.json()).url.split("/").pop();
r = await c2(`/api/acceso/stripe?session_id=${cs2}`); ok(r.status === 202, "Antes de pagar, la página de gracias no da acceso");
await fetch(`${SIM}/__pagar/${cs2}`, { method: "POST", body: "email=awa%40example.com", headers: { authorization: "Bearer sk_test_simulado", "content-type": "application/x-www-form-urlencoded" } });
r = await c2(`/api/acceso/stripe?session_id=${cs2}`); ok(r.ok, "Tras pagar el pack, la página de gracias da acceso aunque el webhook no haya llegado");
u = await db.usuario.findUnique({ where: { email: "awa@example.com" } });
ok(u.plan === "pack" && u.accesoHasta > new Date(Date.now() + 360 * 864e5), "Pack: 12 meses de acceso");
r = await c2("/api/guia?slug=nacionalidad&idioma=fr"); ok(r.ok, "Pack: guía de pago accesible");

// 7. Enlace mágico en otro dispositivo
const c3 = cliente();
r = await post(c3, "/api/acceso", { email: "awa@example.com", idioma: "fr" }); ok(r.ok, "Pedir enlace de acceso → 200");
r = await post(c3, "/api/acceso", { email: "nadie@example.com", idioma: "fr" }); ok(r.ok, "Correo sin cuenta responde igual (no revela usuarios)");
r = await c3(`/api/acceso/verificar?t=${encodeURIComponent(firmar({ email: "awa@example.com", t: "m" }, 600))}&i=fr`);
ok(r.status === 307 && r.headers.get("location").endsWith("/fr/cuenta"), "Enlace mágico abre sesión");
r = await c3("/api/guia?slug=carnet-conducir&idioma=fr"); ok(r.ok, "Segundo dispositivo con acceso");
r = await c3(`/api/acceso/verificar?t=${encodeURIComponent(firmar({ email: "awa@example.com", t: "s" }, 600))}`);
ok(r.headers.get("location")?.includes("caducado"), "Un token de otro tipo no sirve como enlace mágico");

await db.$disconnect();
console.log(fallos ? `\n${fallos} FALLOS` : "\nTodo correcto");
process.exit(fallos ? 1 : 0);
