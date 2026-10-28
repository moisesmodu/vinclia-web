'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Area, Nivell, Perfil } from './tipos';
import type { ResultatDiagnostic } from './motor/diagnostic';
import type { Pla } from './motor/pla';
import { ratxaBuida, type EstatRatxa } from './motor/ratxa';
import type { Targeta } from './motor/repas';

/** Estat del navegador (sense registre): perfil, diagnòstic, pla, ratxa, targetes FSRS, respostes, quotes. Amb compte es sincronitza
 *  amb /api/progres (l'últim que escriu guanya per camp de data). */
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
export const mesISO = () => new Date().toISOString().slice(0, 7);
export const estatBuit = (): Estat => ({ v: 1, diagnostics: [], ratxa: ratxaBuida(), targetes: {}, respostes: [], sessions: [], simulacres: [], quotes: { mes: mesISO(), correccions: 0, simulacres: 0, oralSegons: 0 }, correccions: [], oral: [], actualitzat: new Date().toISOString() });

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
function programarSync(e: Estat) {
  if (teSessio === false) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const r = await fetch('/api/progres', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nivell: e.perfil?.nivell ?? 'cap', dades: e }) });
      teSessio = r.status !== 401;
    } catch {}
  }, 1500);
}

/** Baixa l'estat del servidor si hi ha sessió i és més recent (en entrar en un dispositiu nou). */
export async function sincronitzarDesDelServidor(): Promise<Estat | null> {
  try {
    const r = await fetch('/api/progres');
    if (r.status === 401) { teSessio = false; return null; }
    teSessio = true;
    const j = await r.json();
    const remot = j?.dades as Estat | undefined;
    if (!remot?.v) return null;
    const local = llegirEstat();
    if (new Date(remot.actualitzat).getTime() > new Date(local.actualitzat).getTime() + 2000) { try { localStorage.setItem(CLAU, JSON.stringify(remot)); } catch {} for (const o of oients) o(); return remot; }
    return local;
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
export const esborrarEstat = () => { try { localStorage.removeItem(CLAU); } catch {} for (const o of oients) o(); };
