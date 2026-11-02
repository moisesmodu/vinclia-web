#!/usr/bin/env node
// Reúne en un solo JSON el contenido del repositorio que usa el panel de mando (tareas de Moisés, calendario y piezas
// de marketing, correos a entidades, juegos, iconos de marca). Se ejecuta antes de cada build (npm prebuild) para que
// el contenido viaje dentro del bundle del servidor: las páginas dinámicas no pueden leer archivos fuera de `panel/`
// en Vercel. El JSON resultante solo se importa desde componentes de servidor.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const panel = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = path.join(panel, '..');
const leer = (r) => (fs.existsSync(path.join(raiz, r)) ? fs.readFileSync(path.join(raiz, r), 'utf8') : '');
const RAMA = 'claude/estrategia-ingresos-recurrentes-tx0rvw';
const github = (ruta) => `https://github.com/moisesmodu/vinclia-web/blob/${RAMA}/${ruta}`;
const huella = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const limpiarMd = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').trim();

// ---------- Tareas de Moisés ----------
const minutosDe = (s) => { const m = s.match(/(\d+)\s*min/); return m ? Number(m[1]) : null; };
function enlaceDe(texto) {
  const url = texto.match(/https?:\/\/[^\s)`·|]+/);
  if (url) return { url: url[0].replace(/[.,]$/, ''), texto: new URL(url[0]).hostname.replace(/^www\./, '') };
  const ruta = texto.match(/`((?:marketing\/)?(?:piezas|campanas|ads|correos)\/[^`]+|marketing\/[^`]+)`/);
  if (ruta) { const r = ruta[1].startsWith('marketing/') ? ruta[1] : `marketing/${ruta[1]}`; return { url: github(r.split(' ')[0]), texto: r.split('/').slice(-2).join('/') }; }
  return null;
}

const tareas = [];
const pm = leer('marketing/PARA-MOISES.md');
for (const linea of pm.split('\n')) {
  const c = linea.split('|').map((x) => x.trim());
  if (c.length < 7 || !/^\d+$/.test(c[1])) continue;
  const [, n, tarea, tiempo, donde, porque] = c;
  const titulo = (tarea.match(/\*\*(.+?)\*\*/)?.[1] ?? tarea).replace(/\.$/, '');
  const detalle = limpiarMd(tarea.replace(/\*\*(.+?)\*\*/, '').trim());
  const num = Number(n);
  const enlaces = [];
  for (const u of donde.match(/https?:\/\/[^\s)`·]+/g) ?? []) enlaces.push({ url: u, texto: new URL(u).hostname.replace(/^www\./, '') });
  for (const r of donde.match(/`([^`]+)`/g) ?? []) {
    const ruta = r.slice(1, -1).split(' ')[0];
    const completa = ruta.startsWith('marketing/') ? ruta : `marketing/${ruta}`;
    enlaces.push({ url: github(completa), texto: ruta.split('/').slice(-2).join('/') });
  }
  if (/piezas|CALENDARIO|campanas/.test(donde + tarea)) enlaces.unshift({ url: '/marketing/', texto: 'Piezas en el panel', interno: true });
  tareas.push({
    id: `pm-${huella(titulo)}`, origen: 'Marketing (PARA-MOISES.md)', titulo, detalle, porque: limpiarMd(porque),
    minutos: minutosDe(tiempo), tiempo, prioridad: num <= 2 ? 'alta' : 'media', orden: num <= 2 ? num : 10 + num, enlaces,
  });
}

// decisionesPendientes: se omiten las informativas (✔) y las que ya cubre PARA-MOISES.md.
const cartera = JSON.parse(fs.readFileSync(path.join(panel, 'data', 'cartera.json'), 'utf8'));
const CUBIERTAS = [/^0 · Marketing/, /^1 · B · Pegar los 5 mensajes/];
for (const d of cartera.decisionesPendientes) {
  if (d.texto.startsWith('✔') || CUBIERTAS.some((r) => r.test(d.texto))) continue;
  const m = d.texto.match(/^(\d+)\s*·\s*(?:([A-Z])\s*·\s*)?(.*)$/);
  const num = m ? Number(m[1]) : 99;
  let resto = m ? m[3] : d.texto;
  const minutos = minutosDe(resto);
  resto = resto.replace(/\.?\s*\d+\s*min\.?$/, '');
  const titulo = resto.replace(/\.$/, '');
  const baja = /sin prisa|cuando llegue|si estás/i.test(d.texto);
  const enlaces = d.donde?.startsWith('http') ? [{ url: d.donde, texto: new URL(d.donde).hostname.replace(/^www\./, '') }] : [];
  if (d.donde && !d.donde.startsWith('http') && /juegos-portales/.test(d.donde)) enlaces.push({ url: '/juegos/', texto: 'Juegos en el panel', interno: true });
  tareas.push({
    id: `dp-${huella(d.texto)}`, origen: m?.[2] ? `Proyecto ${m[2]} (cartera.json)` : 'Cartera (cartera.json)', titulo: titulo.trim(),
    detalle: '', porque: '', minutos, tiempo: minutos ? `${minutos} min` : '',
    prioridad: baja ? 'baja' : num <= 3 ? 'alta' : 'media', orden: baja ? 30 + num : num <= 3 ? 2 + num : 10 + num, enlaces,
    ubicacion: d.donde && !d.donde.startsWith('http') ? d.donde : null,
  });
}
tareas.sort((a, b) => a.orden - b.orden);

// ---------- Marketing: estados de APROBAR.md ----------
const aprobado = {};
for (const linea of leer('marketing/APROBAR.md').split('\n')) {
  const c = linea.split('|').map((x) => x.trim());
  if (c.length > 4 && /^[A-Z]{1,2}-\d{2}$/.test(c[2])) aprobado[c[2]] = c[1];
}

// ---------- Marketing: piezas ----------
const NOMBRES = { 'a-ccse': 'CCSE Fácil', 'n-nuevo-en-espana': 'Tus Papeles', 'b-oposiciones': 'Oposita', 'g-cuentos': 'Lunilla', 'm-catala': 'Aprova', 'p-webs-adsense': 'NetoClaro · ImpuestoClaro', juegos: 'Nuvolet Games' };
const piezas = [];
const dirPiezas = path.join(raiz, 'marketing', 'piezas');
for (const clave of fs.existsSync(dirPiezas) ? fs.readdirSync(dirPiezas).sort() : []) {
  for (const archivo of fs.readdirSync(path.join(dirPiezas, clave)).filter((f) => /^semana-\d+\.md$/.test(f)).sort()) {
    const md = fs.readFileSync(path.join(dirPiezas, clave, archivo), 'utf8');
    for (const trozo of md.split(/^## /m).slice(1)) {
      const lineas = trozo.split('\n');
      const cab = lineas[0].trim();
      const id = cab.match(/^([A-Z]{1,2}-\d{2})/)?.[1];
      if (!id) continue;
      const titulo = cab.replace(/^[A-Z]{1,2}-\d{2}\s*·\s*/, '');
      const meta = {};
      for (const l of lineas) { const mm = l.match(/^- \*\*([^*]+?):\*\*\s*(.*)$/); if (mm) meta[mm[1].toLowerCase()] = limpiarMd(mm[2]); }
      const bloques = []; let etiqueta = null; let actual = null;
      for (const l of lineas.slice(1)) {
        if (l.startsWith('>')) { (actual ??= []).push(l.replace(/^>\s?/, '')); continue; }
        if (actual) { bloques.push({ etiqueta: etiqueta ?? 'Texto', texto: limpiarMd(actual.join('\n')) }); actual = null; }
        const e = l.match(/^###\s+(.+)$/) ?? l.match(/^\*\*([^*]+?)\*\*:?\s*$/) ?? l.match(/^\*\*([^*]+?):?\*\*\s*$/);
        if (e) etiqueta = e[1].replace(/:$/, '').trim();
      }
      if (actual) bloques.push({ etiqueta: etiqueta ?? 'Texto', texto: limpiarMd(actual.join('\n')) });
      piezas.push({
        id, clave, proyecto: NOMBRES[clave] ?? clave, titulo, semana: Number(archivo.match(/\d+/)[0]),
        canal: meta['canal'] ?? meta['canal i destinataris'] ?? '', idioma: meta['idioma'] ?? '',
        dia: (meta['día previsto'] ?? meta['dia previst'] ?? '').split(' · ')[0],
        quien: meta['quién publica'] ?? meta['qui publica'] ?? '', enlace: (meta['enlace con medición'] ?? meta['enllaç amb mesura'] ?? '').match(/https?:\/\/\S+/)?.[0] ?? null,
        estado: aprobado[id] ?? meta['estado'] ?? meta['estat'] ?? '', bloques, fuente: github(`marketing/piezas/${clave}/${archivo}`),
      });
    }
  }
}

// ---------- Marketing: calendario ----------
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const cal = leer('marketing/CALENDARIO.md');
const cabCal = cal.match(/de (\w+) de (\d{4})/);
const mes = cabCal ? MESES.indexOf(cabCal[1]) : 10; const anyo = cabCal ? Number(cabCal[2]) : 2026;
const calendario = [];
let semana = null;
for (const linea of cal.split('\n')) {
  const s = linea.match(/^## Semana (\d+) · ([^:]+):\s*(.*)$/);
  if (s) { semana = { numero: Number(s[1]), rango: s[2].trim(), lema: s[3].trim(), filas: [] }; calendario.push(semana); continue; }
  if (/^## /.test(linea)) { semana = null; continue; }
  if (!semana) continue;
  const c = linea.split('|').map((x) => x.trim());
  if (c.length < 7 || c[1] === 'Día' || /^-+$/.test(c[1])) continue;
  const [, dia, pieza, proyecto, canal, estado] = c;
  const nd = dia.match(/(\d+)/);
  const fecha = nd ? `${anyo}-${String(mes + 1).padStart(2, '0')}-${nd[1].padStart(2, '0')}` : null;
  calendario.at(-1).filas.push({ dia: limpiarMd(dia), fecha, texto: limpiarMd(pieza), ids: pieza.match(/[A-Z]{1,2}-\d{2}/g) ?? [], proyecto: limpiarMd(proyecto), canal: limpiarMd(canal), estado: limpiarMd(estado), hito: /\*\*/.test(pieza) });
}

// ---------- Correos a entidades ----------
const correos = [];
const dirCorreos = path.join(raiz, 'marketing', 'correos');
for (const f of fs.existsSync(dirCorreos) ? fs.readdirSync(dirCorreos).filter((x) => x.endsWith('.json')).sort() : []) {
  for (const c of JSON.parse(fs.readFileSync(path.join(dirCorreos, f), 'utf8'))) {
    const pieza = c.id.match(/^[A-Z]{1,2}-\d{2}/)?.[0] ?? c.id;
    correos.push({ clave: `${pieza}|${c.para.toLowerCase()}`, lote: f.replace(/\.json$/, ''), id: c.id, pieza, para: c.para, de: c.de, responderA: c.responderA || 'hola@numimates.com', asunto: c.asunto, texto: c.texto });
  }
}

// ---------- Marcas (iconos y colores) ----------
const tokens = JSON.parse(leer('marcas/tokens.json') || '{}');
const marcas = {};
for (const [clave, p] of Object.entries(tokens.proyectos ?? {})) {
  const svg = leer(`marcas/logos/${clave}-icono.svg`).replace(/^<\?xml[^>]*>\s*/, '').replace(/ width="\d+" height="\d+"/, '');
  marcas[clave] = { acento: p.acento ?? tokens.familias?.[p.familia]?.colores?.primario ?? '#888', svg };
}

// ---------- Proyectos (lo que el panel necesita de proyectos.json) ----------
const proyectos = JSON.parse(fs.readFileSync(path.join(panel, 'data', 'proyectos.json'), 'utf8')).map((p) => ({
  clave: p.clave, letra: p.letra, nombre: p.nombre, resumen: p.resumen, estado: p.estado, modelo: p.modelo, orden: p.orden,
  objetivoMes12: p.objetivoMes12, costesMes: p.costesMes, paraMoises: p.paraMoises ?? [], proximos: (p.proximos ?? []).slice(0, 5),
  acciones: [...(p.acciones ?? [])].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 6),
}));

const juegos = JSON.parse(fs.readFileSync(path.join(panel, 'data', 'juegos.json'), 'utf8'));

const salida = { generado: new Date().toISOString(), tareas, piezas, calendario, correos, marcas, proyectos, juegos };
fs.mkdirSync(path.join(panel, 'lib', 'generado'), { recursive: true });
fs.writeFileSync(path.join(panel, 'lib', 'generado', 'contenido.json'), JSON.stringify(salida));
console.log(`contenido: ${tareas.length} tareas, ${piezas.length} piezas, ${calendario.reduce((t, s) => t + s.filas.length, 0)} filas de calendario, ${correos.length} correos, ${juegos.length} juegos`);
