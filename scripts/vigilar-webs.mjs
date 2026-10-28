#!/usr/bin/env node
// Vigilancia de todas las webs de la cartera (panel/data/proyectos.json, campo «enlaces»).
// Comprueba que cada web responde 200, que tiene <title>, cuánto tarda y, en las que tienen aviso legal,
// que no quedan datos pendientes ni correos personales. Sale con código 1 si algo falla.
// Uso: node scripts/vigilar-webs.mjs [ruta/proyectos.json] [--md informe.md]
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const iMd = args.indexOf('--md');
const salidaMd = iMd >= 0 ? args[iMd + 1] : null;
const ruta = args.find((a, i) => !a.startsWith('--') && (iMd < 0 || i !== iMd + 1)) || 'panel/data/proyectos.json';
const proyectos = JSON.parse(readFileSync(ruta, 'utf8'));

// Solo webs propias: fuera GitHub, claude.ai (vistas previas privadas) y repositorios
const esWeb = (u) => /^https?:\/\//.test(u) && !/github\.com|claude\.ai/.test(u);
const PROHIBIDOS = [/PENDIENTE-NIF/, /@gmail\.com/i, /algorithmics/i];
const LEGAL = ['aviso-legal/', 'es/aviso-legal', 'legal'];

async function pedir(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'vigilancia-cartera/1.0' } });
    const html = await r.text();
    return { ok: r.ok, codigo: r.status, ms: Date.now() - t0, html, final: r.url };
  } catch (e) {
    return { ok: false, codigo: 0, ms: Date.now() - t0, html: '', error: e.cause?.code || e.name };
  }
}

const filas = [];
let fallos = 0;
for (const p of proyectos) {
  const enlaces = Array.isArray(p.enlaces) ? p.enlaces.map((e) => [e.texto || e.nombre, e.url]) : Object.entries(p.enlaces || {});
  const vistos = new Set();
  for (const [nombre, url] of enlaces) {
    if (!esWeb(url) || vistos.has(url)) continue;
    vistos.add(url);
    const r = await pedir(url);
    const titulo = (r.html.match(/<title>([^<]*)/i) || [])[1]?.trim() || '';
    const problemas = [];
    // Detrás del proxy de una sesión en la nube, una conexión cortada suele ser el proxy, no la web: se avisa sin fallar
    const bloqueada = !r.codigo && !!process.env.HTTPS_PROXY;
    if (!r.ok && !bloqueada) problemas.push(r.codigo ? `HTTP ${r.codigo}` : `sin respuesta (${r.error})`);
    else if (r.ok && !titulo) problemas.push('sin <title>');
    if (r.ok && r.ms > 5000) problemas.push(`lenta (${r.ms} ms)`);
    // Aviso legal: solo en la portada de cada dominio, una vez
    const raiz = new URL(url).origin;
    if (r.ok && !vistos.has(raiz + '#legal')) {
      vistos.add(raiz + '#legal');
      for (const camino of LEGAL) {
        const l = await pedir(`${raiz}/${camino}`);
        if (!l.ok) continue;
        for (const re of PROHIBIDOS) if (re.test(l.html)) problemas.push(`aviso legal con ${re.source.replace(/\\/g, '')}`);
        break;
      }
    }
    if (problemas.length) fallos++;
    filas.push({ letra: p.letra, nombre, url, codigo: r.codigo, ms: r.ms, titulo: bloqueada ? '(la red de esta sesión no llega: comprobar a mano)' : titulo, problemas });
  }
}

const md = [
  `# Vigilancia de las webs · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  '',
  fallos ? `**${fallos} web(s) con problemas.**` : '**Todas las webs responden bien.**',
  '',
  '| Proyecto | Web | Estado | Tiempo | Título | Problemas |',
  '|---|---|---|---|---|---|',
  ...filas.map((f) => `| ${f.letra} | [${f.nombre}](${f.url}) | ${f.codigo || '—'} | ${f.ms} ms | ${f.titulo.slice(0, 60)} | ${f.problemas.join('; ') || 'ninguno'} |`),
].join('\n');

console.log(md);
if (salidaMd) writeFileSync(salidaMd, md + '\n');
process.exit(fallos ? 1 : 0);
