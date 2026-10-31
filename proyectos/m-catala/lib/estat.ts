'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Area, Nivell, Perfil } from './tipos';
import type { ResultatDiagnostic } from './motor/diagnostic';
import type { Pla } from './motor/pla';
import { ratxaBuida, type EstatRatxa } from './motor/ratxa';
import type { Targeta } from './motor/repas';

/** Estat del navegador (sense registre): perfil, diagnòstic, pla, ratxa, targetes FSRS, respostes, quotes. Amb compte es sincronitza
 *  amb /api/progres fusionant per camp (targetes per id amb el `due` més recent; respostes, sessions, simulacres, correccions i dies de
 *  ratxa per unió), de manera que un segon dispositiu no esborra el que s'ha fet sense connexió. */
export type Resposta = { itemId: string; punt: string; area: Area; correcte: boolean; data: string; dificultat?: number };
export type SessioFeta = { data: string; tipus: string; minuts: number };
export type ResultatSimulacreLocal = { id: string; data: string; nivell: Nivell; nota: number; apte: boolean; arees: Record<string, number> };
export type Estat = {
  v: 1; perfil?: Perfil; diagnostic?: ResultatDiagnostic; diagnostics: ResultatDiagnostic[]; pla?: Pla; ratxa: EstatRatxa;
  targetes: Record<string, Targeta>; respostes: Resposta[]; sessions: SessioFeta[]; simulacres: ResultatSimulacreLocal[];
  quotes: { mes: string; correccions: number; simulacres: number; oralSegons: number }; correccions: { data: string; tascaId: string | null; percent: number }[];
  oral: { data: string; lecturaId: string; global: number; pitjors: string[] }[]; actualitzat: string;
};

const CLAU = 'aprova:estat:v1';
/** Galeta llegible (sense dades) que el servidor posa en iniciar sessió i treu en tancar-la: evita cridar /api/progres sense sessió. */
const COOKIE_FLAG = 'aprova_te_sessio';
export const mesISO = () => new Date().toISOString().slice(0, 7);
export const estatBuit = (): Estat => ({ v: 1, diagnostics: [], ratxa: ratxaBuida(), targetes: {}, respostes: [], sessions: [], simulacres: [], quotes: { mes: mesISO(), correccions: 0, simulacres: 0, oralSegons: 0 }, correccions: [], oral: [], actualitzat: new Date().toISOString() });

export const hiHaSessio = (): boolean => { try { return typeof document !== 'undefined' && new RegExp(`(^|;\\s*)${COOKIE_FLAG}=1`).test(document.cookie); } catch { return false; } };

export function llegirEstat(): Estat {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CLAU) : null;
    if (!raw) return estatBuit();
    const e = { ...estatBuit(), ...JSON.parse(raw) } as Estat;
    if (e.quotes.mes !== mesISO()) e.quotes = { mes: mesISO(), correccions: 0, simulacres: 0, oralSegons: 0 };
    return e;
  } catch { return estatBuit(); }
}

const oients = new Set<() => void>();
export function escriureEstat(e: Estat) {
  e.actualitzat = new Date().toISOString();
  try { localStorage.setItem(CLAU, JSON.stringify(e)); } catch {}
  for (const o of oients) o();
  programarSync(e);
}

let timer: ReturnType<typeof setTimeout> | null = null;
let teSessio: boolean | null = null;
/** Després d'iniciar sessió al mateix document (navegació client), torna a permetre la sincronització. */
export const reiniciarSync = () => { teSessio = null; };
function programarSync(e: Estat) {
  if (!hiHaSessio() || teSessio === false) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const r = await fetch('/api/progres', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nivell: e.perfil?.nivell ?? 'cap', dades: e }) });
      teSessio = r.status !== 401;
      if (r.status === 413) console.warn('progres: estat massa gran, no s\'ha sincronitzat');
    } catch (e) { console.warn('progres: sense connexió', e); }
  }, 1500);
}

const ms = (iso: string | undefined) => (iso ? new Date(iso).getTime() || 0 : 0);
const unioPer = <T,>(a: T[], b: T[], clau: (x: T) => string, max: number, ordre: (x: T) => string): T[] => {
  const m = new Map<string, T>();
  for (const x of [...a, ...b]) m.set(clau(x), x);
  return [...m.values()].sort((x, y) => ordre(x).localeCompare(ordre(y))).slice(-max);
};

/** Fusió de dos estats (local i servidor) camp a camp. Cap costat «guanya» en bloc. */
export function fusionarEstats(local: Estat, remot: Estat): Estat {
  const nou = ms(remot.actualitzat) > ms(local.actualitzat) ? remot : local; // per als camps escalars (perfil, pla, diagnòstic actual)
  const targetes: Record<string, Targeta> = { ...remot.targetes };
  for (const [id, t] of Object.entries(local.targetes)) {
    const r = targetes[id];
    if (!r || ms(String(t.card?.due)) >= ms(String(r.card?.due))) targetes[id] = t;
  }
  const dies = Array.from(new Set([...(local.ratxa?.dies ?? []), ...(remot.ratxa?.dies ?? [])])).sort().slice(-400);
  const congelacions: Record<string, string[]> = { ...remot.ratxa?.congelacions };
  for (const [mes, ds] of Object.entries(local.ratxa?.congelacions ?? {})) congelacions[mes] = Array.from(new Set([...(congelacions[mes] ?? []), ...ds])).sort();
  const ratxa: EstatRatxa = { dies, congelacions, compromis: nou.ratxa?.compromis ?? local.ratxa?.compromis ?? remot.ratxa?.compromis ?? null, compromisVist: !!(local.ratxa?.compromisVist || remot.ratxa?.compromisVist) };
  const quotes = local.quotes.mes === remot.quotes?.mes
    ? { mes: local.quotes.mes, correccions: Math.max(local.quotes.correccions, remot.quotes.correccions), simulacres: Math.max(local.quotes.simulacres, remot.quotes.simulacres), oralSegons: Math.max(local.quotes.oralSegons, remot.quotes.oralSegons) }
    : local.quotes.mes === mesISO() ? local.quotes : remot.quotes?.mes === mesISO() ? remot.quotes : local.quotes;
  const diagnostics = unioPer([...(remot.diagnostics ?? []), ...(remot.diagnostic ? [remot.diagnostic] : [])], [...(local.diagnostics ?? []), ...(local.diagnostic ? [local.diagnostic] : [])], (d) => d.data, 20, (d) => d.data);
  return {
    ...nou,
    v: 1,
    perfil: nou.perfil ?? local.perfil ?? remot.perfil,
    pla: nou.pla ?? local.pla ?? remot.pla,
    diagnostic: diagnostics[diagnostics.length - 1] ?? nou.diagnostic,
    diagnostics,
    ratxa,
    targetes,
    respostes: unioPer(remot.respostes ?? [], local.respostes ?? [], (r) => `${r.itemId}|${r.data}`, 2000, (r) => r.data),
    sessions: unioPer(remot.sessions ?? [], local.sessions ?? [], (s) => `${s.data}|${s.tipus}|${s.minuts}`, 400, (s) => s.data),
    simulacres: unioPer(remot.simulacres ?? [], local.simulacres ?? [], (s) => `${s.id}|${s.data}`, 30, (s) => s.data),
    correccions: unioPer(remot.correccions ?? [], local.correccions ?? [], (c) => `${c.tascaId}|${c.data}`, 100, (c) => c.data),
    oral: unioPer(remot.oral ?? [], local.oral ?? [], (o) => `${o.lecturaId}|${o.data}`, 100, (o) => o.data),
    quotes,
    actualitzat: new Date(Math.max(ms(local.actualitzat), ms(remot.actualitzat))).toISOString(),
  };
}

/** Baixa l'estat del servidor si hi ha sessió i el fusiona amb el local (en entrar en un dispositiu nou o tornar d'un altre).
 *  Sense galeta de sessió no es crida /api/progres (evita el 401 a cada pàgina). */
export async function sincronitzarDesDelServidor(): Promise<Estat | null> {
  if (!hiHaSessio()) { teSessio = false; return null; }
  try {
    const r = await fetch('/api/progres');
    if (r.status === 401) { teSessio = false; return null; }
    if (!r.ok) return null;
    teSessio = true;
    const j = await r.json();
    const remot = j?.dades as Estat | undefined;
    if (!remot?.v) { programarSync(llegirEstat()); return null; }
    const local = llegirEstat();
    const fusio = fusionarEstats(local, remot);
    const canviaLocal = JSON.stringify(fusio) !== JSON.stringify(local);
    if (canviaLocal) { try { localStorage.setItem(CLAU, JSON.stringify(fusio)); } catch {} for (const o of oients) o(); }
    if (canviaLocal || JSON.stringify(fusio) !== JSON.stringify(remot)) programarSync(fusio);
    return fusio;
  } catch { return null; }
}

export function useEstat(): [Estat | null, (f: (e: Estat) => Estat) => void] {
  const [estat, setEstat] = useState<Estat | null>(null);
  useEffect(() => {
    const refrescar = () => setEstat(llegirEstat());
    refrescar();
    oients.add(refrescar);
    sincronitzarDesDelServidor();
    return () => { oients.delete(refrescar); };
  }, []);
  const actualitzar = useCallback((f: (e: Estat) => Estat) => { const nou = f(llegirEstat()); escriureEstat(nou); }, []);
  return [estat, actualitzar];
}

/** Identificador anònim per a la cohort i les quotes del servidor: el posa la galeta aprova_anon (servidor). */
export const esborrarEstat = () => { try { localStorage.removeItem(CLAU); } catch {} teSessio = null; for (const o of oients) o(); };

/** En tancar sessió: estat local, banc en memòria del navegador i memòria cau del service worker (dades privades en dispositius compartits). */
export const esborrarTotLocal = () => {
  esborrarEstat();
  try { for (const k of Object.keys(localStorage)) if (k.startsWith('aprova:')) localStorage.removeItem(k); } catch {}
  try { navigator.serviceWorker?.controller?.postMessage({ tipus: 'buidar' }); } catch {}
  try { if (typeof caches !== 'undefined') caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))); } catch {}
};
