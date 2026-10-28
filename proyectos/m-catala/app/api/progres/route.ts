import { usuariActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Progrés sincronitzat (estat sencer del navegador) per a qui té compte. Permanent i exportable. */
export async function GET() {
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  const p = await db.progres.findFirst({ where: { usuariId: u.id }, orderBy: { actualitzat: 'desc' } });
  return json({ dades: p?.dades ?? null, actualitzat: p?.actualitzat ?? null });
}

export async function PUT(req: Request) {
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  const b = await req.json().catch(() => null);
  if (!b?.dades || typeof b.dades !== 'object') return error('dades');
  const nivell = String(b.nivell ?? 'cap');
  const txt = JSON.stringify(b.dades);
  if (txt.length > 900_000) return error('massa gran', 413);
  await db.progres.upsert({ where: { usuariId_nivell: { usuariId: u.id, nivell } }, update: { dades: b.dades }, create: { usuariId: u.id, nivell, dades: b.dades } });
  if (b.dades?.perfil?.nivell && (u.nivell !== b.dades.perfil.nivell || u.convocatoria !== b.dades.perfil.convocatoria)) await db.usuari.update({ where: { id: u.id }, data: { nivell: b.dades.perfil.nivell, convocatoria: b.dades.perfil.convocatoria ?? null } });
  return json({ ok: true });
}
