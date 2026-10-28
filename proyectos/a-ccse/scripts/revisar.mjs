// Revisión lógica automática del banco: estructura, idioma, coherencia con la respuesta oficial y notas.
// Uso: npm run revisar   (sale con código 1 si hay errores; los avisos no bloquean)
import { readFileSync } from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const leer = (f) => JSON.parse(readFileSync(path.join(raiz, f), 'utf8'));
const { preguntas } = leer('content/preguntas.json');
const L = ['es', 'ar', 'fr', 'en', 'ro', 'zh', 'uk'];
const tr = Object.fromEntries(L.map((l) => [l, leer(`content/i18n/${l}.json`)]));
const revision = leer('content/revision.json');
const ESCRITURA = { ar: /[؀-ۿ]/, zh: /[一-鿿]/, uk: /[Ѐ-ӿ]/ };
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}\s]*$/u;
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VACIAS = new Set('para como esta este esto estos estas entre sobre desde hasta solo todos todas tiene tienen pero porque cuando donde otro otra otros otras puede pueden debe deben sus los las del una unos unas que con por mas muy'.split(' '));
const errores = [], avisos = [];
const largo = (l, s) => (l === 'zh' ? [...s].length : s.trim().split(/\s+/).length);
const LIM = { es: [25, 70], zh: [40, 140], otro: [22, 90] };
const vistas = new Map();

for (const p of preguntas) {
  const id = String(p.id);
  const correcta = p.opciones[p.respuesta];
  for (const l of L) {
    const x = tr[l][id];
    if (!x?.explicacion) { errores.push(`${id} ${l}: falta explicación`); continue; }
    if (l !== 'es') {
      if (!x.texto) errores.push(`${id} ${l}: falta traducción del enunciado`);
      if (!Array.isArray(x.opciones) || x.opciones.length !== p.opciones.length) errores.push(`${id} ${l}: número de opciones distinto`);
    }
    const [mn, mx] = LIM[l] ?? LIM.otro;
    const n = largo(l, x.explicacion);
    if (n < mn || n > mx) avisos.push(`${id} ${l}: longitud ${n} fuera de ${mn}-${mx}`);
    const re = ESCRITURA[l];
    if (re && !re.test(x.explicacion)) errores.push(`${id} ${l}: la explicación no está en la escritura esperada`);
    if (!re && l !== 'es' && /[؀-ۿ一-鿿Ѐ-ӿ]/.test(x.explicacion)) errores.push(`${id} ${l}: mezcla de escrituras`);
    if (/\*\*|^#|`/.test(x.explicacion)) errores.push(`${id} ${l}: markdown en el texto`);
    const k = x.explicacion.trim();
    if (vistas.has(k)) errores.push(`${id} ${l}: explicación duplicada de ${vistas.get(k)}`);
    vistas.set(k, `${id}/${l}`);
    if (revision[id]?.ok === false && !x.nota) errores.push(`${id} ${l}: revisión negativa sin nota`);
  }
  // Coherencia: la explicación en español debe nombrar la opción correcta (o, en V/F, su sentido)
  const es = norm(tr.es[id]?.explicacion ?? '');
  if (p.tarea === 2) {
    const sinNeg = es.replace(/no es (cierto|verdad|correcto)/g, ''); const v = /verdader|cierto|correcto/.test(sinNeg), f = /fals|no es cierto|no es asi|incorrect|no garantiza|no obliga|no permite|no tiene|no puede/.test(es);
    if (correcta.startsWith('Verdadero') && (!v || /\bes falso\b|^falso/.test(es))) avisos.push(`${id} es: V/F oficial «Verdadero» pero la explicación solo suena a falso`);
    if (correcta.startsWith('Falso') && !f) avisos.push(`${id} es: V/F oficial «Falso» pero la explicación no lo dice`);
  } else {
    const claves = norm(correcta).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((w) => (w.length > 3 || /\d/.test(w)) && !VACIAS.has(w));
    const lista = claves.length ? claves : norm(correcta).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    const alguna = lista.some((w) => es.includes(w.slice(0, Math.max(4, w.length - 2))));
    if (!alguna) avisos.push(`${id} es: no nombra la opción correcta «${correcta}»`);
  }
  if (!revision[id]) errores.push(`${id}: sin revisión`);
}
const neg = Object.entries(revision).filter(([, r]) => r.ok === false);
console.log(`Preguntas: ${preguntas.length} · lenguas: ${L.length} · revisiones negativas (con nota): ${neg.length}`);
console.log(`Errores: ${errores.length} · Avisos: ${avisos.length}`);
for (const e of errores) console.log('ERROR', e);
for (const a of avisos) console.log('AVISO', a);
process.exit(errores.length ? 1 : 0);
