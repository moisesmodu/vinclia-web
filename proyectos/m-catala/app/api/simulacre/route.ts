import { usuariActual, esPremium } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { json, error, anonId, mesActual, limitar } from '@/lib/http';
import pais from '@/config/paises/es.json';

export const dynamic = 'force-dynamic';

/** Guarda el resultat d'un simulacre (compte o anònim) i retorna la comparació amb la cohort de la mateixa convocatòria i nivell. */
export async function POST(req: Request) {
  if (!limitar(req, 'simulacre', 10)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  if (!b?.nivell || typeof b?.nota !== 'number') return error('dades');
  const u = await usuariActual();
  const anon = await anonId();
  if (!hayDb()) return json({ guardat: false, cohort: null });
  const premium = esPremium(u);
  const clau = `${u?.id ?? anon}:${mesActual()}`;
  if (!premium && b?.inici) {
    const us = await db.us.findUnique({ where: { clau } });
    if ((us?.simulacres ?? 0) >= pais.gratis.simulacresMes) return error('quota', 402);
    await db.us.upsert({ where: { clau }, update: { simulacres: { increment: 1 } }, create: { clau, simulacres: 1 } });
    return json({ ok: true });
  }
  await db.simulacre.create({ data: { usuariId: u?.id ?? null, anonId: u ? null : anon, nivell: String(b.nivell), convocatoria: b.convocatoria ? String(b.convocatoria) : null, simulacreId: String(b.simulacreId ?? ''), nota: b.nota, arees: b.arees ?? {}, apte: !!b.apte } });
  return json({ guardat: true, cohort: await cohort(String(b.nivell), b.convocatoria ? String(b.convocatoria) : null, b.nota) });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!hayDb()) return json({ cohort: null });
  return json({ cohort: await cohort(url.searchParams.get('nivell') ?? 'C1', url.searchParams.get('convocatoria'), Number(url.searchParams.get('nota') ?? 0)) });
}

async function cohort(nivell: string, convocatoria: string | null, nota: number) {
  const where = convocatoria ? { nivell, convocatoria } : { nivell };
  const n = await db.simulacre.count({ where });
  if (n < 5) return { n, percentil: null };
  const sota = await db.simulacre.count({ where: { ...where, nota: { lt: nota } } });
  return { n, percentil: Math.round((100 * sota) / n) };
}
