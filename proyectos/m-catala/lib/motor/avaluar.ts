import type { Item } from '../tipos';

/** Normalització per comparar respostes: majúscules, apòstrofs tipogràfics, espais i puntuació final. */
export function normalitzar(s: string): string {
  return s.normalize('NFC').replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').replace(/\s*'\s*/g, "'").replace(/[.!?;:,]+$/g, '').trim().toLowerCase();
}

export const senseAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export type Avaluacio = { correcte: boolean; esperada: string[]; detall?: { paraula: string; ok: boolean }[]; precisio?: number; quasi?: boolean };

/** Opcions de comparació paraula a paraula. `tolerancia` = lletres de diferència (Levenshtein) admeses en paraules de més de
 *  `minLletres` lletres; `ignorarAccents` compara sense diacrítics (només per detectar el cas «només accents», mai per donar per bo). */
export type OpcionsAlineament = { tolerancia?: number; minLletres?: number; ignorarAccents?: boolean };

/** Corregeix una resposta segons el tipus d'ítem. `quasi` = només difereix en accents (es marca incorrecte però s'explica: «només accents»).
 *  - Opcions: índex exacte.
 *  - Dictat: comparació paraula a paraula **exacta** (tolerància 0): els accents, b/v, s/ss, l·l i apòstrofs són precisament el que
 *    s'avalua; correcte si ≥ 90 % de les paraules coincideixen.
 *  - Transformació: igualtat exacta amb alguna forma acceptada; si no, s'admet 1 lletra de diferència només en paraules de més de 8 lletres
 *    (errades de tecleig en formes llargues) i mai quan la diferència és només un accent.
 *  - Buits i resta: igualtat exacta després de normalitzar. */
export function avaluar(item: Item, resposta: string | number | null): Avaluacio {
  if (Array.isArray(item.opcions)) {
    const idx = typeof resposta === 'number' ? resposta : item.opcions.findIndex((o) => normalitzar(o) === normalitzar(String(resposta ?? '')));
    const ok = idx === item.resposta;
    return { correcte: ok, esperada: [item.opcions[item.resposta as number]] };
  }
  if (item.tipus === 'dictat') {
    const objectiu = item.text ?? '';
    const escrit = String(resposta ?? '');
    const detall = alinearParaules(objectiu, escrit, { tolerancia: 0 });
    const ok = detall.filter((d) => d.ok).length;
    const precisio = detall.length ? ok / detall.length : 0;
    const correcte = precisio >= 0.9 && detall.length > 0;
    let quasi = false;
    if (!correcte && detall.length) {
      const senseAcc = alinearParaules(objectiu, escrit, { tolerancia: 0, ignorarAccents: true });
      quasi = senseAcc.filter((d) => d.ok).length / senseAcc.length >= 0.9;
    }
    return { correcte, esperada: [objectiu], detall, precisio, quasi };
  }
  const acceptades = ([] as string[]).concat(item.resposta as string | string[]).concat(item.variants ?? []);
  const r = normalitzar(String(resposta ?? ''));
  let ok = acceptades.some((a) => normalitzar(a) === r);
  if (!ok && item.tipus === 'transformacio') ok = acceptades.some((a) => igualsAmbTolerancia(normalitzar(a), r));
  const quasi = !ok && acceptades.some((a) => senseAccents(normalitzar(a)) === senseAccents(r));
  return { correcte: ok, esperada: acceptades, quasi };
}

/** Dues frases són «iguals amb tolerància» si tenen les mateixes paraules i cada parella coincideix o bé difereix en una sola lletra en una
 *  paraula de més de 8 lletres, sempre que la diferència no sigui només d'accents. */
export function igualsAmbTolerancia(a: string, b: string, minLletres = 8): boolean {
  const ta = a.split(/\s+/).filter(Boolean), tb = b.split(/\s+/).filter(Boolean);
  if (ta.length !== tb.length) return false;
  return ta.every((x, i) => {
    const y = tb[i];
    if (x === y) return true;
    if (senseAccents(x) === senseAccents(y)) return false; // només accents: no s'admet
    return x.length > minLletres && y.length > minLletres && levenshtein(x, y) <= 1;
  });
}

/** Alineament per paraules (LCS) entre l'objectiu i el que s'ha escrit o reconegut. Per defecte (alineació de l'ASR a l'oral) tolera una
 *  lletra de diferència en paraules de més de 5 lletres; el dictat passa `tolerancia: 0`. */
export function alinearParaules(objectiu: string, escrit: string, opcions: OpcionsAlineament = {}): { paraula: string; ok: boolean }[] {
  const { tolerancia = 1, minLletres = 5, ignorarAccents = false } = opcions;
  const prep = (s: string) => (ignorarAccents ? senseAccents(s) : s);
  const tok = (s: string) => normalitzar(s).replace(/[^\p{L}\p{N}' -]/gu, '').split(/[\s-]+/).filter(Boolean);
  const a = tok(objectiu), b = tok(escrit);
  const igual = (x: string, y: string) => { const px = prep(x), py = prep(y); return px === py || (tolerancia > 0 && px.length > minLletres && levenshtein(px, py) <= tolerancia); };
  const n = a.length, m = b.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = igual(a[i], b[j]) ? 1 + L[i + 1][j + 1] : Math.max(L[i + 1][j], L[i][j + 1]);
  const res: { paraula: string; ok: boolean }[] = [];
  let i = 0, j = 0;
  while (i < n) {
    if (j < m && igual(a[i], b[j])) { res.push({ paraula: a[i], ok: true }); i++; j++; }
    else if (j < m && L[i + 1][j] < L[i][j + 1]) j++;
    else { res.push({ paraula: a[i], ok: false }); i++; }
  }
  return res;
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Enunciat amb el buit substituït per la resposta (per mostrar la frase correcta). */
export const ompleBuit = (enunciat: string, resposta: string) => enunciat.replace('___', resposta);

/** Ordre pseudoaleatori estable per dia (perquè les sessions no repeteixin l'ordre però siguin reproduïbles). */
export function barrejar<T>(arr: T[], llavor: string): T[] {
  let h = 2166136261;
  for (const c of llavor) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const r = () => { h |= 0; h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
