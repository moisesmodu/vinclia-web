import { db, hayDb } from '@/lib/db';
import { hashClave, iniciarSesion, usuariDeToken } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Nova contrasenya des de l'enllaç de recuperació. Canviar-la invalida totes les sessions obertes (sessioVersio + 1). */
export async function POST(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!(await limitar(req, 'nova-clau', 10))) return error('massa peticions', 429);
  const b = await req.json().catch(() => null);
  const clau = String(b?.clau ?? '');
  if (clau.length < 8 || clau.length > 200) return error('curta');
  const u = await usuariDeToken(String(b?.token ?? '').slice(0, 500));
  if (!u) return error('token', 400);
  const nou = await db.usuari.update({ where: { id: u.id }, data: { hash: hashClave(clau), sessioVersio: { increment: 1 } } });
  await iniciarSesion(nou.id, nou.sessioVersio);
  return json({ ok: true });
}
