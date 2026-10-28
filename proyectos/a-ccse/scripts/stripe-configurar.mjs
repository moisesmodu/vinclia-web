// Configura Stripe (cuenta Numi Mates) para el proyecto A de forma idempotente: producto, precio y webhook.
// Uso: STRIPE_KEY=sk_test_... SITE_URL=https://ccse-en-tu-idioma.vercel.app node scripts/stripe-configurar.mjs
// Por la salida estándar solo sale el secreto del webhook (cuando lo crea), para pasarlo por tubería a `vercel env add`.
import Stripe from 'stripe';
import { readFileSync } from 'node:fs';
const PAIS = JSON.parse(readFileSync(new URL('../config/paises/es.json', import.meta.url), 'utf8'));
const clave = process.env.STRIPE_KEY;
const sitio = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!clave || !sitio.startsWith('https://')) { console.error('Faltan STRIPE_KEY o SITE_URL (https)'); process.exit(1); }
const s = new Stripe(clave);
const NOMBRE = 'Cartera · CCSE · Acceso 3 meses';
const LOOKUP = `a-ccse-acceso-${PAIS.accesoDias}d-${PAIS.precioCentimos}${PAIS.moneda.toLowerCase()}`;
let precio = (await s.prices.list({ lookup_keys: [LOOKUP], active: true, limit: 1 })).data[0];
if (!precio) {
  const prods = await s.products.search({ query: `metadata['proyecto']:'a-ccse' AND active:'true'` });
  const prod = prods.data.find((p) => p.name === NOMBRE) ?? (await s.products.create({ name: NOMBRE, metadata: { proyecto: 'a-ccse', plan: 'acceso-3-meses' } }));
  precio = await s.prices.create({ product: prod.id, currency: PAIS.moneda.toLowerCase(), unit_amount: PAIS.precioCentimos, tax_behavior: 'inclusive', lookup_key: LOOKUP, metadata: { proyecto: 'a-ccse', dias: String(PAIS.accesoDias) } });
  console.error(`Precio creado: ${precio.id} (${PAIS.precioCentimos / 100} ${PAIS.moneda})`);
} else console.error(`Precio ya existía: ${precio.id}`);
const url = `${sitio}/api/stripe/webhook`;
const ya = (await s.webhookEndpoints.list({ limit: 100 })).data.find((w) => w.url === url);
const EVENTOS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'];
if (ya) {
  await s.webhookEndpoints.update(ya.id, { enabled_events: EVENTOS });
  console.error(`Webhook ya existía: ${ya.id}; eventos actualizados (${EVENTOS.join(', ')}).`);
}
else {
  const w = await s.webhookEndpoints.create({ url, enabled_events: EVENTOS, description: 'Cartera · CCSE · webhook', metadata: { proyecto: 'a-ccse' } });
  console.error(`Webhook creado: ${w.id}`);
  process.stdout.write(w.secret ?? '');
}
