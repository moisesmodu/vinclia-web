import type { Examen, Idioma } from '../tipos';
import type { ResultatDiagnostic } from './diagnostic';

/** Una frase que diu què vol dir la probabilitat i què fer: la condició que més limita (part sota mínim, àrea sota mínim o global).
 *  Només compta el que s'ha mesurat: les àrees `estimada` no limiten mai i, si l'oral no s'ha mesurat (`oralMesurat` false o, en
 *  resultats antics sense el camp, oral estimada), la frase ho diu i parla de la part escrita. */
export function fraseResultat(r: ResultatDiagnostic, ex: Examen, idioma: Idioma, nomArea: (id: string) => string, nomPunt: (id: string) => string): string {
  const ca = idioma === 'ca';
  const oralMesurat = r.oralMesurat ?? !r.arees.some((a) => a.id === 'oral' && a.estimada);
  const limitants: { nom: string; falta: number }[] = [];
  for (const p of ['escrita', 'oral'] as const) {
    const x = r.parts[p];
    if (x.estimada || (p === 'oral' && !oralMesurat)) continue;
    if (x.minim !== null && x.nota < x.minim) limitants.push({ nom: ca ? (p === 'oral' ? "l'oral" : 'la part escrita') : (p === 'oral' ? 'el oral' : 'la parte escrita'), falta: x.minim - x.nota });
  }
  for (const a of r.arees) if (!a.estimada && a.minim !== undefined && a.nota < a.minim) limitants.push({ nom: nomArea(a.id).toLowerCase(), falta: a.minim - a.nota });
  if (ex.aptoGlobal) {
    const global = oralMesurat ? r.global : (r.globalEscrit ?? r.global);
    if (global < ex.aptoGlobal) limitants.push({ nom: 'el global', falta: ex.aptoGlobal - global });
  }
  const feble = r.febles[0] ? nomPunt(r.febles[0].punt).toLowerCase() : '';
  const senseOral = '';
  if (!limitants.length) {
    if (oralMesurat) return ca ? `Avui aprovaries. El que més et pot fer caure: ${feble}. El pla ho consolida.` : `Hoy aprobarías. Lo que más te puede hacer caer: ${feble}. El plan lo consolida.`;
    return ca ? `Avui aprovaries la part escrita${senseOral}. El que més et pot fer caure: ${feble}. El pla ho consolida.` : `Hoy aprobarías la parte escrita${senseOral}. Lo que más te puede hacer caer: ${feble}. El plan lo consolida.`;
  }
  const pitjor = limitants.sort((a, b) => b.falta - a.falta)[0];
  const punts = Math.round(pitjor.falta);
  const que = oralMesurat ? (ca ? '' : '') : (ca ? ' la part escrita' : ' la parte escrita');
  if (r.probabilitat >= 40) return ca ? `Estàs a prop d'aprovar${que}: et falten uns ${punts} punts a ${pitjor.nom}. Comença per ${feble}.` : `Estás cerca de aprobar${que}: te faltan unos ${punts} puntos en ${pitjor.nom}. Empieza por ${feble}.`;
  return ca ? `Avui no aprovaries${que}: et falten ${punts} punts a ${pitjor.nom}. La sessió d'avui ataca ${feble}.` : `Hoy no aprobarías${que}: te faltan ${punts} puntos en ${pitjor.nom}. La sesión de hoy ataca ${feble}.`;
}
