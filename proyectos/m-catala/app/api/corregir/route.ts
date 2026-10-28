import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { corregir } from '@/lib/correccio';
import { tasca as tascaDe } from '@/lib/datos';
import { json, error, limitar, anonId, mesActual } from '@/lib/http';
import pais from '@/config/paises/es.json';
import type { Nivell } from '@/lib/tipos';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Correcció escrita per criteris. Quota gratuïta: 3 al mes per persona (compte o navegador); premium il·limitat. */
export async function POST(req: Request) {
  if (!limitar(req, 'corregir', 12)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const text = String(b?.text ?? '').trim();
  const nivell = (['B1', 'B2', 'C1', 'C2'].includes(b?.nivell) ? b.nivell : 'C1') as Nivell;
  const idiomaExpl = ['ca', 'es', 'en', 'ar', 'ro', 'fr'].includes(b?.idiomaExpl) ? b.idiomaExpl : 'ca';
  if (text.split(/\s+/).length < 15) return error('curt');
  if (text.length > 8000) return error('llarg', 413);
  const u = await usuariActual();
  const premium = esPremium(u);
  const clau = `${u?.id ?? (await anonId())}:${mesActual()}`;
  const dins = b?.context === 'diagnostic' || b?.context === 'simulacre'; // el diagnòstic i el simulacre no gasten la quota de correccions
  if (hayDb() && !premium && !dins) {
    const us = await db.us.findUnique({ where: { clau } });
    if ((us?.correccions ?? 0) >= pais.gratis.correccionsMes) return error('quota', 402);
  }
  const t = b?.tascaId ? tascaDe(String(b.tascaId)) ?? null : null;
  const r = await corregir(nivell, text, t, idiomaExpl);
  if (hayDb()) {
    try {
      if (!premium && !dins) await db.us.upsert({ where: { clau }, update: { correccions: { increment: 1 } }, create: { clau, correccions: 1 } });
      await db.correccio.create({ data: { usuariId: u?.id ?? null, anonId: u ? null : await anonId(), nivell, tascaId: t?.id ?? null, paraules: r.paraules, resultat: { nota: r.nota, criteris: r.criteris, motor: r.motor, errors: r.errors.length } as object, motor: r.motor, ms: r.ms, tokensIn: r.tokensIn, tokensOut: r.tokensOut } });
    } catch {}
  }
  return json(r);
}
