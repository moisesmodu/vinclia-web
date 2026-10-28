import { db } from '@/lib/db';
import { hashClave, iniciarSesion, usuarioDeToken } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!limitar(req, 'nueva-clave', 5)) return error('demasiadas peticiones', 429);
  const b = await req.json().catch(() => null);
  const clave = String(b?.clave ?? '');
  if (clave.length < 8 || clave.length > 200) return error('corta');
  const u = await usuarioDeToken(String(b?.t ?? ''));
  if (!u) return error('enlace', 400);
  await db.usuario.update({ where: { id: u.id }, data: { hash: hashClave(clave) } });
  await iniciarSesion(u.id);
  return json({ ok: true });
}
