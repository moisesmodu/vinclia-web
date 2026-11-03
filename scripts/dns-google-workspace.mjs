#!/usr/bin/env node
// Pone en los DNS de Vercel de un dominio los registros que pide Google Workspace para recibir y enviar correo:
// MX (smtp.google.com, prioridad 1), SPF en la raíz (v=spf1 include:_spf.google.com ~all) y, si se pasa, el DKIM.
// No toca los registros de Resend (subdominio `send`), ni el DMARC, ni los CNAME de la web.
// Uso: node scripts/dns-google-workspace.mjs <dominio> [--dkim "v=DKIM1; k=rsa; p=…"] [--verificacion "google-site-verification=…"]
// Necesita VERCEL_TOKEN y VERCEL_TEAM_ID.
const args = process.argv.slice(2);
const dominio = args[0];
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const { VERCEL_TOKEN, VERCEL_TEAM_ID } = process.env;
if (!dominio) { console.error('Uso: node scripts/dns-google-workspace.mjs <dominio> [--dkim <valor>] [--verificacion <valor>]'); process.exit(2); }
if (!VERCEL_TOKEN || !VERCEL_TEAM_ID) { console.error('Faltan VERCEL_TOKEN o VERCEL_TEAM_ID'); process.exit(2); }
const api = (ruta, init = {}) => fetch(`https://api.vercel.com${ruta}${ruta.includes('?') ? '&' : '?'}teamId=${VERCEL_TEAM_ID}`, {
  ...init, headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
}).then(async (r) => ({ ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) }));

const lista = await api(`/v4/domains/${dominio}/records?limit=100`);
if (!lista.ok) { console.error('No se pueden leer los registros:', lista.status, JSON.stringify(lista.json)); process.exit(1); }
const registros = lista.json.records || [];
const existe = (type, name, pred) => registros.find((r) => r.type === type && (r.name || '') === name && (!pred || pred(r)));
async function crear(reg, etiqueta) {
  const r = await api(`/v2/domains/${dominio}/records`, { method: 'POST', body: JSON.stringify(reg) });
  if (!r.ok) { console.error(`ERROR al crear ${etiqueta}:`, r.status, JSON.stringify(r.json)); process.exitCode = 1; }
  else console.log(`creado ${etiqueta}`);
}
// 1. MX en la raíz
if (existe('MX', '', (r) => /google/i.test(r.value))) console.log('MX de Google ya existe');
else {
  const otros = registros.filter((r) => r.type === 'MX' && (r.name || '') === '');
  if (otros.length) console.log('AVISO: hay otros MX en la raíz (' + otros.map((r) => r.value).join(', ') + '); revísalos a mano');
  await crear({ name: '', type: 'MX', value: 'smtp.google.com', mxPriority: 1, ttl: 3600 }, 'MX smtp.google.com (prio 1)');
}
// 2. SPF en la raíz
const spf = existe('TXT', '', (r) => /^v=spf1/i.test(r.value));
if (spf) console.log('SPF en la raíz ya existe:', spf.value, /_spf\.google\.com/.test(spf.value) ? '(incluye Google)' : '(AVISO: no incluye _spf.google.com; edítalo a mano)');
else await crear({ name: '', type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 }, 'SPF raíz');
// 3. DKIM
const dkim = opt('--dkim');
if (dkim) {
  if (existe('TXT', 'google._domainkey')) console.log('DKIM google._domainkey ya existe');
  else await crear({ name: 'google._domainkey', type: 'TXT', value: dkim, ttl: 3600 }, 'DKIM google._domainkey');
}
// 4. Verificación de Workspace (si Google pide una distinta de la de Search Console)
const ver = opt('--verificacion');
if (ver) {
  if (existe('TXT', '', (r) => r.value === ver)) console.log('TXT de verificación ya existe');
  else await crear({ name: '', type: 'TXT', value: ver, ttl: 60 }, 'TXT de verificación');
}
// 5. DMARC: solo informa
const dmarc = existe('TXT', '_dmarc');
console.log(dmarc ? `DMARC presente: ${dmarc.value}` : 'AVISO: no hay DMARC; crea TXT _dmarc = "v=DMARC1; p=none; rua=mailto:hola@numimates.com"');
console.log('Hecho. Vuelve a Google Admin y pulsa «Activar Gmail» / «Iniciar autenticación» (DKIM).');
