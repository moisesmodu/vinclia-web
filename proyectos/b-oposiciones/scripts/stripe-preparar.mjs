#!/usr/bin/env node
// Prepara Stripe (cuenta Numi Mates) por API, de forma idempotente (DESPLIEGUES.md §2):
//   - un producto por plan "Cartera · Oposiciones · <Plan>" con metadata.proyecto = b-oposiciones
//   - su precio recurrente con lookup_key b-oposiciones_<pais>_<plan>_<importe> (IVA incluido)
//   - el webhook <URL>/api/stripe/webhook con los eventos que usa la app
// Uso: STRIPE_TEST_SECRET_KEY=sk_test_… node scripts/stripe-preparar.mjs https://placa-oposicions.vercel.app
//      (para producción: STRIPE_MODO=real STRIPE_SECRET_KEY=rk_live_…)
// Imprime al final la línea STRIPE_WEBHOOK_SECRET=… para guardarla en Vercel.
import fs from 'node:fs';
import Stripe from 'stripe';

const pais = JSON.parse(fs.readFileSync(new URL('../config/paises/es.json', import.meta.url)));
const marca = JSON.parse(fs.readFileSync(new URL('../config/marca.json', import.meta.url)));
const clave = process.env.STRIPE_MODO === 'real' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const url = (process.argv[2] || '').replace(/\/$/, '');
if (!clave || !url) { console.error('Uso: STRIPE_TEST_SECRET_KEY=… node scripts/stripe-preparar.mjs <URL pública>'); process.exit(2); }
const host = process.env.STRIPE_API_HOST;
// Detrás del proxy de las sesiones en la nube: cliente HTTP basado en fetch, que con NODE_USE_ENV_PROXY=1 usa HTTPS_PROXY.
const viaProxy = !host && process.env.HTTPS_PROXY ? { httpClient: Stripe.createFetchHttpClient() } : {};
if (viaProxy.httpClient && !process.env.NODE_USE_ENV_PROXY) { console.error('Ejecuta con NODE_USE_ENV_PROXY=1 (sesión con proxy).'); process.exit(2); }
const s = new Stripe(clave, host ? { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: 'http' } : viaProxy);
const NOMBRE = { mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' };

for (const p of pais.planes.filter((x) => x.activo)) {
  const lookup = `b-oposiciones_${pais.codigo}_${p.id}_${p.importe}`;
  const ya = (await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0];
  if (ya && ya.lookup_key === lookup) { console.log(`precio ${p.id}: ya existe (${ya.id})`); continue; }
  let producto;
  try { producto = (await s.products.search({ query: `metadata['proyecto']:'b-oposiciones' AND metadata['plan']:'${p.id}' AND active:'true'`, limit: 1 })).data[0]?.id; } catch {}
  if (!producto) producto = (await s.products.create({ name: `Cartera · Oposiciones · ${NOMBRE[p.id] ?? p.id}`, metadata: { proyecto: 'b-oposiciones', plan: p.id, marca: marca.nombre } })).id;
  const precio = await s.prices.create({
    product: producto, currency: pais.moneda.toLowerCase(), unit_amount: p.importe, tax_behavior: 'inclusive',
    recurring: { interval: p.intervalo, interval_count: p.intervaloCantidad }, lookup_key: lookup, metadata: { proyecto: 'b-oposiciones', plan: p.id },
  });
  console.log(`precio ${p.id}: creado ${precio.id} (${p.importe / 100} €)`);
}

const destino = `${url}/api/stripe/webhook`;
const eventos = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'];
// El secreto solo se puede leer al crear el webhook: si ya existía uno para esta URL, se sustituye.
for (const w of (await s.webhookEndpoints.list({ limit: 100 })).data) if (w.url === destino) { await s.webhookEndpoints.del(w.id); console.log(`webhook anterior ${w.id} sustituido`); }
const w = await s.webhookEndpoints.create({ url: destino, enabled_events: eventos, metadata: { proyecto: 'b-oposiciones' }, description: 'Cartera · Oposiciones' });
console.log(`webhook: ${w.id} → ${destino}`);
if (w.secret) console.log(`STRIPE_WEBHOOK_SECRET=${w.secret}`);
else console.log('Aviso: Stripe no ha devuelto el secreto (pasa con simuladores). Sin él la app funciona igual: se sincroniza al volver de Checkout y cada 12 h.');
