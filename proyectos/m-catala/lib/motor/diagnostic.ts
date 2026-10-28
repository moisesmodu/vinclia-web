import type { Area, Examen, Item, Nivell, Punt } from '../tipos';

/** Diagnòstic adaptatiu (model logístic d'un paràmetre sobre la dificultat relativa de cada ítem) i probabilitat d'aprovar
 *  sobre l'estructura oficial: pesos per àrea, mínims per part i global (config/examens.json). */

export type RespostaDiag = { itemId: string; punt: string; dificultat: number; correcte: boolean; ms?: number };
export type NotesArea = Partial<Record<Area, number>>; // 0–100
export type ResultatDiagnostic = {
  data: string; nivell: Nivell; theta: number; probabilitat: number; global: number;
  parts: Record<'escrita' | 'oral', { nota: number; minim: number | null; ok: boolean }>;
  arees: { id: Area; nota: number; pes: number; minim?: number; estimada: boolean }[];
  febles: { punt: string; confianca: number }[]; sons: string[]; respostes: RespostaDiag[]; escritNota?: number; oralNota?: number | null;
};

const A = 1.7;
export const pCorrecte = (theta: number, dificultat: number) => 1 / (1 + Math.exp(-A * (theta - dificultat)));

/** Tria el següent ítem: el de dificultat més propera a theta entre els no vistos, prioritzant punts encara no coberts. */
export function seguentItem(pool: Item[], respostes: RespostaDiag[], theta: number, llavor = 0): Item | null {
  const vistos = new Set(respostes.map((r) => r.itemId));
  const puntsVistos = new Map<string, number>();
  for (const r of respostes) puntsVistos.set(r.punt, (puntsVistos.get(r.punt) ?? 0) + 1);
  const candidats = pool.filter((i) => !vistos.has(i.id));
  if (!candidats.length) return null;
  const minVist = Math.min(...candidats.map((i) => puntsVistos.get(i.punt) ?? 0));
  const prioritaris = candidats.filter((i) => (puntsVistos.get(i.punt) ?? 0) === minVist);
  prioritaris.sort((x, y) => Math.abs(x.dificultat - theta) - Math.abs(y.dificultat - theta) || ((hash(x.id + llavor) % 7) - (hash(y.id + llavor) % 7)));
  return prioritaris[0];
}

function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

/** Actualització de theta: pas decreixent amb el nombre de respostes (aproximació MAP ràpida, suficient per a 12–15 ítems). */
export function actualitzarTheta(theta: number, r: RespostaDiag, n: number): number {
  const k = 1.1 / (1 + 0.12 * n);
  const p = pCorrecte(theta, r.dificultat);
  return Math.max(-3, Math.min(3, theta + k * ((r.correcte ? 1 : 0) - p)));
}

/** Nota prevista d'ús de la llengua: encert esperat sobre tot el banc del nivell (no només els ítems vistos). */
export function notaUs(theta: number, bancNivell: Item[]): number {
  const us = bancNivell.filter((i) => i.area === 'us');
  if (!us.length) return Math.round(100 * pCorrecte(theta, 0));
  return Math.round((100 * us.reduce((s, i) => s + pCorrecte(theta, i.dificultat), 0)) / us.length);
}

/** Confiança per punt del programa (0–100) amb prior de 0,5 i 2 pseudoobservacions. */
export function confiancaPunts(respostes: { punt: string; correcte: boolean }[], punts: Punt[]): { punt: string; confianca: number; n: number }[] {
  return punts.map((p) => {
    const rs = respostes.filter((r) => r.punt === p.id);
    const ok = rs.filter((r) => r.correcte).length;
    return { punt: p.id, confianca: Math.round((100 * (ok + 1)) / (rs.length + 2)), n: rs.length };
  });
}

export function puntsFebles(respostes: RespostaDiag[], punts: Punt[], n = 3) {
  const c = confiancaPunts(respostes, punts);
  const ambDades = c.filter((x) => x.n > 0).sort((a, b) => a.confianca - b.confianca || b.n - a.n);
  const sense = punts.filter((p) => !ambDades.some((x) => x.punt === p.id)).sort((a, b) => b.pes - a.pes).map((p) => ({ punt: p.id, confianca: 50, n: 0 }));
  return [...ambDades, ...sense].slice(0, n).map(({ punt, confianca }) => ({ punt, confianca }));
}

const Phi = (z: number) => 1 / (1 + Math.exp(-1.702 * z));

/** Probabilitat d'aprovar: compara la nota prevista de cada part (i el global, si n'hi ha) amb el seu mínim oficial. σ ≈ 9 punts
 *  recull la incertesa del diagnòstic (12–15 ítems) i la variabilitat entre convocatòries. */
export function probabilitatAprovar(examen: Examen, notes: NotesArea): Pick<ResultatDiagnostic, 'probabilitat' | 'global' | 'parts' | 'arees'> {
  const SIGMA = 9;
  const arees = examen.arees.map((a) => {
    const nota = notes[a.id];
    const estimada = nota === undefined;
    return { id: a.id, nota: Math.round(nota ?? estimacio(a.id, notes)), pes: a.pes, minim: a.minimPunts && a.puntsMax ? Math.round((100 * a.minimPunts) / a.puntsMax) : undefined, estimada };
  });
  const pesTotal = arees.reduce((s, a) => s + a.pes, 0);
  const global = Math.round(arees.reduce((s, a) => s + a.pes * a.nota, 0) / pesTotal);
  const parts = {} as ResultatDiagnostic['parts'];
  let p = 1;
  for (const part of ['escrita', 'oral'] as const) {
    const as = examen.arees.filter((a) => a.part === part);
    const pes = as.reduce((s, a) => s + a.pes, 0);
    const nota = pes ? Math.round(as.reduce((s, a) => s + a.pes * (arees.find((x) => x.id === a.id)?.nota ?? 0), 0) / pes) : 0;
    const minim = examen.parts[part]?.minim ?? null;
    const ok = minim === null || nota >= minim;
    parts[part] = { nota, minim, ok };
    if (minim !== null) p *= Phi((nota - minim) / SIGMA);
  }
  for (const a of arees) if (a.minim !== undefined) p *= Phi((a.nota - a.minim) / SIGMA);
  if (examen.aptoGlobal) p *= Phi((global - examen.aptoGlobal) / SIGMA);
  return { probabilitat: Math.round(100 * Math.min(0.97, Math.max(0.02, p))), global, parts, arees };
}

/** Quan una àrea no s'ha mesurat (p. ex. l'oral al diagnòstic), s'estima a partir de les mesurades i es marca com a estimada. */
function estimacio(area: Area, notes: NotesArea): number {
  const vals = Object.values(notes).filter((v): v is number => typeof v === 'number');
  const mitjana = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 50;
  if (area === 'oral') return Math.max(25, mitjana - 8);
  if (area === 'co') return Math.min(95, mitjana + 4);
  return mitjana;
}

/** Sons difícils per defecte segons la llengua habitual (quan no hi ha dades orals). */
export function sonsPerDefecte(l1: string, idsDisponibles: string[]): string[] {
  const pref: Record<string, string[]> = {
    es: ['vocal-neutra', 'e-oberta', 'o-oberta', 'essa-sonora', 'ela-geminada', 'xeix'],
    ar: ['e-oberta', 'o-oberta', 'vocal-neutra', 'ela-geminada', 'ny', 'xeix'],
    ro: ['vocal-neutra', 'ela-velar', 'll', 'xeix', 'r-final'],
    fr: ['ll', 'r-final', 'ela-velar', 'ny', 'essa-sonora'],
    en: ['e-oberta', 'o-oberta', 'ela-geminada', 'll', 'r-final'],
  };
  const llista = (pref[l1] ?? pref.es).filter((s) => idsDisponibles.includes(s));
  const resta = idsDisponibles.filter((s) => !llista.includes(s));
  return [...llista, ...resta].slice(0, 3);
}
