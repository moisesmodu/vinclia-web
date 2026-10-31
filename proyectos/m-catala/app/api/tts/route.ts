import { sintetitzar, hiHaTTSServidor, textDelBanc, FRASE_DEMO, type Veu } from '@/lib/veu';
import { hayDb } from '@/lib/db';
import { usuariActual } from '@/lib/auth';
import { anonId, clauUs, limitar, sumarUs } from '@/lib/http';

export const dynamic = 'force-dynamic';

const VEUS: Veu[] = ['central', 'nord-occidental', 'home', 'dona'];

/** Àudio dels dictats i de la comprensió oral. 204 = que ho llegeixi la veu del navegador (gratis).
 *  Només textos del banc: ?id=<itemId|textId|lecturaId> o ?h=<sha256 del text exacte>; ?demo=1 és la frase fixa de la landing (l'única que pot
 *  anar a ElevenLabs). Mai arriba text lliure del client a un proveïdor de pagament. Límit per IP i per navegador (galeta anònima signada). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const demo = url.searchParams.get('demo') === '1';
  const veuParam = url.searchParams.get('veu') ?? 'central';
  const veu = (VEUS as string[]).includes(veuParam) ? (veuParam as Veu) : 'central';
  if (!hiHaTTSServidor() && !demo) return new Response(null, { status: 204 });
  if (!(await limitar(req, demo ? 'tts-demo' : 'tts', demo ? 6 : 40, demo ? 3600_000 : 60_000))) return new Response(null, { status: 429 });
  const anon = await anonId();
  if (!(await limitar(req, demo ? 'tts-demo-anon' : 'tts-anon', demo ? 6 : 60, demo ? 3600_000 : 60_000, anon))) return new Response(null, { status: 429 });
  const clauText = demo ? 'demo' : (url.searchParams.get('id') ?? url.searchParams.get('h') ?? '').slice(0, 80);
  const text = demo ? FRASE_DEMO : clauText ? textDelBanc(clauText) : null;
  if (!text) return new Response(null, { status: 404 });
  const r = await sintetitzar(text, veu, demo);
  if (!r) return new Response(null, { status: 204 });
  if (hayDb()) { try { const u = await usuariActual(); await sumarUs(clauUs(u?.id, anon), 'ttsCaracters', r.caracters); } catch (e) { console.error('tts: registre', e); } }
  return new Response(new Uint8Array(r.audio), { headers: { 'Content-Type': r.mime, 'Cache-Control': 'public, max-age=2592000, immutable', 'X-TTS': r.proveidor } });
}
