import 'server-only';
import type { Nivell, Tasca } from '../tipos';
import { detectar, type ErrorText } from './regles';
import { comprovarLT } from './languagetool';
import { avaluarCriteris, hiHaLLM, type AvaluacioCriteris, type Criteri } from './llm';

/** Correcció escrita per criteris en menys de 60 segons: (1) regles pròpies, (2) LanguageTool amb les regles de Softcatalà per al que és
 *  segur, (3) model de llenguatge per a adequació, coherència i riquesa i per als errors prioritaris; quan dubta, «possible error».
 *  Sense model, els criteris 1, 2 i 4 s'estimen amb heurístiques i es marquen com a orientatius. */
export type ResultatCorreccio = {
  paraules: number; motor: 'regles' | 'lt' | 'lt+llm' | 'llm';
  errors: ErrorText[]; possibles: { fragment: string; dubte: string; offset?: number }[];
  criteris: Record<Criteri, { nota: number; comentari: string; orientativa: boolean }>;
  prioritaris: { fragment: string; forma: string; explicacio: string; regla?: string }[];
  nota: { punts: number; max: number; percent: number }; resum: string; reescriptura?: string;
  ms: number; tokensIn: number; tokensOut: number; ltOk: boolean;
};

const CONNECTORS = ['tanmateix', 'no obstant', 'per tant', 'a més', 'd\'una banda', 'd\'altra banda', 'en primer lloc', 'en segon lloc', 'finalment', 'per acabar', 'en conclusió', 'ja que', 'atès que', 'perquè', 'malgrat', 'tot i', 'en canvi', 'és a dir', 'per exemple', 'així doncs', 'en definitiva', 'quant a', 'pel que fa', 'd\'acord amb', 'amb tot', 'així mateix', 'mentre que', 'en resum'];
const FORMAL = ['vostè', 'vostès', 'benvolgut', 'benvolguda', 'senyor', 'senyora', 'atentament', 'cordialment', 'us agrairia', 'li agrairia', 'sol·licito', 'em plau', 'resto a la seva disposició', 'rebi', 'rebeu'];

function heuristiques(text: string, tasca: Tasca | null, errorsSegurs: number): Record<Criteri, { nota: number; comentari: string }> {
  const paraules = text.trim().split(/\s+/).filter(Boolean);
  const n = paraules.length;
  const baix = text.toLowerCase();
  const tipus = new Set(paraules.map((p) => p.toLowerCase().replace(/[^\p{L}']/gu, ''))).size;
  const ttr = n ? tipus / n : 0;
  const llargues = n ? paraules.filter((p) => p.length > 7).length / n : 0;
  const connectors = CONNECTORS.filter((c) => baix.includes(c)).length;
  const paragrafs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const formal = FORMAL.filter((f) => baix.includes(f)).length;
  let adequacio = 7;
  if (tasca) {
    if (n < tasca.paraulesMin * 0.8) adequacio -= 3; else if (n < tasca.paraulesMin) adequacio -= 1;
    if (n > tasca.paraulesMax * 1.25) adequacio -= 2;
    if (tasca.registre === 'formal' && formal === 0) adequacio -= 2;
    if ((tasca.tipus === 'correu' || tasca.tipus === 'carta-formal') && !/(hola|bon dia|benvolgu|senyor|estimad)/i.test(text)) adequacio -= 1;
    if ((tasca.tipus === 'correu' || tasca.tipus === 'carta-formal') && !/(salutacions|atentament|cordialment|fins aviat|una abraçada|records)/i.test(text)) adequacio -= 1;
  }
  const coherencia = Math.max(2, Math.min(9, 4 + Math.min(3, connectors) + (paragrafs >= 2 ? 1 : 0) + (n > 0 && /[.!?]/.test(text) ? 1 : 0)));
  const errPer100 = n ? (100 * errorsSegurs) / n : 0;
  const correccio = Math.max(1, Math.min(10, Math.round(10 - errPer100 * 2.2)));
  const riquesa = Math.max(2, Math.min(9, Math.round(3 + ttr * 6 + llargues * 8 + Math.min(2, connectors / 2))));
  return {
    adequacio: { nota: Math.max(1, Math.min(10, adequacio)), comentari: 'Estimació per extensió, registre i parts de la consigna.' },
    coherencia: { nota: coherencia, comentari: `Connectors detectats: ${connectors}; paràgrafs: ${paragrafs}.` },
    correccio: { nota: correccio, comentari: `${errorsSegurs} errors segurs en ${n} paraules.` },
    riquesa: { nota: riquesa, comentari: 'Estimació per varietat lèxica i llargada de les paraules.' },
  };
}

function fusionar(a: ErrorText[], b: ErrorText[]): ErrorText[] {
  const res = [...a];
  for (const e of b) if (!res.some((x) => e.offset < x.offset + x.length && x.offset < e.offset + e.length)) res.push(e);
  return res.sort((x, y) => x.offset - y.offset);
}

/** Nota sobre l'escala de l'examen: C1 àrea 1 = 40 punts (mínim 25); B1 i B2 expressió escrita en percentatge (mínim 60 % de la part). */
function notaExamen(nivell: Nivell, criteris: Record<Criteri, { nota: number }>): { punts: number; max: number; percent: number } {
  const mitjana = (criteris.adequacio.nota + criteris.coherencia.nota + criteris.correccio.nota * 1.5 + criteris.riquesa.nota) / 4.5;
  const percent = Math.round(mitjana * 10);
  if (nivell === 'C1') return { punts: Math.round(mitjana * 4 * 2) / 2, max: 40, percent };
  if (nivell === 'C2') return { punts: Math.round(mitjana * 5 * 2) / 2, max: 50, percent };
  return { punts: Math.round(mitjana * 2) / 2, max: 10, percent };
}

export async function corregir(nivell: Nivell, text: string, tasca: Tasca | null, idiomaExpl = 'ca'): Promise<ResultatCorreccio> {
  const inici = Date.now();
  const paraules = text.trim().split(/\s+/).filter(Boolean).length;
  const propis = detectar(text);
  const [lt, llm0] = await Promise.all([comprovarLT(text), Promise.resolve(null as AvaluacioCriteris | null)]);
  let errors = fusionar(propis, lt.errors.filter((e) => e.segur));
  const possibles: ResultatCorreccio['possibles'] = lt.errors.filter((e) => !e.segur).map((e) => ({ fragment: e.fragment, dubte: e.missatge.ca, offset: e.offset }));
  let llm: AvaluacioCriteris | null = llm0;
  if (hiHaLLM()) llm = await avaluarCriteris(nivell, tasca, text, errors, idiomaExpl, Math.max(5000, 50000 - (Date.now() - inici)));
  const h = heuristiques(text, tasca, errors.length);
  const criteris = {} as ResultatCorreccio['criteris'];
  for (const k of ['adequacio', 'coherencia', 'correccio', 'riquesa'] as Criteri[]) {
    if (llm) criteris[k] = { ...llm.criteris[k], orientativa: false };
    else criteris[k] = { ...h[k], orientativa: k !== 'correccio' };
  }
  // Correcció: si hi ha LLM, combina la seva nota amb la densitat d'errors segurs (el que és comprovable mana a mitges).
  if (llm) criteris.correccio = { nota: Math.round((llm.criteris.correccio.nota + h.correccio.nota) / 2), comentari: llm.criteris.correccio.comentari, orientativa: false };
  for (const p of llm?.possibles ?? []) if (!possibles.some((x) => x.fragment === p.fragment)) possibles.push({ fragment: p.fragment, dubte: p.dubte, offset: text.indexOf(p.fragment) >= 0 ? text.indexOf(p.fragment) : undefined });
  const prioritaris = (llm?.errorsPrioritaris?.length ? llm.errorsPrioritaris : errors.slice(0, 3).map((e) => ({ fragment: e.fragment, forma: e.forma, explicacio: idiomaExpl === 'es' ? e.missatge.es : e.missatge.ca, regla: e.regla }))).slice(0, 3);
  errors = errors.slice(0, 60);
  const motor: ResultatCorreccio['motor'] = llm ? (lt.ok ? 'lt+llm' : 'llm') : lt.ok ? 'lt' : 'regles';
  return { paraules, motor, errors, possibles: possibles.slice(0, 8), criteris, prioritaris, nota: notaExamen(nivell, criteris), resum: llm?.resum ?? '', reescriptura: llm?.reescriptura, ms: Date.now() - inici, tokensIn: llm?.tokensIn ?? 0, tokensOut: llm?.tokensOut ?? 0, ltOk: lt.ok };
}
