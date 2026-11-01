#!/usr/bin/env node
// Exporta a CSV las compras de los últimos N días que llegaron desde un anuncio de Google (metadata.gclid en la sesión
// de Checkout) con el formato de importación de conversiones de Google Ads («Conversiones» → «Importar» → «De clics»).
// Uso: STRIPE_MODO=live STRIPE_SECRET_KEY=… node scripts/conversiones-google-ads.mjs [dias=7] [salida.csv]
//      (sin STRIPE_MODO=live usa STRIPE_TEST_SECRET_KEY). En una sesión con proxy: NODE_USE_ENV_PROXY=1.
import Stripe from 'stripe';
import { writeFileSync } from 'node:fs';

const NOMBRE_CONVERSION = 'Compra CCSE';
const ZONA = 'Europe/Madrid';
const dias = Number(process.argv[2] || 7);
const salida = process.argv[3] || `conversiones-google-ads-${new Date().toISOString().slice(0, 10)}.csv`;
const clave = process.env.STRIPE_MODO === 'live' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!clave) { console.error('Falta STRIPE_SECRET_KEY (con STRIPE_MODO=live) o STRIPE_TEST_SECRET_KEY'); process.exit(2); }
const s = new Stripe(clave);

/** Fecha con desplazamiento horario de Madrid: yyyy-MM-dd HH:mm:ss+01:00 (formato aceptado por Google Ads). */
function fechaMadrid(unix) {
  const d = new Date(unix * 1000);
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'longOffset' }).formatToParts(d).map((p) => [p.type, p.value]));
  const off = (partes.timeZoneName || 'GMT+01:00').replace('GMT', '') || '+00:00';
  return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}:${partes.second}${off}`;
}
const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;

const desde = Math.floor(Date.now() / 1000) - dias * 86400;
const filas = [];
for await (const ses of s.checkout.sessions.list({ created: { gte: desde }, status: 'complete', limit: 100 })) {
  if (ses.payment_status !== 'paid' || ses.metadata?.proyecto !== 'a-ccse') continue;
  const gclid = ses.metadata?.gclid;
  if (!gclid) continue;
  filas.push([gclid, NOMBRE_CONVERSION, fechaMadrid(ses.created), ((ses.amount_total ?? 0) / 100).toFixed(2), (ses.currency || 'eur').toUpperCase()]);
}
const texto = [`Parameters:TimeZone=${ZONA}`, 'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency', ...filas.map((f) => f.map(csv).join(','))].join('\n') + '\n';
writeFileSync(salida, texto);
console.log(`${filas.length} conversiones de los últimos ${dias} días → ${salida}`);
