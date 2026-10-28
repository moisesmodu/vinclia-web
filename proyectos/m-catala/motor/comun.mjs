import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const C = (...p) => path.join(RAIZ, 'contenido', ...p);
export const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const listar = (dir, ext = '.json') => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort().map((f) => path.join(dir, f)) : []);
export const NIVELLS = ['B1', 'B2', 'C1', 'C2'];
export const AREES = ['us', 'lectura', 'co', 'escrit', 'oral'];
export const TIPUS = ['buits', 'transformacio', 'castellanismes', 'lexic', 'dictat', 'lectura', 'co'];
export const IDIOMES_EXPL = ['ca', 'es', 'en', 'ar', 'ro', 'fr'];
export const punts = () => leerJson(path.join(RAIZ, 'config', 'punts.json')).punts;

export function cargarTodo() {
  const regles = Object.fromEntries(listar(C('regles')).map((f) => { const r = leerJson(f); return [r.id, r]; }));
  const items = [];
  for (const n of NIVELLS) for (const f of listar(C('items', n))) for (const it of leerJson(f)) items.push({ ...it, _f: path.relative(RAIZ, f) });
  const textos = Object.fromEntries(listar(C('textos')).map((f) => { const t = leerJson(f); return [t.id, { ...t, _f: path.relative(RAIZ, f) }]; }));
  const tasques = Object.fromEntries(listar(C('tasques')).map((f) => { const t = leerJson(f); return [t.id, { ...t, _f: path.relative(RAIZ, f) }]; }));
  const simulacres = listar(C('simulacres')).map((f) => ({ ...leerJson(f), _f: path.relative(RAIZ, f) }));
  const oral = { sons: fs.existsSync(C('oral', 'sons.json')) ? leerJson(C('oral', 'sons.json')) : null, lectures: fs.existsSync(C('oral', 'lectures.json')) ? leerJson(C('oral', 'lectures.json')) : null };
  const seo = listar(C('seo')).map((f) => ({ ...leerJson(f), _f: path.relative(RAIZ, f) }));
  return { regles, items, textos, tasques, simulacres, oral, seo };
}
