import { db, hayBaseDeDatos } from '@/lib/db';
import { hashClave, iniciarSesion } from '@/lib/auth';
import { cuerpo, error, ok } from '@/lib/http';

export async function POST(req: Request) {
  if (!hayBaseDeDatos()) return error('sin_base_de_datos', 503);
  const b = await cuerpo<{ token: string; clave: string }>(req);
  if (typeof b.clave !== 'string' || b.clave.length < 8) return error('clave_corta');
  const t = typeof b.token === 'string' ? await db().tokenClave.findUnique({ where: { token: b.token } }) : null;
  if (!t || t.caduca.getTime() < Date.now()) return error('token_invalido', 400);
  await db().usuario.update({ where: { id: t.usuarioId }, data: { claveHash: await hashClave(b.clave) } });
  await db().tokenClave.deleteMany({ where: { usuarioId: t.usuarioId } });
  await iniciarSesion(t.usuarioId);
  return ok({ ok: true });
}
