// Crea o reutiliza en Stripe el producto, el precio y el Payment Link de cada producto de productos.json, con la
// redirección al terminar el pago a <SITE_URL>/descarga/<token>/, e imprime las variables PAGO_<ID>_URL.
//
//   node scripts/stripe-productos.mjs                 → modo test (STRIPE_TEST_SECRET_KEY)
//   node scripts/stripe-productos.mjs --real          → modo real (STRIPE_SECRET_KEY): cobra de verdad
//   node scripts/stripe-productos.mjs pack-despido    → solo ese producto
//
// Idempotente: busca por metadata (cartera=p-webs-adsense, producto_id=<id>) antes de crear. Si el precio cambia en
// productos.json crea un precio nuevo y un enlace nuevo (los de Stripe no se pueden editar) y desactiva el anterior;
// si solo cambia la URL de descarga, actualiza el enlace existente.
// URL del sitio: SITE_URL_<SITIO> (p. ej. SITE_URL_IMPUESTOS), o SITE_URL si se pasa un solo sitio, o la de familia.json.
// Red: las llamadas van con curl, que respeta HTTPS_PROXY (en la nube la salida es por el proxy).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const real = args.includes('--real');
const ids = args.filter((a) => !a.startsWith('--'));
const clave = real ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
if (!clave) { console.error(`Falta ${real ? 'STRIPE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY'}`); process.exit(1); }
if (real !== clave.startsWith('sk_live_') && !clave.startsWith('rk_')) { console.error(`La clave no es de modo ${real ? 'real (sk_live_)' : 'test (sk_test_)'}: no sigo.`); process.exit(1); }

const productos = JSON.parse(readFileSync('productos.json', 'utf8')).productos.filter((p) => !ids.length || ids.includes(p.id));
const familia = JSON.parse(readFileSync('familia.json', 'utf8'));
const CARTERA = 'p-webs-adsense';

function api(metodo, ruta, datos) {
  const a = ['-sS', '-X', metodo, `https://api.stripe.com/v1/${ruta}`, '-u', `${clave}:`, '-H', 'Stripe-Version: 2024-06-20'];
  for (const [k, v] of Object.entries(datos ?? {})) a.push('--data-urlencode', `${k}=${v}`);
  const r = JSON.parse(execFileSync('curl', a, { encoding: 'utf8', maxBuffer: 1e8 }));
  if (r.error) throw new Error(`${metodo} ${ruta}: ${r.error.message}`);
  return r;
}
function todos(ruta) {
  const out = [];
  let tras = '';
  for (;;) {
    const r = api('GET', `${ruta}${ruta.includes('?') ? '&' : '?'}limit=100${tras ? `&starting_after=${tras}` : ''}`);
    out.push(...r.data);
    if (!r.has_more) return out;
    tras = r.data[r.data.length - 1].id;
  }
}
function urlSitio(sitio) {
  const e = process.env[`SITE_URL_${sitio.toUpperCase()}`] || (new Set(productos.map((p) => p.sitio)).size === 1 ? process.env.SITE_URL : '');
  if (e) return e.replace(/\/$/, '');
  const f = familia.sitios.find((s) => s.id === sitio);
  return (f?.url || JSON.parse(readFileSync(`sitios/${sitio}/sitio.json`, 'utf8')).dominio).replace(/\/$/, '');
}
const meta = (p) => ({ 'metadata[cartera]': CARTERA, 'metadata[producto_id]': p.id, 'metadata[sitio]': p.sitio });

const prodStripe = todos('products?active=true').filter((x) => x.metadata?.cartera === CARTERA);
const enlaces = todos('payment_links?active=true').filter((x) => x.metadata?.cartera === CARTERA);
const salida = [];
for (const p of productos) {
  const nombreSitio = JSON.parse(readFileSync(`sitios/${p.sitio}/sitio.json`, 'utf8')).nombre;
  const nombre = `Cartera · ${nombreSitio} · ${p.nombre.es}`;
  const destino = `${urlSitio(p.sitio)}/descarga/${p.token}/`;
  const centimos = Math.round(p.precio * 100);
  // Producto
  let prod = prodStripe.find((x) => x.metadata.producto_id === p.id);
  if (!prod) prod = api('POST', 'products', { name: nombre, description: p.descripcion.es.slice(0, 250), ...meta(p) });
  else if (prod.name !== nombre) prod = api('POST', `products/${prod.id}`, { name: nombre });
  // Precio
  const precios = todos(`prices?product=${prod.id}&active=true`);
  let precio = precios.find((x) => x.unit_amount === centimos && x.currency === p.moneda && !x.recurring);
  if (!precio) precio = api('POST', 'prices', { product: prod.id, unit_amount: centimos, currency: p.moneda, tax_behavior: 'inclusive', ...meta(p) });
  if (prod.default_price !== precio.id) api('POST', `products/${prod.id}`, { default_price: precio.id });
  // Payment Link
  const propios = enlaces.filter((x) => x.metadata.producto_id === p.id);
  let enlace = propios.find((x) => x.metadata.price_id === precio.id);
  for (const viejo of propios.filter((x) => x !== enlace)) api('POST', `payment_links/${viejo.id}`, { active: 'false' });
  const aviso = p.moneda === 'usd'
    ? 'Contenido digital: al pagar pides acceso inmediato a la descarga y aceptas que pierdes el derecho de desistimiento. Condiciones de venta en la web.'
    : 'Contenido digital: al pagar pides acceso inmediato a la descarga y aceptas que pierdes el derecho de desistimiento (art. 103.m TRLGDCU). Precio con IVA incluido.';
  const datosEnlace = { 'after_completion[type]': 'redirect', 'after_completion[redirect][url]': destino, 'custom_text[submit][message]': aviso };
  if (!enlace) {
    enlace = api('POST', 'payment_links', { 'line_items[0][price]': precio.id, 'line_items[0][quantity]': '1', ...datosEnlace, ...meta(p), 'metadata[price_id]': precio.id });
    console.error(`${p.id}: enlace creado`);
  } else if (enlace.after_completion?.redirect?.url !== destino || enlace.custom_text?.submit?.message !== aviso) {
    enlace = api('POST', `payment_links/${enlace.id}`, datosEnlace);
    console.error(`${p.id}: enlace actualizado`);
  } else console.error(`${p.id}: ya existía, sin cambios`);
  salida.push(`${p.variablePago}=${enlace.url}`);
  console.error(`   ${nombre} · ${prod.id} · ${precio.id} · ${(centimos / 100).toFixed(2)} ${p.moneda.toUpperCase()} → ${destino}`);
}
console.log(`# Payment Links (${real ? 'MODO REAL' : 'modo test'})`);
console.log(salida.join('\n'));
