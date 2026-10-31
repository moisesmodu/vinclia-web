import { db, hayDb } from '@/lib/db';
import { comprobarClave, comprobarClaveFicticia, iniciarSesion } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Inici de sessió. Límit per IP i per correu (força bruta), temps constant (scrypt també quan el correu no existeix) i un únic missatge d'error. */
export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!(await limitar(req, 'entrar', 10))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase().slice(0, 200);
  const clau = String(b?.clau ?? '').slice(0, 200);
  if (!email || !clau) return error('credencials', 401);
  if (!(await limitar(req, 'entrar-email', 8, 15 * 60_000, email))) return error('massa peticions', 429);
  const u = await db.usuari.findUnique({ where: { email } });
  const ok = u ? comprobarClave(clau, u.hash) : comprobarClaveFicticia(clau);
  if (!u || !ok) return error('credencials', 401);
  await iniciarSesion(u.id, u.sessioVersio);
  return json({ ok: true });
}
