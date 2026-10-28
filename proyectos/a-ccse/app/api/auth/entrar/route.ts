import { db, hayBaseDeDatos } from '@/lib/db';
import { compararClave, iniciarSesion, tieneAcceso } from '@/lib/auth';
import { cuerpo, error, ok } from '@/lib/http';

export async function POST(req: Request) {
  if (!hayBaseDeDatos()) return error('sin_base_de_datos', 503);
  const b = await cuerpo<{ email: string; clave: string }>(req);
  const email = String(b.email ?? '').trim().toLowerCase();
  const u = await db().usuario.findUnique({ where: { email } });
  if (!u || typeof b.clave !== 'string' || !(await compararClave(b.clave, u.claveHash))) return error('credenciales', 401);
  await iniciarSesion(u.id);
  return ok({ email: u.email, accesoHasta: u.accesoHasta, acceso: tieneAcceso(u) });
}
