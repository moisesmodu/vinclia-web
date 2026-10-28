import type { Area, Convocatoria, Examen, Nivell } from '../tipos';
import type { ResultatDiagnostic } from './diagnostic';
import { avuiISO } from './ratxa';

/** Pla cap a la data de la convocatòria: sessions de 10 a 20 minuts amb 40 % de repàs dels errors propis, 40 % de l'àrea més feble
 *  ponderada pel seu pes a l'examen i 20 % de producció; minisimulacre setmanal; simulacre complet la setmana abans. */
export type BlocPla = { tipus: 'repas' | 'feble' | 'produccio'; area: Area; minuts: number };
export type SessioPla = { data: string; tipus: 'normal' | 'minisimulacre' | 'simulacre' | 'descans'; blocs: BlocPla[]; minuts: number };
export type Pla = { creat: string; nivell: Nivell; convocatoria: string | null; dataProva: string | null; minuts: number; sessions: SessioPla[]; areaFeble: Area; recalibrat: string };

const dies = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 864e5);
const suma = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return avuiISO(d); };

/** Àrea on més es guanya: distància al mínim (o a 70) multiplicada pel pes a l'examen. Només àrees entrenables a la sessió 1. */
export function areaFeble(ex: Examen, diag: ResultatDiagnostic | undefined): Area {
  const entrenables: Area[] = ['us', 'escrit', 'lectura', 'co'];
  let millor: Area = 'us', max = -1;
  for (const a of ex.arees) {
    if (!entrenables.includes(a.id)) continue;
    const nota = diag?.arees.find((x) => x.id === a.id)?.nota ?? 50;
    const minimArea = a.minimPunts && a.puntsMax ? (100 * a.minimPunts) / a.puntsMax : null;
    const objectiu = (minimArea ?? ex.parts[a.part]?.minim ?? 65) + 8;
    const guany = Math.max(0, objectiu - nota) * a.pes;
    if (guany > max) { max = guany; millor = a.id; }
  }
  return millor;
}

export function generarPla(ex: Examen, nivell: Nivell, conv: Convocatoria | undefined, minuts: number, diag: ResultatDiagnostic | undefined, avui = avuiISO()): Pla {
  const dataProva = conv?.prova && conv.prova >= avui ? conv.prova : null;
  const total = dataProva ? Math.min(200, dies(avui, dataProva)) : 90;
  const feble = areaFeble(ex, diag);
  const sessions: SessioPla[] = [];
  for (let i = 0; i < total; i++) {
    const data = suma(avui, i);
    const dow = new Date(data + 'T12:00:00').getDay();
    const ultimaSetmana = dataProva ? dies(data, dataProva) <= 7 : false;
    if (dataProva && dies(data, dataProva) === 0) break;
    if (dow === 0 && ultimaSetmana) { sessions.push({ data, tipus: 'simulacre', blocs: [], minuts: ex.arees.filter((a) => a.part === 'escrita').reduce((s, a) => s + a.minuts, 0) }); continue; }
    if (dow === 0 && i > 0) { sessions.push({ data, tipus: 'minisimulacre', blocs: [], minuts: 20 }); continue; }
    const repas = Math.round(minuts * 0.4), produccio = Math.max(2, Math.round(minuts * 0.2));
    const blocs: BlocPla[] = [
      { tipus: 'repas', area: 'us', minuts: repas },
      { tipus: 'feble', area: feble, minuts: minuts - repas - produccio },
      { tipus: 'produccio', area: dow % 2 === 0 ? 'escrit' : 'oral', minuts: produccio },
    ];
    sessions.push({ data, tipus: 'normal', blocs, minuts });
  }
  return { creat: avui, nivell, convocatoria: conv?.id ?? null, dataProva, minuts, sessions, areaFeble: feble, recalibrat: avui };
}

export const sessioDe = (pla: Pla | undefined, data = avuiISO()) => pla?.sessions.find((s) => s.data === data);

/** Estat de la finestra d'inscripció de la convocatòria (avís de 14 dies abans i durant la finestra). */
export function estatInscripcio(conv: Convocatoria | undefined, avui = avuiISO()): { estat: 'abans' | 'oberta' | 'tancada' | 'sense'; dies: number } {
  if (!conv?.inscripcio) return { estat: 'sense', dies: 0 };
  const { inici, fi } = conv.inscripcio;
  if (avui < inici) return { estat: 'abans', dies: dies(avui, inici) };
  if (avui <= fi) return { estat: 'oberta', dies: dies(avui, fi) };
  return { estat: 'tancada', dies: 0 };
}

export const diesFinsProva = (conv: Convocatoria | undefined, avui = avuiISO()) => (conv?.prova ? dies(avui, conv.prova) : null);

/** Recalibratge setmanal: canvia l'àrea feble segons les darreres respostes, sense reiniciar el pla. */
export function recalibrar(pla: Pla, ex: Examen, diag: ResultatDiagnostic | undefined, notesRecents: Partial<Record<Area, number>>, avui = avuiISO()): Pla {
  if (dies(pla.recalibrat, avui) < 7) return pla;
  const d = diag ? { ...diag, arees: diag.arees.map((a) => ({ ...a, nota: notesRecents[a.id] !== undefined ? Math.round((a.nota + 2 * (notesRecents[a.id] as number)) / 3) : a.nota })) } : diag;
  const feble = areaFeble(ex, d);
  return { ...pla, areaFeble: feble, recalibrat: avui, sessions: pla.sessions.map((s) => (s.data >= avui && s.tipus === 'normal' ? { ...s, blocs: s.blocs.map((b) => (b.tipus === 'feble' ? { ...b, area: feble } : b)) } : s)) };
}
