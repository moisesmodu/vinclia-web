// Crea o reutiliza en Stripe los productos, precios y Payment Links del widget para profesionales (familia Claro).
// Idempotente: busca por metadata (proyecto, plan, clave) antes de crear; si ya existe, lo reutiliza.
//   NODE_USE_ENV_PROXY=1 node scripts/stripe-widget.mjs          → modo test (STRIPE_TEST_SECRET_KEY)
//   NODE_USE_ENV_PROXY=1 node scripts/stripe-widget.mjs --real   → modo real (STRIPE_SECRET_KEY), solo con aprobación
// Imprime las variables PAGO_WIDGET_* para el entorno del despliegue y las guarda en widget-pagos.<modo>.json.
import { writeFileSync } from 'node:fs';

const REAL = process.argv.includes('--real');
const KEY = REAL ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY;
if (!KEY) { console.error(`Falta ${REAL ? 'STRIPE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY'}`); process.exit(1); }
if (REAL === KEY.startsWith('sk_test_')) { console.error('La clave no corresponde al modo pedido'); process.exit(1); }
const PROYECTO = 'p-webs-adsense';

function form(o, pre = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? `${pre}[${k}]` : k;
    if (v && typeof v === 'object') form(v, key, out); else if (v !== undefined) out.append(key, String(v));
  }
  return out;
}
async function api(metodo, ruta, datos) {
  const r = await fetch(`https://api.stripe.com/v1/${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2024-06-20' },
    body: datos ? form(datos) : undefined,
  });
  const j = await r.json();
  if (j.error) throw new Error(`${metodo} ${ruta}: ${j.error.message}`);
  return j;
}
async function todos(ruta) {
  const out = [];
  let tras;
  for (;;) {
    const j = await api('GET', `${ruta}${ruta.includes('?') ? '&' : '?'}limit=100${tras ? `&starting_after=${tras}` : ''}`);
    out.push(...j.data);
    if (!j.has_more) return out;
    tras = j.data.at(-1).id;
  }
}

const PRODUCTOS = [
  {
    plan: 'widget-profesional', nombre: 'Cartera · Claro · Widget Profesional',
    descripcion: 'Calculadoras de la familia Claro en tu web sin enlace (marca blanca), con tu logo y tus colores y aviso de cambios normativos por correo. 1 dominio.',
    precios: [{ clave: 'pro-mes', importe: 900, intervalo: 'month', env: 'PAGO_WIDGET_PRO_MES_URL' }, { clave: 'pro-anio', importe: 9000, intervalo: 'year', env: 'PAGO_WIDGET_PRO_ANIO_URL' }],
  },
  {
    plan: 'widget-agencia', nombre: 'Cartera · Claro · Widget Agencia',
    descripcion: 'Calculadoras de la familia Claro en marca blanca en hasta 10 dominios, con logo y colores por dominio y aviso de cambios normativos por correo.',
    precios: [{ clave: 'agencia-mes', importe: 2900, intervalo: 'month', env: 'PAGO_WIDGET_AGENCIA_URL' }],
  },
];

const productos = await todos('products?active=true');
const enlaces = await todos('payment_links?active=true');
const salida = {};
for (const P of PRODUCTOS) {
  const meta = { proyecto: PROYECTO, marca: 'Claro', plan: P.plan };
  let prod = productos.find((p) => p.metadata?.proyecto === PROYECTO && p.metadata?.plan === P.plan);
  if (!prod) { prod = await api('POST', 'products', { name: P.nombre, description: P.descripcion, metadata: meta, tax_code: 'txcd_10103001' }); console.log(`+ producto ${P.nombre}`); }
  else console.log(`= producto ${P.nombre} (${prod.id})`);
  const precios = await todos(`prices?product=${prod.id}&active=true`);
  for (const x of P.precios) {
    let precio = precios.find((p) => p.metadata?.clave === x.clave && p.unit_amount === x.importe && p.recurring?.interval === x.intervalo);
    if (!precio) {
      // Precio final con IVA incluido (MARCAS.md §3): tax_behavior inclusive por si se activa Stripe Tax
      precio = await api('POST', 'prices', { product: prod.id, currency: 'eur', unit_amount: x.importe, tax_behavior: 'inclusive', recurring: { interval: x.intervalo }, nickname: x.clave, metadata: { ...meta, clave: x.clave } });
      console.log(`  + precio ${x.clave} ${x.importe / 100} €/${x.intervalo}`);
    } else console.log(`  = precio ${x.clave} (${precio.id})`);
    let enlace = enlaces.find((l) => l.metadata?.proyecto === PROYECTO && l.metadata?.clave === x.clave && l.metadata?.precio === precio.id);
    if (!enlace) {
      enlace = await api('POST', 'payment_links', {
        line_items: { 0: { price: precio.id, quantity: 1 } },
        metadata: { ...meta, clave: x.clave, precio: precio.id },
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        allow_promotion_codes: true,
        // El dominio es lo que hace falta para dar de alta la marca blanca (widget-clientes.json)
        custom_fields: { 0: { key: 'dominio', label: { type: 'custom', custom: 'Dominio de tu web (ej. gestoria.es)' }, type: 'text' } },
        subscription_data: { description: P.nombre, metadata: { ...meta, clave: x.clave } },
        after_completion: { type: 'hosted_confirmation', hosted_confirmation: { custom_message: 'Gracias. En menos de 24 h laborables te enviamos por correo tu clave de marca blanca y el código para tu web. Puedes cancelar en un clic desde el enlace de tu recibo.' } },
      });
      console.log(`  + enlace ${enlace.url}`);
    } else console.log(`  = enlace ${enlace.url}`);
    salida[x.env] = enlace.url;
  }
}
const modo = REAL ? 'real' : 'test';
writeFileSync(`widget-pagos.${modo}.json`, JSON.stringify({ modo, fecha: new Date().toISOString().slice(0, 10), ...salida }, null, 2) + '\n');
console.log(`\nVariables (${modo}) para el despliegue:`);
for (const [k, v] of Object.entries(salida)) console.log(`${k}=${v}`);
