#!/usr/bin/env node
// Prepara Stripe (compte Numi Mates) per API, de manera idempotent (DESPLIEGUES.md §2):
//   - productes "Cartera · Català · <Pla>" amb metadata.proyecto = m-catala; preus amb lookup_key m-catala_<pais>_<pla>_<import>
//   - mensual i anual recurrents (l'anual amb 7 dies de prova la posa Checkout), passi de convocatòria com a preu únic
//   - el webhook <URL>/api/stripe/webhook
// Ús: NODE_USE_ENV_PROXY=1 STRIPE_TEST_SECRET_KEY=sk_test_… node scripts/stripe-preparar.mjs https://aprova-catala.vercel.app
import fs from 'node:fs';
import Stripe from 'stripe';

const pais = JSON.parse(fs.readFileSync(new URL('../config/paises/es.json', import.meta.url)));
const marca = JSON.parse(fs.readFileSync(new URL('../config/marca.json', import.meta.url)));
const clave = process.env.STRIPE_MODO === 'real' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const url = (process.argv[2] || '').replace(/\/$/, '');
if (!clave || !url) { console.error('Ús: STRIPE_TEST_SECRET_KEY=… node scripts/stripe-preparar.mjs <URL pública>'); process.exit(2); }
const host = process.env.STRIPE_API_HOST;
const viaProxy = !host && process.env.HTTPS_PROXY ? { httpClient: Stripe.createFetchHttpClient() } : {};
if (viaProxy.httpClient && !process.env.NODE_USE_ENV_PROXY) { console.error('Executa amb NODE_USE_ENV_PROXY=1 (sessió amb proxy).'); process.exit(2); }
const s = new Stripe(clave, host ? { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: 'http' } : viaProxy);
const NOM = { mensual: 'Mensual', anual: 'Anual', pase: 'Passi de convocatòria', revisio: 'Revisió humana' };
const PROYECTO = 'm-catala';

for (const p of pais.planes.filter((x) => x.activo)) {
  const lookup = `${PROYECTO}_${pais.codigo}_${p.id}_${p.importe}`;
  const ya = (await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0];
  if (ya && ya.lookup_key === lookup) { console.log(`preu ${p.id}: ja existeix (${ya.id})`); continue; }
  let producto;
  try { producto = (await s.products.search({ query: `metadata['proyecto']:'${PROYECTO}' AND metadata['plan']:'${p.id}' AND active:'true'`, limit: 1 })).data[0]?.id; } catch {}
  if (!producto) producto = (await s.products.create({ name: `Cartera · Català · ${NOM[p.id] ?? p.id}`, metadata: { proyecto: PROYECTO, plan: p.id, marca: marca.nombre } })).id;
  const base = { product: producto, currency: pais.moneda.toLowerCase(), unit_amount: p.importe, tax_behavior: 'inclusive', lookup_key: lookup, metadata: { proyecto: PROYECTO, plan: p.id } };
  if (p.tipo === 'subscripcio') base.recurring = { interval: p.intervalo, interval_count: p.intervaloCantidad };
  const precio = await s.prices.create(base);
  console.log(`preu ${p.id}: creat ${precio.id} (${p.importe / 100} €${p.tipo === 'unic' ? ', únic' : ''})`);
}

const destino = `${url}/api/stripe/webhook`;
const eventos = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'];
for (const w of (await s.webhookEndpoints.list({ limit: 100 })).data) if (w.url === destino) { await s.webhookEndpoints.del(w.id); console.log(`webhook anterior ${w.id} substituït`); }
const w = await s.webhookEndpoints.create({ url: destino, enabled_events: eventos, metadata: { proyecto: PROYECTO }, description: 'Cartera · Català' });
console.log(`webhook: ${w.id} → ${destino}`);
if (w.secret) console.log(`STRIPE_WEBHOOK_SECRET=${w.secret}`);
