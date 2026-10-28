// Crea (o reutiliza) en Stripe los productos, precios y el webhook de Nuevo en España. Idempotente: busca antes de crear.
// Uso: STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-configurar.mjs https://<dominio>
// Imprime las variables STRIPE_PRICE_MENSUAL, STRIPE_PRICE_PACK y, si crea el webhook, STRIPE_WEBHOOK_SECRET.
import fs from "node:fs";
import Stripe from "stripe";

const clave = process.env.STRIPE_SECRET_KEY;
const dominio = (process.argv[2] ?? "").replace(/\/$/, "");
if (!clave || !dominio.startsWith("http")) {
  console.error("Uso: STRIPE_SECRET_KEY=sk_... node scripts/stripe-configurar.mjs https://<dominio>");
  process.exit(1);
}
const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
const stripe = base ? new Stripe(clave, { host: base.hostname, port: Number(base.port), protocol: base.protocol.replace(":", "") }) : new Stripe(clave);
const cfg = JSON.parse(fs.readFileSync(new URL("../config/paises/es.json", import.meta.url), "utf8"));
const PROYECTO = cfg.proyecto;
const EVENTOS = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "invoice.paid", "customer.subscription.deleted", "charge.refunded"];

async function producto(nombre, plan) {
  const lista = await stripe.products.list({ limit: 100, active: true });
  const existe = lista.data.find((p) => p.metadata?.proyecto === PROYECTO && p.metadata?.plan === plan);
  if (existe) return existe;
  return stripe.products.create({ name: nombre, metadata: { proyecto: PROYECTO, plan } });
}
async function precio(prod, centimos, mensual) {
  const lista = await stripe.prices.list({ product: prod.id, active: true, limit: 100 });
  const existe = lista.data.find((p) => p.unit_amount === centimos && p.currency === cfg.moneda && Boolean(p.recurring) === mensual);
  if (existe) return existe;
  return stripe.prices.create({
    product: prod.id, unit_amount: centimos, currency: cfg.moneda, tax_behavior: "inclusive",
    metadata: { proyecto: PROYECTO }, ...(mensual ? { recurring: { interval: "month" } } : {})
  });
}

const pm = await producto(cfg.precios.suscripcion.productoStripe, "mensual");
const pp = await producto(cfg.precios.pack.productoStripe, "pack");
const precioMensual = await precio(pm, cfg.precios.suscripcion.importeCentimos, true);
const precioPack = await precio(pp, cfg.precios.pack.importeCentimos, false);

const url = `${dominio}/api/stripe/webhook`;
const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
let hook = hooks.data.find((h) => h.url === url);
let secreto = null;
if (!hook) {
  hook = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTOS, description: `Cartera · Nuevo en España`, metadata: { proyecto: PROYECTO } });
  secreto = hook.secret;
} else {
  await stripe.webhookEndpoints.update(hook.id, { enabled_events: EVENTOS });
}

console.log(`STRIPE_PRICE_MENSUAL=${precioMensual.id}`);
console.log(`STRIPE_PRICE_PACK=${precioPack.id}`);
console.log(secreto ? `STRIPE_WEBHOOK_SECRET=${secreto}` : `# El webhook ${hook.id} ya existía: su secreto no se puede volver a leer. Si no lo tienes, bórralo en Stripe y vuelve a ejecutar.`);
