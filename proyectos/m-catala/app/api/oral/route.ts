import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { BANC } from '@/lib/datos';
import { puntuarLectura } from '@/lib/oral';
import { json, error, anonId, clauUs, limitar, consumirQuota, sumarUs } from '@/lib/http';
import pais from '@/config/paises/es.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_AUDIO = 2 * 1024 * 1024; // 2 MB ≈ 2 minuts de webm/opus
const segonsValids = (x: unknown) => { const n = Number(x); return Number.isFinite(n) ? Math.min(120, Math.max(5, Math.round(n))) : 5; };

/** Puntuació de pronúncia. Amb WHISPER_URL (Whisper català de Projecte AINA, API compatible amb /v1/audio/transcriptions) transcriu al servidor;
 *  si no, respon {metode:'navegador'} i el client fa servir el reconeixement del navegador i torna a cridar amb la transcripció.
 *  La quota es comprova ABANS de transcriure (la transcripció és el que costa) i es consumeix de manera atòmica. */
export async function POST(req: Request) {
  if (!(await limitar(req, 'oral', 20))) return error('massa peticions', 429);
  const u = await usuariActual();
  const premium = esPremium(u);
  const clau = clauUs(u?.id, await anonId());
  const ct = req.headers.get('content-type') ?? '';
  let lecturaId = '', transcripcio = '', segons = 5, metode: 'whisper' | 'navegador' = 'navegador';
  let audio: Blob | null = null;
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    lecturaId = String(fd.get('lecturaId') ?? '');
    segons = segonsValids(fd.get('segons'));
    const a = fd.get('audio');
    if (!process.env.WHISPER_URL || !(a instanceof Blob)) return json({ metode: 'navegador' });
    if (a.size > MAX_AUDIO) return error('massa gran', 413);
    audio = a;
  } else {
    const b = await req.json().catch(() => null);
    lecturaId = String(b?.lecturaId ?? ''); transcripcio = String(b?.transcripcio ?? '').slice(0, 4000); segons = segonsValids(b?.segons);
  }
  const lectura = BANC.oral.lectures.find((l) => l.id === lecturaId);
  if (!lectura) return error('lectura');
  const limitSegons = pais.gratis.oralMinutsMes * 60;
  if (hayDb()) {
    if (premium) await sumarUs(clau, 'oralSegons', segons);
    else if (!(await consumirQuota(clau, 'oralSegons', limitSegons, segons))) return error('quota', 402);
  }
  if (audio) {
    const f = new FormData();
    f.append('file', audio, 'lectura.webm');
    f.append('model', process.env.WHISPER_MODEL ?? 'projecte-aina/whisper-large-v3-ca-3catparla');
    f.append('language', 'ca');
    f.append('response_format', 'json');
    try {
      const r = await fetch(`${process.env.WHISPER_URL!.replace(/\/$/, '')}/v1/audio/transcriptions`, { method: 'POST', headers: process.env.WHISPER_API_KEY ? { Authorization: `Bearer ${process.env.WHISPER_API_KEY}` } : {}, body: f, signal: AbortSignal.timeout(25_000) });
      if (!r.ok) return json({ metode: 'navegador' });
      transcripcio = String(((await r.json()) as { text?: string }).text ?? '').slice(0, 4000);
      metode = 'whisper';
      if (hayDb()) { try { await sumarUs(clau, 'sttSegons', segons); } catch {} }
    } catch (e) {
      console.error('oral: whisper', e);
      return json({ metode: 'navegador' });
    }
  }
  return json(puntuarLectura(lectura, transcripcio, BANC.oral.sons, metode));
}
