import 'server-only';
import crypto from 'node:crypto';
import { BANC } from './datos';

/** Síntesi de veu en català, barata. Proveïdor per TTS_PROVEIDOR: google (ca-ES-Standard), azure (ca-ES-*Neural), matxa (servei propi de
 *  Matxa-TTS de Projecte AINA, només si la llicència ho permet), elevenlabs (NOMÉS la demo de la landing) o navegador (res al servidor:
 *  el mòbil llegeix amb la seva veu). Retorna null quan toca al navegador.
 *  Cap text lliure del client arriba a un proveïdor: /api/tts només accepta ids o hashos de textos del banc (vegeu textDelBanc). */
export type Veu = 'central' | 'nord-occidental' | 'home' | 'dona';
export type ResultatTTS = { audio: Buffer; mime: string; proveidor: string; caracters: number; costEur: number };

const cache = new Map<string, ResultatTTS>();
export const hiHaTTSServidor = () => ['google', 'azure', 'matxa'].includes(process.env.TTS_PROVEIDOR ?? '') || (process.env.TTS_PROVEIDOR === 'elevenlabs' && process.env.ELEVENLABS_DEMO === '1');

/** Frase fixa de la demo de la landing (components/DemoVeu.tsx): l'única que pot anar a ElevenLabs. */
export const FRASE_DEMO = 'Hi ha que acabar-ho avui. — No: cal acabar-ho avui. Hi ha que és un calc del castellà.';

export const hashText = (text: string) => crypto.createHash('sha256').update(text).digest('hex');
const sensePersonatges = (s: string) => s.replace(/^[AB]:\s*/gm, '');

/** Índex dels textos que es poden sintetitzar: dictats, textos de comprensió oral i lectura, lectures orals i la frase de demo.
 *  Clau per id (itemId, textId, lecturaId) i per sha256 del text exacte (el client envia el hash del text que vol escoltar). */
let index: Map<string, string> | null = null;
function indexTextos(): Map<string, string> {
  if (index) return index;
  const m = new Map<string, string>();
  const posa = (id: string | null, text: string | undefined) => { if (!text) return; if (id) m.set(id, text); m.set(hashText(text), text); };
  for (const i of BANC.items) if (i.tipus === 'dictat' && i.text) posa(i.id, i.text);
  for (const t of Object.values(BANC.textos)) { posa(t.id, t.text); posa(null, sensePersonatges(t.text)); }
  for (const l of BANC.oral.lectures) posa(l.id, l.text);
  posa('demo', FRASE_DEMO);
  index = m;
  return m;
}
/** Text del banc per id o per hash; null si no és del banc. */
export const textDelBanc = (idOHash: string): string | null => indexTextos().get(idOHash) ?? null;

// Preus de llista (octubre 2026) per documentar el cost per usuari: Google Standard 4 $/M caràcters, Azure Neural 16 $/M, Matxa autoallotjat ≈ 0 variable.
const COST_PER_MILIO = { google: 3.7, azure: 15, matxa: 0.2, elevenlabs: 150 } as Record<string, number>;
const TEMPS_MAX = 8000;

export async function sintetitzar(text: string, veu: Veu = 'central', demo = false): Promise<ResultatTTS | null> {
  const prov = demo && process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : process.env.TTS_PROVEIDOR ?? 'navegador';
  if (prov === 'navegador' || (prov === 'elevenlabs' && !demo)) return null;
  if (demo && text !== FRASE_DEMO) return null;
  const clau = crypto.createHash('sha1').update(`${prov}|${veu}|${text}`).digest('hex');
  const c = cache.get(clau);
  if (c) return c;
  let audio: Buffer | null = null, mime = 'audio/mpeg';
  const signal = AbortSignal.timeout(TEMPS_MAX);
  try {
    if (prov === 'google' && process.env.GOOGLE_TTS_API_KEY) {
      const name = veu === 'home' ? 'ca-ES-Standard-B' : 'ca-ES-Standard-A';
      const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: { text }, voice: { languageCode: 'ca-ES', name }, audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 } }), signal });
      if (r.ok) audio = Buffer.from(((await r.json()) as { audioContent: string }).audioContent, 'base64');
    } else if (prov === 'azure' && process.env.AZURE_TTS_KEY) {
      const name = veu === 'home' ? 'ca-ES-EnricNeural' : veu === 'nord-occidental' ? 'ca-ES-AlbaNeural' : 'ca-ES-JoanaNeural';
      const ssml = `<speak version='1.0' xml:lang='ca-ES'><voice name='${name}'><prosody rate='-5%'>${text.replace(/[<&>]/g, '')}</prosody></voice></speak>`;
      const r = await fetch(`https://${process.env.AZURE_TTS_REGION ?? 'westeurope'}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_TTS_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3' }, body: ssml, signal });
      if (r.ok) audio = Buffer.from(await r.arrayBuffer());
    } else if (prov === 'matxa' && process.env.MATXA_URL) {
      // Servei propi (projecte-aina/tts-api): POST {text, voice, accent} → wav. Accents: central, nord-occidental, balear, valencià.
      const r = await fetch(`${process.env.MATXA_URL.replace(/\/$/, '')}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: veu === 'home' ? 'pau' : 'olga', accent: veu === 'nord-occidental' ? 'nord-occidental' : 'central', type: 'text' }), signal });
      if (r.ok) { audio = Buffer.from(await r.arrayBuffer()); mime = r.headers.get('content-type') ?? 'audio/wav'; }
    } else if (prov === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL'}?output_format=mp3_44100_64`, { method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', language_code: 'ca' }), signal });
      if (r.ok) audio = Buffer.from(await r.arrayBuffer());
    }
  } catch (e) {
    console.error('tts', prov, e);
    audio = null;
  }
  if (!audio) return null;
  const res: ResultatTTS = { audio, mime, proveidor: prov, caracters: text.length, costEur: (text.length / 1e6) * (COST_PER_MILIO[prov] ?? 0) };
  if (cache.size > 500) cache.clear();
  cache.set(clau, res);
  return res;
}
