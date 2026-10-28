import 'server-only';
import type { Nivell, Tasca } from '../tipos';
import type { ErrorText } from './regles';

/** Avaluació per criteris de la rúbrica oficial amb un model de llenguatge. Ordre: BSC (Salamandra/ALIA, endpoint compatible amb OpenAI,
 *  BSC_API_URL) → Anthropic (claude-sonnet-5-5). Retorna null si no hi ha cap proveïdor: aleshores s'usen heurístiques. */
export type Criteri = 'adequacio' | 'coherencia' | 'correccio' | 'riquesa';
export type AvaluacioCriteris = {
  criteris: Record<Criteri, { nota: number; comentari: string }>;
  errorsPrioritaris: { fragment: string; forma: string; explicacio: string; regla?: string }[];
  possibles: { fragment: string; dubte: string }[];
  resum: string; reescriptura?: string;
  model: string; tokensIn: number; tokensOut: number; ms: number;
};

export const hiHaLLM = () => !!(process.env.BSC_API_URL || process.env.ANTHROPIC_API_KEY);

const RUBRICA = `Rúbrica oficial (DPL) per a l'expressió escrita, 4 criteris de 0 a 10:
- adequació: compleix la tasca (tipus de text, destinatari, registre, extensió demanada, totes les parts de la consigna);
- coherència i cohesió: idees ordenades i completes, paràgrafs, connectors adequats, referents clars, puntuació;
- correcció: ortografia, morfologia, sintaxi i lèxic normatius (penalitza sobretot calcs del castellà, pronoms febles, accents, apòstrof, per/per a, ser/estar);
- riquesa: varietat i precisió del lèxic i de les estructures, fraseologia genuïna, registre sostingut.`;

function prompt(nivell: Nivell, tasca: Tasca | null, text: string, errorsSegurs: ErrorText[], idiomaExpl: string) {
  const errs = errorsSegurs.slice(0, 25).map((e) => `- «${e.fragment}» → «${e.forma}»`).join('\n') || '- (cap)';
  return `Ets examinador/a dels certificats oficials de català de la Direcció General de Política Lingüística. Avalua aquest text d'un candidat al nivell ${nivell} amb la rúbrica oficial. Sigues exigent com a l'examen real, però només marca com a error el que és segur; el que dubtis, posa-ho a «possibles».
${RUBRICA}
Tasca: ${tasca ? `${tasca.tipus}. ${tasca.enunciat} Extensió: ${tasca.paraulesMin}-${tasca.paraulesMax} paraules. Registre: ${tasca.registre ?? 'adequat a la situació'}.` : 'text lliure del nivell'}
Errors segurs ja detectats per LanguageTool i regles (no cal repetir-los, però tingues-los en compte per al criteri de correcció):
${errs}
Text del candidat (${text.trim().split(/\s+/).length} paraules):
"""
${text.slice(0, 6000)}
"""
Respon NOMÉS amb JSON vàlid, sense cap text fora, amb aquest format exacte. Els comentaris i explicacions, en aquest idioma: ${idiomaExpl} (breus, màxim 2 frases, dirigits al candidat de tu). La «forma» sempre en català normatiu.
{"criteris":{"adequacio":{"nota":0,"comentari":""},"coherencia":{"nota":0,"comentari":""},"correccio":{"nota":0,"comentari":""},"riquesa":{"nota":0,"comentari":""}},"errorsPrioritaris":[{"fragment":"","forma":"","explicacio":"","regla":"id curt de la regla (pronoms-febles, per-per-a, ser-estar, accents, apostrof, castellanisme, concordanca, preposicions, relatius, lexic, puntuacio)"}],"possibles":[{"fragment":"","dubte":""}],"resum":"","reescriptura":"la primera frase del text reescrita amb les 3 correccions prioritàries aplicades"}`;
}

async function viaBSC(p: string, ms: number): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number } | null> {
  if (!process.env.BSC_API_URL) return null;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const model = process.env.BSC_MODEL ?? 'BSC-LT/salamandra-7b-instruct';
    const r = await fetch(`${process.env.BSC_API_URL.replace(/\/$/, '')}/v1/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.BSC_API_KEY ? { Authorization: `Bearer ${process.env.BSC_API_KEY}` } : {}) }, body: JSON.stringify({ model, messages: [{ role: 'user', content: p }], temperature: 0.1, max_tokens: 1200 }), signal: ctrl.signal });
    if (!r.ok) return null;
    const j = await r.json();
    return { text: j.choices?.[0]?.message?.content ?? '', model, tokensIn: j.usage?.prompt_tokens ?? 0, tokensOut: j.usage?.completion_tokens ?? 0 };
  } catch { return null; } finally { clearTimeout(t); }
}

async function viaAnthropic(p: string, ms: number): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: ms });
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5';
    const r = await client.messages.create({ model, max_tokens: 1200, messages: [{ role: 'user', content: p }] });
    const text = r.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text).join('');
    return { text, model, tokensIn: r.usage.input_tokens, tokensOut: r.usage.output_tokens };
  } catch { return null; }
}

export async function avaluarCriteris(nivell: Nivell, tasca: Tasca | null, text: string, errorsSegurs: ErrorText[], idiomaExpl = 'ca', msMax = 40000): Promise<AvaluacioCriteris | null> {
  const inici = Date.now();
  const p = prompt(nivell, tasca, text, errorsSegurs, idiomaExpl);
  const r = (await viaBSC(p, msMax)) ?? (await viaAnthropic(p, msMax));
  if (!r) return null;
  try {
    const json = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
    const n = (x: unknown) => Math.max(0, Math.min(10, Math.round(Number(x) || 0)));
    const c = json.criteris ?? {};
    return {
      criteris: { adequacio: { nota: n(c.adequacio?.nota), comentari: String(c.adequacio?.comentari ?? '') }, coherencia: { nota: n(c.coherencia?.nota), comentari: String(c.coherencia?.comentari ?? '') }, correccio: { nota: n(c.correccio?.nota), comentari: String(c.correccio?.comentari ?? '') }, riquesa: { nota: n(c.riquesa?.nota), comentari: String(c.riquesa?.comentari ?? '') } },
      errorsPrioritaris: (json.errorsPrioritaris ?? []).slice(0, 5).map((e: Record<string, string>) => ({ fragment: String(e.fragment ?? ''), forma: String(e.forma ?? ''), explicacio: String(e.explicacio ?? ''), regla: e.regla ? String(e.regla) : undefined })),
      possibles: (json.possibles ?? []).slice(0, 6).map((e: Record<string, string>) => ({ fragment: String(e.fragment ?? ''), dubte: String(e.dubte ?? '') })),
      resum: String(json.resum ?? ''), reescriptura: json.reescriptura ? String(json.reescriptura) : undefined,
      model: r.model, tokensIn: r.tokensIn, tokensOut: r.tokensOut, ms: Date.now() - inici,
    };
  } catch { return null; }
}
