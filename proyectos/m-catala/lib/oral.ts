import type { LecturaOral, So } from './tipos';
import { alinearParaules, normalitzar } from './motor/avaluar';

/** Puntuació de pronúncia per so a partir del reconeixement de veu: per cada paraula clau del text, si el reconeixedor l'ha entès bé,
 *  els sons que treballa compten com a encert. És una aproximació (el que no s'entén, sol ser el so marcat); l'alineament forçat
 *  per fonema (MMS / ctc-forced-aligner sobre el servei de Whisper) és de la sessió 2. */
export type ResultatOral = {
  global: number; paraulesOk: number; paraulesTotal: number; transcripcio: string;
  sons: { id: string; puntuacio: number; paraules: { paraula: string; ok: boolean }[] }[];
  pitjors: string[]; metode: 'whisper' | 'navegador';
};

export function puntuarLectura(lectura: LecturaOral, transcripcio: string, sons: So[], metode: ResultatOral['metode']): ResultatOral {
  const alineat = alinearParaules(lectura.text, transcripcio);
  const okPer = new Map<string, boolean[]>();
  for (const a of alineat) okPer.set(a.paraula, [...(okPer.get(a.paraula) ?? []), a.ok]);
  const perSo = new Map<string, { paraula: string; ok: boolean }[]>();
  let okTot = 0, tot = 0;
  for (const [paraula, ids] of Object.entries(lectura.paraulesClau)) {
    const p = normalitzar(paraula);
    const estats = okPer.get(p) ?? [];
    const ok = estats.length ? estats.some(Boolean) : false;
    tot++; if (ok) okTot++;
    for (const id of ids) perSo.set(id, [...(perSo.get(id) ?? []), { paraula, ok }]);
  }
  const res = sons.filter((s) => perSo.has(s.id)).map((s) => { const ps = perSo.get(s.id) ?? []; return { id: s.id, puntuacio: Math.round((100 * ps.filter((p) => p.ok).length) / Math.max(1, ps.length)), paraules: ps }; });
  const totalParaules = alineat.length, okParaules = alineat.filter((a) => a.ok).length;
  const global = tot ? Math.round(0.7 * (100 * okTot / tot) + 0.3 * (100 * okParaules / Math.max(1, totalParaules))) : Math.round(100 * okParaules / Math.max(1, totalParaules));
  const pitjors = [...res].sort((a, b) => a.puntuacio - b.puntuacio).slice(0, 3).map((s) => s.id);
  return { global, paraulesOk: okTot, paraulesTotal: tot, transcripcio, sons: res, pitjors, metode };
}

/** Converteix la puntuació oral (0–100) en nota prevista de l'àrea oral del diagnòstic (pronúncia pesa un terç de la rúbrica oral). */
export const notaOralDesDePronuncia = (p: number) => Math.round(35 + 0.55 * p);
