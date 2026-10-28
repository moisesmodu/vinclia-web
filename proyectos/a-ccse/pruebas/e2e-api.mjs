// Prueba de punta a punta de la API: cuenta, progreso, muro de pago, Checkout, webhook firmado e idempotencia.
// Requiere: servidor de la app en BASE con STRIPE_API_BASE apuntando al doble local (lo arranca este script).
import Stripe from 'stripe';
import { arrancar } from './stripe-falso.mjs';
const BASE = process.env.BASE || 'http://localhost:3100';
const SECRETO = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_prueba_local';
const { sesiones } = await arrancar(12111);
let cookie = '';
let fallos = 0;
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FALLA'} ${m}`); if (!c) fallos++; };
async function api(ruta, opts = {}) {
  const r = await fetch(BASE + ruta, { ...opts, redirect: 'manual', headers: { 'Content-Type': 'application/json', cookie, ...(opts.headers || {}) } });
  const sc = r.headers.get('set-cookie'); if (sc && sc.includes('ccse_sesion=')) cookie = sc.split(';')[0];
  let d = null; try { d = await r.json(); } catch {}
  return { s: r.status, d };
}
const email = `prueba${Date.now()}@example.com`;

let r = await fetch(BASE + '/', { redirect: 'manual', headers: { 'accept-language': 'ar,fr;q=0.8' } });
ok(r.status === 307 && r.headers.get('location').endsWith('/ar'), 'redirige / al idioma del navegador (árabe)');
r = await fetch(BASE + '/es'); ok(r.status === 200 && (await r.text()).includes('300 preguntas oficiales'), 'portada /es responde 200');
r = await api('/api/banco?lengua=ar&ids=1001,1002'); ok(r.s === 200 && r.d.datos['1001'] && r.d.bloqueadas.includes(1002), 'sin acceso: 1001 gratis visible, 1002 bloqueada');
r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify({ email, clave: 'corta' }) }); ok(r.s === 400 && r.d.error === 'clave_corta', 'rechaza contraseña corta');
const progresoLocal = { v: 1, actualizado: 1000, preguntas: { 1001: { a: 1, f: 0, u: 1000, ultimaOk: true } }, simulacros: [] };
r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify({ email, clave: 'clave-segura-1', idioma: 'ro', progreso: progresoLocal }) });
ok(r.s === 200 && cookie, 'registro crea cuenta y sesión');
r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify({ email, clave: 'clave-segura-1' }) }); ok(r.s === 409, 'no duplica cuentas');
r = await api('/api/auth/yo'); ok(r.d.email === email && r.d.acceso === false, '/yo devuelve la cuenta sin acceso');
r = await api('/api/progreso'); ok(r.d.preguntas['1001']?.a === 1, 'el progreso local se guarda al registrarse');
r = await api('/api/progreso', { method: 'PUT', body: JSON.stringify({ v: 1, actualizado: 2000, preguntas: { 1002: { a: 0, f: 1, u: 2000, ultimaOk: false } }, simulacros: [{ fecha: 5, aciertos: 20, total: 25, segundos: 600 }] }) });
ok(r.d.preguntas['1001'] && r.d.preguntas['1002'] && r.d.simulacros.length === 1, 'el progreso se fusiona sin perder datos');
r = await api('/api/simulacro', { method: 'POST' }); ok(r.d.permitido === true, 'primer simulacro gratis permitido');
r = await api('/api/simulacro', { method: 'POST' }); ok(r.d.permitido === false, 'segundo simulacro sin pagar bloqueado');
r = await api('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ locale: 'ro' }) });
ok(r.s === 200 && r.d.url?.startsWith('https://checkout.stripe.com/'), 'crea sesión de Checkout');
const sesion = [...sesiones.values()].at(-1);
ok(sesion.amount_total === 999 && sesion.currency === 'eur' && sesion.custom_text_ok, 'Checkout: 9,99 €, EUR y aviso de desistimiento');
ok(sesion.success_url.includes('/ro/pago/ok?session_id={CHECKOUT_SESSION_ID}'), 'Checkout vuelve a la página de pago en el idioma');
r = await api(`/api/stripe/verificar?session_id=${sesion.id}`); ok(r.d.pagado === false && !r.d.ok, 'sin pagar no da acceso');
// Webhook firmado como lo firma Stripe
sesion.payment_status = 'paid';
const evento = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed', data: { object: sesion } });
const firma = Stripe.webhooks.generateTestHeaderString({ payload: evento, secret: SECRETO });
r = await api('/api/stripe/webhook', { method: 'POST', body: evento, headers: { 'stripe-signature': 'malo' } }); ok(r.s === 400, 'webhook con firma falsa rechazado');
r = await api('/api/stripe/webhook', { method: 'POST', body: evento, headers: { 'stripe-signature': firma } }); ok(r.s === 200, 'webhook firmado aceptado');
r = await api('/api/auth/yo'); const hasta1 = r.d.accesoHasta;
const dias = (new Date(hasta1) - Date.now()) / 86400000;
ok(r.d.acceso === true && dias > 89.9 && dias < 90.1, `acceso completo durante 90 días (${dias.toFixed(2)})`);
r = await api('/api/stripe/webhook', { method: 'POST', body: evento, headers: { 'stripe-signature': firma } });
r = await api(`/api/stripe/verificar?session_id=${sesion.id}`); ok(r.d.ok && r.d.accesoHasta === hasta1, 'webhook repetido y verificación son idempotentes');
r = await api('/api/banco?lengua=zh&ids=1002,5084'); ok(Object.keys(r.d.datos).length === 2 && r.d.bloqueadas.length === 0, 'con acceso: todas las explicaciones (chino)');
r = await api('/api/simulacro', { method: 'POST' }); ok(r.d.permitido === true, 'con acceso: simulacros ilimitados');
await api('/api/auth/salir', { method: 'POST' }); cookie = '';
r = await api('/api/auth/entrar', { method: 'POST', body: JSON.stringify({ email, clave: 'mala-clave-xx' }) }); ok(r.s === 401, 'contraseña incorrecta rechazada');
r = await api('/api/auth/entrar', { method: 'POST', body: JSON.stringify({ email, clave: 'clave-segura-1' }) }); ok(r.s === 200 && r.d.acceso === true, 'volver a entrar conserva el acceso');
r = await fetch(BASE + '/.well-known/assetlinks.json'); ok(r.status === 200 && Array.isArray(await r.json()), 'assetlinks.json responde');
r = await fetch(BASE + '/sitemap.xml'); const sm = await r.text(); ok(sm.includes('/es/preguntas/5084') && sm.includes('/ar/examen'), 'sitemap con preguntas e idiomas');
console.log(fallos ? `\n${fallos} prueba(s) fallida(s)` : '\nTodas las pruebas pasan');
process.exit(fallos ? 1 : 0);
