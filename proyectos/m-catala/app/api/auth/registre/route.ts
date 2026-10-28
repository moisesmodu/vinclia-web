import { db, hayDb } from '@/lib/db';
import { hashClave, iniciarSesion } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!limitar(req, 'registre', 5)) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const clau = String(b?.clau ?? '');
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return error('email');
  if (clau.length < 8 || clau.length > 200) return error('curta');
  if (!b?.accepto) return error('accepto');
  if (await db.usuari.findUnique({ where: { email } })) return error('existeix', 409);
  const u = await db.usuari.create({ data: { email, hash: hashClave(clau), idioma, nivell: b?.nivell ?? null, convocatoria: b?.convocatoria ?? null } });
  await iniciarSesion(u.id);
  return json({ ok: true });
}
