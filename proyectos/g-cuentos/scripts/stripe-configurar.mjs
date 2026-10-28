// Crea (o reutiliza) en la cuenta de Stripe «Numi Mates» los productos, precios y webhook de G · Cuentos.
// Repetible: busca antes de crear (lookup_key de precio, metadata del producto, URL del webhook).
//   STRIPE_TEST_SECRET_KEY=sk_test_… URL_BASE=https://xxx.vercel.app node scripts/stripe-configurar.mjs
// Imprime las variables para Vercel: STRIPE_PRICE_PDF, STRIPE_PRICE_TAPA_DURA y STRIPE_WEBHOOK_SECRET (solo al crear).
import Stripe from "stripe";
import { readFileSync } from "node:fs";

const clave = process.env.STRIPE_KEY || process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const base = (process.env.URL_BASE || "").replace(/\/$/, "");
if (!clave) throw new Error("Falta STRIPE_TEST_SECRET_KEY (o STRIPE_SECRET_KEY para el modo real)");
if (!/^https:\/\//.test(base)) throw new Error("Falta URL_BASE (https://…) para el webhook");
const stripe = new Stripe(clave);
const modo = /^(sk|rk)_live/.test(clave) ? "real" : "prueba";
const config = JSON.parse(readFileSync(new URL("../src/config/paises/es-ES.json", import.meta.url), "utf8"));
const euros = (c) => (c / 100).toFixed(2).replace(".", ",") + " €";

const PRODUCTOS = [
  { formato: "pdf", env: "STRIPE_PRICE_PDF", nombre: `Cartera · Cuentos · PDF ${euros(config.precios.pdf)}`, cents: config.precios.pdf },
  { formato: "tapaDura", env: "STRIPE_PRICE_TAPA_DURA", nombre: `Cartera · Cuentos · Tapa dura ${euros(config.precios.tapaDura)}`, cents: config.precios.tapaDura },
];

const salida = [];
for (const p of PRODUCTOS) {
  const lookup = `g-cuentos-${p.formato}-${p.cents}`;
  const existentes = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (existentes.data[0]) {
    console.log(`= ${p.nombre}: precio ${existentes.data[0].id} ya existe`);
    salida.push(`${p.env}=${existentes.data[0].id}`);
    continue;
  }
  const busq = await stripe.products.search({ query: `metadata['proyecto']:'g-cuentos' AND metadata['formato']:'${p.formato}'` });
  const producto = busq.data[0]
    ? await stripe.products.update(busq.data[0].id, { name: p.nombre, active: true })
    : await stripe.products.create({ name: p.nombre, metadata: { proyecto: "g-cuentos", formato: p.formato } });
  const precio = await stripe.prices.create({
    product: producto.id, currency: "eur", unit_amount: p.cents, tax_behavior: "inclusive", lookup_key: lookup, transfer_lookup_key: true,
    metadata: { proyecto: "g-cuentos", formato: p.formato },
  });
  await stripe.products.update(producto.id, { default_price: precio.id });
  console.log(`+ ${p.nombre}: producto ${producto.id}, precio ${precio.id}`);
  salida.push(`${p.env}=${precio.id}`);
}

const url = `${base}/api/stripe/webhook`;
const eventos = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
const hook = hooks.data.find((h) => h.url === url);
if (hook) {
  await stripe.webhookEndpoints.update(hook.id, { enabled_events: eventos, metadata: { proyecto: "g-cuentos" } });
  console.log(`= webhook ${hook.id} ya existe (su secreto no se puede volver a leer: si se perdió, bórralo y repite)`);
} else {
  const h = await stripe.webhookEndpoints.create({ url, enabled_events: eventos, description: "Cartera · Cuentos (Lunilla)", metadata: { proyecto: "g-cuentos" } });
  console.log(`+ webhook ${h.id}`);
  salida.push(`STRIPE_WEBHOOK_SECRET=${h.secret}`);
}
console.log(`\nModo ${modo}. Variables para Vercel:\n${salida.join("\n")}`);
