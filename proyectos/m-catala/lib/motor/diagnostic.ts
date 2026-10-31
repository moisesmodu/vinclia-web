import type { Area, Examen, Item, Nivell, Punt } from '../tipos';

/** Diagnòstic adaptatiu (model logístic d'un paràmetre sobre la dificultat relativa de cada ítem) i probabilitat d'aprovar
 *  sobre l'estructura oficial: pesos per àrea, mínims per part, per àrea i global (config/examens.json). */

export type RespostaDiag = { itemId: string; punt: string; dificultat: number; correcte: boolean; ms?: number };
export type NotesArea = Partial<Record<Area, number>>; // 0–100
export type PartExamen = 'escrita' | 'oral';
export type ResultatDiagnostic = {
  data: string; nivell: Nivell; theta: number;
  /** Probabilitat (0–100) de complir alhora totes les condicions d'aptitud. Si `oralMesurat` és false, només les de la part escrita. */
  probabilitat: number;
  /** Global ponderat amb totes les àrees (l'oral estimada si no s'ha mesurat): informatiu. */
  global: number;
  /** Global ponderat només amb les àrees mesurades de la part escrita: és el que entra a la probabilitat quan no hi ha oral. */
  globalEscrit: number;
  /** false quan l'oral no s'ha mesurat (diagnòstic sense lectura en veu alta, simulacre escrit). */
  oralMesurat: boolean;
  parts: Record<PartExamen, { nota: number; minim: number | null; ok: boolean; estimada?: boolean }>;
  arees: { id: Area; nota: number; pes: number; minim?: number; estimada: boolean }[];
  /** Condicions efectives d'aptitud que s'han simulat (les que depenen d'àrees no mesurades no hi són). */
  condicions?: CondicioExamen[];
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

/** Calibratge θ → nota d'ús de la llengua (%).
 *  L'escala θ del banc té el 0 a la dificultat típica del certificat (motor/ESQUEMA.md: dificultat 0 = «típic del nivell»), de manera que
 *  un candidat amb θ = 0 encerta la meitat dels ítems típics: s'ancora el 50 % a θ = 0. El segon punt d'ancoratge és ≈ 85 % a θ = 1,5
 *  (candidat clarament per sobre del nivell), que fixa el pendent k = logit(0,85)/1,5 ≈ 1,156. Resultats: θ = −1,5 → 15 %, θ = 1 → 76 %,
 *  θ = 3 (sostre) → 97 %. La corba és independent de la distribució de dificultats del banc: la mitjana d'encert esperat sobre el banc,
 *  que s'usava abans, inflava la nota a B1/B2 perquè les dificultats hi són estretes (−0,6…0,8) i amb 12 encerts donava 97–99 %.
 *  Aquest és l'únic mapatge θ → nota: diagnòstic i simulacre l'han de fer servir sempre que converteixin un θ en percentatge (al
 *  simulacre la nota d'ús és el percentatge d'encerts directe, que viu ja en aquesta mateixa escala: 50 % ⇔ θ = 0). */
export const K_THETA_NOTA = Math.log(0.85 / 0.15) / 1.5;
export const notaDesDeTheta = (theta: number): number => Math.round(100 / (1 + Math.exp(-K_THETA_NOTA * theta)));
export const thetaDesDeNota = (percent: number): number => { const p = Math.min(0.99, Math.max(0.01, percent / 100)); return Math.log(p / (1 - p)) / K_THETA_NOTA; };

/** Nota prevista d'ús de la llengua a partir de θ. El banc ja no intervé en el mapatge (vegeu `notaDesDeTheta`); el paràmetre es manté
 *  per compatibilitat amb els components que el passen. */
export function notaUs(theta: number, _bancNivell?: Item[]): number {
  return notaDesDeTheta(theta);
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

// ---------------------------------------------------------------------------------------------------------------------------------
// Probabilitat d'aprovar
// ---------------------------------------------------------------------------------------------------------------------------------

/** Una condició d'aptitud de l'examen, en percentatge: una part sencera (B1/B2: 60 % de l'escrita i 60 % de l'oral), una àrea amb
 *  mínim propi (C1: àrea 1 ≥ 25/40, àrea 3 ≥ 19/30) o el global (C1 ≥ 65 %, C2 ≥ 70 %). */
export type CondicioExamen = { id: string; tipus: 'part' | 'area' | 'global'; part: PartExamen | 'global'; area?: Area; minim: number };

/** Condicions efectives d'un nivell a partir de config/examens.json, sense duplicats: si una part té un mínim i està formada per una sola
 *  àrea que també en té (el cas de l'oral a C1 abans de la correcció de la configuració), només compta la de l'àrea. */
export function condicionsExamen(examen: Examen): CondicioExamen[] {
  const res: CondicioExamen[] = [];
  for (const a of examen.arees) if (a.minimPunts && a.puntsMax) res.push({ id: `area:${a.id}`, tipus: 'area', part: a.part, area: a.id, minim: (100 * a.minimPunts) / a.puntsMax });
  for (const part of ['escrita', 'oral'] as const) {
    const minim = examen.parts[part]?.minim ?? null;
    if (minim === null) continue;
    const areesPart = examen.arees.filter((a) => a.part === part);
    const duplicada = areesPart.length === 1 && res.some((c) => c.tipus === 'area' && c.area === areesPart[0].id);
    if (!duplicada) res.push({ id: `part:${part}`, tipus: 'part', part, minim });
  }
  if (examen.aptoGlobal) res.push({ id: 'global', tipus: 'global', part: 'global', minim: examen.aptoGlobal });
  return res;
}

/** Paràmetres de la simulació. σ = 9 punts per àrea recull la incertesa d'un diagnòstic de 12–15 ítems i la variabilitat entre
 *  convocatòries. ρ és la correlació entre els errors de les àrees d'un mateix candidat (model d'un factor comú: nivell general i estat
 *  del dia). Amb ρ = 0,5 un candidat exactament a tots els mínims surt al 32–36 %; amb ρ = 0,8, al 40–42 %, que és el que es vol
 *  comunicar («estàs al límit, meitat i meitat») i és coherent amb les correlacions entre components que publiquen els exàmens de
 *  llengua (0,6–0,8). Les mostres són deterministes (llavor derivada de les notes) perquè el resultat no balli entre renderitzats. */
export const SIMULACIO = { mostres: 2000, sigma: 9, rho: 0.8 } as const;

function rngMulberry(llavor: number) {
  let a = llavor >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gaussiana = (r: () => number) => { const u = Math.max(r(), 1e-12), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

type AreaNota = { id: Area; nota: number; pes: number; part: PartExamen; estimada: boolean };

const mitjanaPonderada = (xs: { nota: number; pes: number }[]) => { const pes = xs.reduce((s, x) => s + x.pes, 0); return pes ? xs.reduce((s, x) => s + x.pes * x.nota, 0) / pes : 0; };

/** Probabilitat (0–1) que es compleixin alhora totes les condicions, per simulació Monte Carlo amb soroll gaussià correlacionat sobre les
 *  àrees mesurades. Les parts i el global es calculen a cada mostra només amb les àrees mesurades (pesos renormalitzats). */
export function simularAprovat(arees: AreaNota[], condicions: CondicioExamen[], opcions: Partial<typeof SIMULACIO> & { llavor?: number } = {}): number {
  const { mostres, sigma, rho } = { ...SIMULACIO, ...opcions };
  const mesurades = arees.filter((a) => !a.estimada);
  if (!mesurades.length || !condicions.length) return 0.5;
  const llavor = opcions.llavor ?? mesurades.reduce((h, a) => (h * 31 + Math.round(a.nota) + a.id.length) | 0, 7) >>> 0;
  const r = rngMulberry(llavor);
  const sqRho = Math.sqrt(rho), sqResta = Math.sqrt(1 - rho);
  let ok = 0;
  const mostra = mesurades.map((a) => ({ ...a }));
  for (let i = 0; i < mostres; i++) {
    const comu = gaussiana(r);
    for (let k = 0; k < mostra.length; k++) mostra[k].nota = mesurades[k].nota + sigma * (sqRho * comu + sqResta * gaussiana(r));
    let totes = true;
    for (const c of condicions) {
      let nota: number;
      if (c.tipus === 'area') { const a = mostra.find((x) => x.id === c.area); if (!a) continue; nota = a.nota; }
      else if (c.tipus === 'part') nota = mitjanaPonderada(mostra.filter((x) => x.part === c.part));
      else nota = mitjanaPonderada(mostra);
      if (nota < c.minim) { totes = false; break; }
    }
    if (totes) ok++;
  }
  return ok / mostres;
}

export type ProbabilitatAprovar = Pick<ResultatDiagnostic, 'probabilitat' | 'global' | 'globalEscrit' | 'oralMesurat' | 'parts' | 'arees' | 'condicions'>;

/** Probabilitat d'aprovar a partir de les notes previstes per àrea (0–100).
 *  - Les condicions surten de `condicionsExamen` (una sola escala, sense comptar l'oral dues vegades).
 *  - Si l'oral no s'ha mesurat (`notes.oral` absent): `oralMesurat = false`, les condicions que depenen de l'oral es descarten i el
 *    global que es comprova és el de la part escrita (`globalEscrit`). No s'inventa cap nota oral per a la probabilitat; a `arees`
 *    l'oral apareix amb la mitjana de les àrees mesurades i `estimada: true`, només a títol informatiu.
 *  - Les altres àrees no mesurades (p. ex. comprensió oral sense àudio) s'estimen igual, es marquen `estimada` i no entren a la simulació.
 *  La probabilitat és la fracció de mostres que compleixen totes les condicions alhora (vegeu `SIMULACIO`), acotada a [2, 97]. */
export function probabilitatAprovar(examen: Examen, notes: NotesArea, opcions: Partial<typeof SIMULACIO> & { llavor?: number } = {}): ProbabilitatAprovar {
  const mesurades = Object.entries(notes).filter((e): e is [Area, number] => typeof e[1] === 'number');
  const mitjana = mesurades.length ? mesurades.reduce((s, [, v]) => s + v, 0) / mesurades.length : 50;
  const areesNota: AreaNota[] = examen.arees.map((a) => {
    const nota = notes[a.id];
    return { id: a.id, nota: Math.round(nota ?? mitjana), pes: a.pes, part: a.part, estimada: nota === undefined };
  });
  const oralMesurat = areesNota.some((a) => a.part === 'oral' && !a.estimada);
  const arees = areesNota.map((a) => { const def = examen.arees.find((x) => x.id === a.id)!; return { id: a.id, nota: a.nota, pes: a.pes, minim: def.minimPunts && def.puntsMax ? Math.round((100 * def.minimPunts) / def.puntsMax) : undefined, estimada: a.estimada }; });
  const global = Math.round(mitjanaPonderada(areesNota));
  const escritesMesurades = areesNota.filter((a) => a.part === 'escrita' && !a.estimada);
  const globalEscrit = Math.round(mitjanaPonderada(escritesMesurades.length ? escritesMesurades : areesNota.filter((a) => a.part === 'escrita')));
  const parts = {} as ResultatDiagnostic['parts'];
  for (const part of ['escrita', 'oral'] as const) {
    const as = areesNota.filter((a) => a.part === part);
    const mes = as.filter((a) => !a.estimada);
    const nota = Math.round(mitjanaPonderada(mes.length ? mes : as));
    const minim = examen.parts[part]?.minim ?? null;
    parts[part] = { nota, minim, ok: minim === null || nota >= minim, estimada: as.length > 0 && mes.length === 0 };
  }
  const mesuradesIds = new Set(areesNota.filter((a) => !a.estimada).map((a) => a.id));
  const condicions = condicionsExamen(examen).filter((c) => {
    if (c.tipus === 'area') return mesuradesIds.has(c.area!);
    if (c.tipus === 'part') return c.part === 'escrita' ? escritesMesurades.length > 0 : oralMesurat;
    return true; // global: amb oral, el global sencer; sense oral, el de la part escrita (la simulació només té les àrees mesurades)
  });
  const p = simularAprovat(areesNota, condicions, opcions);
  return { probabilitat: Math.round(100 * Math.min(0.97, Math.max(0.02, p))), global, globalEscrit, oralMesurat, parts, arees, condicions };
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
