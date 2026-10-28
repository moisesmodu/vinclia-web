import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from 'ts-fsrs';

/** Repàs espaiat amb FSRS (ts-fsrs): cada error d'ús de la llengua es converteix en targeta. */
export type Targeta = { itemId: string; punt: string; card: Card; historial: { data: string; correcte: boolean }[] };

const f = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9, maximum_interval: 180 }));

const reviu = (c: Card): Card => ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });

export function novaTargeta(itemId: string, punt: string, ara = new Date()): Targeta {
  return { itemId, punt, card: createEmptyCard(ara), historial: [] };
}

/** Actualitza la targeta amb el resultat. Un error → Again; un encert ràpid → Good (Easy si ja estava en revisió i amb bona estabilitat). */
export function revisar(t: Targeta, correcte: boolean, ara = new Date()): Targeta {
  const card = reviu(t.card);
  const grau = !correcte ? Rating.Again : card.state === State.Review && card.stability > 10 ? Rating.Easy : Rating.Good;
  const r = f.next(card, ara, grau);
  return { ...t, card: r.card, historial: [...t.historial.slice(-19), { data: ara.toISOString(), correcte }] };
}

export function pendents(targetes: Record<string, Targeta>, ara = new Date()): Targeta[] {
  return Object.values(targetes).filter((t) => new Date(t.card.due).getTime() <= ara.getTime() && t.card.state !== State.New || (t.card.state === State.New && t.historial.length > 0)).sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
}

/** Probabilitat de recordar ara (retrievability), 0–1. */
export function retencio(t: Targeta, ara = new Date()): number {
  const c = reviu(t.card);
  if (c.state === State.New) return 0.3;
  const r = f.get_retrievability(c, ara, false);
  return typeof r === 'number' ? r : 0.5;
}
