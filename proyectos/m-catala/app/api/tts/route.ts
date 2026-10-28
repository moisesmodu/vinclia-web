import { sintetitzar, hiHaTTSServidor, type Veu } from '@/lib/veu';
import { db, hayDb } from '@/lib/db';
import { usuariActual } from '@/lib/auth';
import { anonId, mesActual } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Àudio dels dictats i de la comprensió oral. 204 = que ho llegeixi la veu del navegador (gratis). Els textos venen del banc, no de l'usuari. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = (url.searchParams.get('text') ?? '').slice(0, 2000);
  const veu = (url.searchParams.get('veu') ?? 'central') as Veu;
  const demo = url.searchParams.get('demo') === '1';
  if (!text || (!hiHaTTSServidor() && !demo)) return new Response(null, { status: 204 });
  const r = await sintetitzar(text, veu, demo);
  if (!r) return new Response(null, { status: 204 });
  if (hayDb()) { try { const u = await usuariActual(); const clau = `${u?.id ?? (await anonId())}:${mesActual()}`; await db.us.upsert({ where: { clau }, update: { ttsCaracters: { increment: r.caracters } }, create: { clau, ttsCaracters: r.caracters } }); } catch {} }
  return new Response(new Uint8Array(r.audio), { headers: { 'Content-Type': r.mime, 'Cache-Control': 'public, max-age=2592000, immutable', 'X-TTS': r.proveidor } });
}
