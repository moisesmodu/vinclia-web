#!/usr/bin/env node
// Añade (o actualiza) el registro TXT de verificación de Google Search Console en los DNS de Vercel de un dominio.
// Uso: node scripts/search-console-txt.mjs <dominio> <valor>   (valor: "google-site-verification=XXXX" o solo "XXXX")
// Necesita VERCEL_TOKEN y VERCEL_TEAM_ID en el entorno (secretos del entorno Default, DESPLIEGUES.md §1).
// Vale para propiedades de tipo «Dominio» de Search Console: ccsefacil.com, tuspapeles.app, oposita.digital,
// lunilla.cat, netoclaro.app, impuestoclaro.es. No toca nada más del DNS.

const [dominio, valorBruto] = process.argv.slice(2);
const { VERCEL_TOKEN, VERCEL_TEAM_ID } = process.env;
if (!dominio || !valorBruto) { console.error('Uso: node scripts/search-console-txt.mjs <dominio> <valor>'); process.exit(2); }
if (!VERCEL_TOKEN || !VERCEL_TEAM_ID) { console.error('Faltan VERCEL_TOKEN o VERCEL_TEAM_ID'); process.exit(2); }
const valor = valorBruto.startsWith('google-site-verification=') ? valorBruto : `google-site-verification=${valorBruto}`;
const api = (ruta, init = {}) => fetch(`https://api.vercel.com${ruta}${ruta.includes('?') ? '&' : '?'}teamId=${VERCEL_TEAM_ID}`, {
  ...init, headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
}).then(async (r) => ({ ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) }));

const lista = await api(`/v4/domains/${dominio}/records?limit=100`);
if (!lista.ok) { console.error('No se pueden leer los registros:', lista.status, JSON.stringify(lista.json)); process.exit(1); }
const existente = (lista.json.records || []).find((r) => r.type === 'TXT' && (r.name === '' || r.name === '@') && String(r.value).startsWith('google-site-verification='));
if (existente && existente.value === valor) { console.log(`Ya existe el TXT correcto en ${dominio}: ${valor}`); process.exit(0); }
if (existente) {
  const del = await api(`/v2/domains/${dominio}/records/${existente.id}`, { method: 'DELETE' });
  if (!del.ok) { console.error('No se pudo sustituir el TXT antiguo:', del.status, JSON.stringify(del.json)); process.exit(1); }
}
const alta = await api(`/v2/domains/${dominio}/records`, { method: 'POST', body: JSON.stringify({ name: '', type: 'TXT', value: valor, ttl: 60 }) });
if (!alta.ok) { console.error('No se pudo crear el TXT:', alta.status, JSON.stringify(alta.json)); process.exit(1); }
console.log(`TXT creado en ${dominio}: ${valor} (id ${alta.json.uid || alta.json.id}). Vuelve a Search Console y pulsa «Verificar» en 1–2 minutos.`);
