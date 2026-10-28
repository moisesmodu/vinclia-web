import type { Examen, Idioma } from '../tipos';
import type { ResultatDiagnostic } from './diagnostic';

/** Una frase que diu què vol dir la probabilitat i què fer: la condició que més limita (part sota mínim, àrea sota mínim o global). */
export function fraseResultat(r: ResultatDiagnostic, ex: Examen, idioma: Idioma, nomArea: (id: string) => string, nomPunt: (id: string) => string): string {
  const ca = idioma === 'ca';
  const limitants: { nom: string; falta: number }[] = [];
  for (const p of ['escrita', 'oral'] as const) { const x = r.parts[p]; if (x.minim !== null && x.nota < x.minim) limitants.push({ nom: ca ? (p === 'oral' ? "l'oral" : 'la part escrita') : (p === 'oral' ? 'el oral' : 'la parte escrita'), falta: x.minim - x.nota }); }
  for (const a of r.arees) if (a.minim !== undefined && a.nota < a.minim && a.id !== 'oral') limitants.push({ nom: nomArea(a.id).toLowerCase(), falta: a.minim - a.nota });
  if (ex.aptoGlobal && r.global < ex.aptoGlobal) limitants.push({ nom: ca ? 'el global' : 'el global', falta: ex.aptoGlobal - r.global });
  const feble = r.febles[0] ? nomPunt(r.febles[0].punt).toLowerCase() : '';
  if (!limitants.length) return ca ? `Avui aprovaries. El que més et pot fer caure: ${feble}. El pla ho consolida.` : `Hoy aprobarías. Lo que más te puede hacer caer: ${feble}. El plan lo consolida.`;
  const pitjor = limitants.sort((a, b) => b.falta - a.falta)[0];
  const punts = Math.round(pitjor.falta);
  if (r.probabilitat >= 40) return ca ? `Estàs a prop: et falten uns ${punts} punts a ${pitjor.nom}. Comença per ${feble}.` : `Estás cerca: te faltan unos ${punts} puntos en ${pitjor.nom}. Empieza por ${feble}.`;
  return ca ? `Avui series no apte per ${pitjor.nom}, a ${punts} punts del mínim. La sessió d'avui ataca ${feble}.` : `Hoy serías no apto por ${pitjor.nom}, a ${punts} puntos del mínimo. La sesión de hoy ataca ${feble}.`;
}
