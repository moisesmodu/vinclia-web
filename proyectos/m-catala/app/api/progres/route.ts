import { usuariActual } from '@/lib/auth';
import { db, hayDb } from '@/lib/db';
import { json, error, limitar } from '@/lib/http';
import { convocatoria } from '@/lib/datos';
import { NIVELLS } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

const nivellValid = (x: unknown) => (typeof x === 'string' && (NIVELLS as string[]).includes(x) ? x : null);

/** Progrés sincronitzat (estat sencer del navegador) per a qui té compte. Permanent i exportable. El client fusiona per camp (lib/estat.ts). */
export async function GET(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  const nivell = nivellValid(new URL(req.url).searchParams.get('nivell'));
  const p = (nivell ? await db.progres.findUnique({ where: { usuariId_nivell: { usuariId: u.id, nivell } } }) : null) ?? (await db.progres.findFirst({ where: { usuariId: u.id }, orderBy: { actualitzat: 'desc' } }));
  return json({ dades: p?.dades ?? null, actualitzat: p?.actualitzat ?? null });
}

export async function PUT(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!(await limitar(req, 'progres', 60))) return error('massa peticions', 429);
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  const b = await req.json().catch(() => null);
  if (!b?.dades || typeof b.dades !== 'object') return error('dades');
  const nivell = nivellValid(b.nivell) ?? 'cap';
  const txt = JSON.stringify(b.dades);
  if (txt.length > 900_000) return error('massa gran', 413);
  await db.progres.upsert({ where: { usuariId_nivell: { usuariId: u.id, nivell } }, update: { dades: b.dades }, create: { usuariId: u.id, nivell, dades: b.dades } });
  const pn = nivellValid(b.dades?.perfil?.nivell);
  const pc = typeof b.dades?.perfil?.convocatoria === 'string' && convocatoria(b.dades.perfil.convocatoria) ? (b.dades.perfil.convocatoria as string) : null;
  if (pn && (u.nivell !== pn || u.convocatoria !== pc)) await db.usuari.update({ where: { id: u.id }, data: { nivell: pn, convocatoria: pc } });
  return json({ ok: true });
}
