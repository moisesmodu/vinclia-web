import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_OPOS = path.join(RAIZ, 'oposiciones');

export const leerJson = (f, def) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : def);
export const escribirJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
};

export function slugs() {
  if (!fs.existsSync(DIR_OPOS)) return [];
  return fs.readdirSync(DIR_OPOS).filter((s) => fs.existsSync(path.join(DIR_OPOS, s, 'oposicion.json'))).sort();
}

export const config = (slug) => leerJson(path.join(DIR_OPOS, slug, 'oposicion.json'));

export function preguntas(slug) {
  const dir = path.join(DIR_OPOS, slug, 'preguntas');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const arr = leerJson(path.join(dir, f), []);
    for (const p of arr) out.push({ ...p, _archivo: f });
  }
  return out;
}

/** Revisiones de la segunda pasada: oposiciones/<slug>/revision/*.json → { id: { revision, nota, revisor, fecha } } */
export function revisiones(slug) {
  const dir = path.join(DIR_OPOS, slug, 'revision');
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) Object.assign(out, leerJson(path.join(dir, f), {}));
  return out;
}

/** Comprobaciones de forma que no necesitan la fuente. */
export function errorDeForma(p, nOpciones = 4) {
  if (!p.id || typeof p.tema !== 'number') return 'sin id o tema';
  for (const l of ['es', 'ca']) {
    const x = p[l];
    if (!x?.enunciado?.trim() || !x?.explicacion?.trim()) return `falta texto ${l}`;
    if (!Array.isArray(x.opciones) || x.opciones.length !== nOpciones) return `opciones ${l} != ${nOpciones}`;
    if (new Set(x.opciones.map((o) => o.trim().toLowerCase())).size !== nOpciones) return `opciones repetidas ${l}`;
    if (x.opciones.some((o) => !String(o).trim())) return `opción vacía ${l}`;
  }
  if (!(p.correcta >= 0 && p.correcta < nOpciones)) return 'índice correcta fuera de rango';
  if (!p.fuente?.norma) return 'sin fuente';
  return null;
}
