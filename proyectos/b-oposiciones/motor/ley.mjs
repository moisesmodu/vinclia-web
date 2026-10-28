#!/usr/bin/env node
// Lector de normas consolidadas del BOE (vía el espejo abierto legalize-es, texto en Markdown).
// Uso:
//   node motor/ley.mjs titulo   <BOE-ID>
//   node motor/ley.mjs indice   <BOE-ID>                  -> lista de artículos con su rúbrica
//   node motor/ley.mjs art      <BOE-ID> <n> [n2 ...]     -> texto literal de esos artículos (p. ej. 21  "16 bis"  "adicional primera")
//   node motor/ley.mjs buscar   <BOE-ID> <texto>          -> artículos que contienen el texto
//   node motor/ley.mjs cita     <BOE-ID> <art> <cita>     -> comprueba que la cita literal está en el artículo (sale 0 si sí)
// Las normas se guardan en motor/.cache (no va a git). Fuente: Agencia Estatal BOE (reutilización conforme a su aviso legal).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(DIR, '.cache');
const BASE = 'https://raw.githubusercontent.com/legalize-dev/legalize-es/main';
const AMBITOS = ['es', 'es-ct'];

export async function cargarNorma(id) {
  fs.mkdirSync(CACHE, { recursive: true });
  const local = path.join(CACHE, `${id}.md`);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  const sha = crypto.createHash('sha1').update(id).digest('hex').slice(0, 2);
  for (const amb of AMBITOS) {
    const r = await fetch(`${BASE}/${amb}/${sha}/${id}.md`);
    if (r.ok) {
      const t = await r.text();
      fs.writeFileSync(local, t);
      return t;
    }
  }
  throw new Error(`No encuentro ${id} en legalize-es (ámbitos ${AMBITOS.join(', ')})`);
}

export function normalizar(s) {
  return s
    .replace(/\\([.\-*_()[\]#])/g, '$1')
    .replace(/[«»“”"']/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Divide la norma en bloques {clave, rubrica, texto}. clave: "21", "16 bis", "adicional primera", "transitoria segunda"... */
export function articulos(md) {
  const lineas = md.split('\n');
  const out = [];
  let actual = null;
  const re = /^#{3,6}\s+(Artículo|Article|Art\.|Disposición|Disposició)\s*(.+)$/i;
  for (const l of lineas) {
    const m = l.match(re);
    if (m || /^#{1,6}\s/.test(l)) {
      if (actual) out.push(actual);
      actual = null;
      if (m) {
        const cab = m[2].trim();
        let clave, rubrica;
        if (/^(Artículo|Article|Art\.)$/i.test(m[1])) {
          const mm = cab.match(/^(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies))?)\.?\s*(.*)$/i);
          clave = mm ? mm[1].toLowerCase() : cab.toLowerCase();
          rubrica = mm ? mm[2] : '';
        } else {
          const mm = cab.match(/^([a-záéíóúçèò]+\s+[a-záéíóúçèò]+(?:\s+bis)?)\.?\s*(.*)$/i);
          clave = mm ? mm[1].toLowerCase() : cab.toLowerCase();
          rubrica = mm ? mm[2] : cab;
        }
        actual = { clave, rubrica, cabecera: l.replace(/^#+\s*/, ''), texto: '' };
      }
      continue;
    }
    if (actual) actual.texto += l + '\n';
  }
  if (actual) out.push(actual);
  return out;
}

export function titulo(md) {
  const m = md.match(/^title:\s*"(.+)"/m);
  return m ? m[1] : '';
}

export function buscarArticulo(md, art) {
  const clave = String(art).toLowerCase().replace(/^art(ículo|icle)?\.?\s*/, '').replace(/\.\d+.*$/, '').trim();
  return articulos(md).find((a) => a.clave === clave);
}

/** ¿La cita literal aparece en el artículo indicado (o, si no, en la norma)? */
export function comprobarCita(md, art, cita) {
  const n = normalizar(cita).replace(/^\.+|\.+$/g, '').replace(/\s*\.\.\.\s*/g, ' … ');
  const trozos = n.split(' … ').map((t) => t.trim()).filter((t) => t.length > 0);
  const a = art ? buscarArticulo(md, art) : null;
  const enTexto = (t) => trozos.every((x) => normalizar(t).includes(x));
  if (a && enTexto(a.texto)) return { ok: true, donde: 'articulo' };
  if (enTexto(md)) return { ok: true, donde: 'norma' };
  return { ok: false, donde: null, articuloEncontrado: !!a };
}

const urlBoe = (id, clave) => `https://www.boe.es/buscar/act.php?id=${id}${clave && /^\d/.test(clave) ? '#a' + clave.replace(/\s+/g, '') : ''}`;
export { urlBoe };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [, , cmd, id, ...resto] = process.argv;
  if (!cmd || !id) {
    console.error('Uso: node motor/ley.mjs <titulo|indice|art|buscar|cita> <BOE-ID> [...]');
    process.exit(2);
  }
  const md = await cargarNorma(id);
  if (cmd === 'titulo') console.log(titulo(md));
  else if (cmd === 'indice') for (const a of articulos(md)) console.log(`${a.clave} | ${a.rubrica}`);
  else if (cmd === 'art') {
    for (const n of resto) {
      const a = buscarArticulo(md, n);
      if (!a) console.log(`## [${n}] NO ENCONTRADO`);
      else console.log(`## ${a.cabecera}\n${a.texto.replace(/\n{2,}/g, '\n').replace(/\\\./g, '.').trim()}\n`);
    }
  } else if (cmd === 'buscar') {
    const q = normalizar(resto.join(' '));
    for (const a of articulos(md)) if (normalizar(a.texto + ' ' + a.rubrica).includes(q)) console.log(`${a.clave} | ${a.rubrica}`);
  } else if (cmd === 'cita') {
    const [art, ...c] = resto;
    const r = comprobarCita(md, art, c.join(' '));
    console.log(JSON.stringify(r));
    process.exit(r.ok ? 0 : 1);
  }
}
