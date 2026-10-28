import 'server-only';
import type { ErrorText } from './regles';

/** LanguageTool amb les regles de Softcatalà. Per defecte l'API pública (20 peticions/min, 20 KB); en local o autoallotjat, LANGUAGETOOL_URL. */
export const urlLT = () => (process.env.LANGUAGETOOL_URL ?? 'https://api.languagetool.org/v2').replace(/\/$/, '');

type Match = { message: string; shortMessage?: string; replacements: { value: string }[]; offset: number; length: number; rule: { id: string; description?: string; issueType?: string; category: { id: string; name: string } } };

const CATEGORIES_INSEGURES = new Set(['STYLE', 'TYPOGRAPHY', 'REDUNDANCY', 'CASING', 'MISC', 'SEMANTICS', 'PUNCTUATION']);
/** Mapa aproximat de categories de LT a les fitxes de contenido/regles (per al botó «Per què?»). */
const REGLA_PER_ID: [RegExp, string][] = [
  [/TENIR_QUE|HAVER_DE|HI_HA_QUE/, 'perifrasis-obligacio'], [/LO_NEUTRE|LO_QUE|ARTICLE_NEUTRE/, 'calcs-sintactics'], [/PER_PER_A|PER_A_QUE|PER_A_INFINITIU/, 'per-per-a'],
  [/ACCENT|DIACRITIC|ES_VERB|SE_SABER|MES_MESOS|DIERESI/, 'accent-diacritic-dieresi'], [/APOSTROF|CONTRACCI|L_APOSTROF|LA_DAVANT/, 'apostrof-article'],
  [/PRONOM|EN_HI|HI_HA_EN|PRONOMS_FEBLES|COMBINACI/, 'pronoms-en-hi'], [/SER_ESTAR|ESTAR_SER/, 'ser-estar'], [/PREPOSICIO|A_EN|CAIGUDA|CANVI_PREP/, 'preposicions-a-en'],
  [/RELATIU|EL_QUAL|QUE_QUE/, 'relatius-que-que'], [/CONCORDAN|GENERE|PLURAL|SINGULAR/, 'concordanca-genere-nombre'], [/SUBJUNTIU|INDICATIU|CONDICIONAL/, 'subjuntiu-usos'],
  [/CASTELLANISME|BARBARISME|CA_SIMPLE_REPLACE|CALC|ANGLICISME/, 'barbarismes-lexic-1'], [/VERB|INCOATIU|VELAR|PARTICIPI/, 'verbs-incoatius-irregulars'],
  [/COMA|PUNTUACI|MAJUSCULA|MINUSCULA|UPPERCASE/, 'puntuacio-coma'], [/ORTOGRAFIA|MORFOLOGIK|SPELL/, 'ortografia-essa-sorda-sonora-x'],
];
const reglaDe = (id: string, cat: string) => REGLA_PER_ID.find(([re]) => re.test(id) || re.test(cat))?.[1] ?? 'ortografia-essa-sorda-sonora-x';

export async function comprovarLT(text: string, msMax = 20000): Promise<{ errors: ErrorText[]; ok: boolean }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), msMax);
  try {
    const body = new URLSearchParams({ language: 'ca-ES', text, level: 'default', enabledOnly: 'false' });
    const r = await fetch(`${urlLT()}/check`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body, signal: ctrl.signal });
    if (!r.ok) return { errors: [], ok: false };
    const j = (await r.json()) as { matches: Match[] };
    const errors: ErrorText[] = j.matches.map((m) => {
      const cat = m.rule.category?.id ?? '';
      const segur = !CATEGORIES_INSEGURES.has(cat) && m.rule.issueType !== 'style' && m.replacements.length > 0 && m.replacements.length <= 3;
      return { offset: m.offset, length: m.length, fragment: text.slice(m.offset, m.offset + m.length), forma: m.replacements[0]?.value ?? '', regla: reglaDe(m.rule.id, cat), missatge: { ca: m.message, es: m.message }, segur, origen: 'lt' as const, ltId: m.rule.id, categoria: m.rule.category?.name } as ErrorText & { ltId: string; categoria?: string };
    });
    return { errors, ok: true };
  } catch {
    return { errors: [], ok: false };
  } finally {
    clearTimeout(t);
  }
}
