import { db, hayDb } from '@/lib/db';
import { hashClave, iniciarSesion } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!hayDb()) return error('Base de datos no configurada', 503);
  if (!limitar(req, 'registro', 5)) return error('demasiadas peticiones', 429);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? '').trim().toLowerCase();
  const clave = String(b?.clave ?? '');
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return error('email');
  if (clave.length < 8 || clave.length > 200) return error('corta');
  if (!b?.acepto) return error('acepto');
  if (await db.usuario.findUnique({ where: { email } })) return error('existe', 409);
  const u = await db.usuario.create({ data: { email, hash: hashClave(clave), idioma } });
  await iniciarSesion(u.id);
  return json({ ok: true });
}
