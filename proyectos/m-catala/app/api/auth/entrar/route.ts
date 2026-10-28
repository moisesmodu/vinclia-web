import { db, hayDb } from '@/lib/db';
import { comprobarClave, iniciarSesion } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!limitar(req, 'entrar', 10)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const u = await db.usuari.findUnique({ where: { email } });
  if (!u || !comprobarClave(String(b?.clau ?? ''), u.hash)) return error('credencials', 401);
  await iniciarSesion(u.id);
  return json({ ok: true });
}
