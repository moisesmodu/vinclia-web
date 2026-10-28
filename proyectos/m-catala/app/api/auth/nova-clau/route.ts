import { db, hayDb } from '@/lib/db';
import { hashClave, iniciarSesion, usuariDeToken } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!limitar(req, 'nova-clau', 10)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const clau = String(b?.clau ?? '');
  if (clau.length < 8) return error('curta');
  const u = await usuariDeToken(String(b?.token ?? ''));
  if (!u) return error('token', 400);
  await db.usuari.update({ where: { id: u.id }, data: { hash: hashClave(clau) } });
  await iniciarSesion(u.id);
  return json({ ok: true });
}
