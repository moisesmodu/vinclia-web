import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { BANC } from '@/lib/datos';
import { puntuarLectura } from '@/lib/oral';
import { json, error, anonId, mesActual, limitar } from '@/lib/http';
import pais from '@/config/paises/es.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Puntuació de pronúncia. Amb WHISPER_URL (Whisper català de Projecte AINA, API compatible amb /v1/audio/transcriptions) transcriu al servidor;
 *  si no, respon {metode:'navegador'} i el client fa servir el reconeixement del navegador i torna a cridar amb la transcripció. */
export async function POST(req: Request) {
  if (!limitar(req, 'oral', 20)) return error('massa peticions', 429);
  const u = await usuariActual();
  const premium = esPremium(u);
  const clau = `${u?.id ?? (await anonId())}:${mesActual()}`;
  const ct = req.headers.get('content-type') ?? '';
  let lecturaId = '', transcripcio = '', segons = 0, metode: 'whisper' | 'navegador' = 'navegador';
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    lecturaId = String(fd.get('lecturaId') ?? '');
    segons = Number(fd.get('segons') ?? 0);
    const audio = fd.get('audio');
    if (!process.env.WHISPER_URL || !(audio instanceof Blob)) return json({ metode: 'navegador' });
    const f = new FormData();
    f.append('file', audio, 'lectura.webm');
    f.append('model', process.env.WHISPER_MODEL ?? 'projecte-aina/whisper-large-v3-ca-3catparla');
    f.append('language', 'ca');
    f.append('response_format', 'json');
    const r = await fetch(`${process.env.WHISPER_URL.replace(/\/$/, '')}/v1/audio/transcriptions`, { method: 'POST', headers: process.env.WHISPER_API_KEY ? { Authorization: `Bearer ${process.env.WHISPER_API_KEY}` } : {}, body: f });
    if (!r.ok) return json({ metode: 'navegador' });
    transcripcio = ((await r.json()) as { text?: string }).text ?? '';
    metode = 'whisper';
  } else {
    const b = await req.json().catch(() => null);
    lecturaId = String(b?.lecturaId ?? ''); transcripcio = String(b?.transcripcio ?? ''); segons = Number(b?.segons ?? 0);
  }
  const lectura = BANC.oral.lectures.find((l) => l.id === lecturaId);
  if (!lectura) return error('lectura');
  if (hayDb() && !premium) {
    const us = await db.us.findUnique({ where: { clau } });
    if ((us?.oralSegons ?? 0) >= pais.gratis.oralMinutsMes * 60) return error('quota', 402);
  }
  const resultat = puntuarLectura(lectura, transcripcio, BANC.oral.sons, metode);
  if (hayDb()) { try { await db.us.upsert({ where: { clau }, update: { oralSegons: { increment: Math.max(5, Math.round(segons)) }, ...(metode === 'whisper' ? { sttSegons: { increment: Math.round(segons) } } : {}) }, create: { clau, oralSegons: Math.max(5, Math.round(segons)), sttSegons: metode === 'whisper' ? Math.round(segons) : 0 } }); } catch {} }
  return json(resultat);
}
