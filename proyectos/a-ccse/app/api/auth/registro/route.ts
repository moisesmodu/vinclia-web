import { db, hayBaseDeDatos } from '@/lib/db';
import { emailValido, hashClave, iniciarSesion } from '@/lib/auth';
import { esProgreso } from '@/lib/progreso';
import { cuerpo, error, ok } from '@/lib/http';
import { esLocale } from '@/lib/config';

export async function POST(req: Request) {
  if (!hayBaseDeDatos()) return error('sin_base_de_datos', 503);
  const b = await cuerpo<{ email: string; clave: string; idioma: string; progreso: unknown }>(req);
  const email = String(b.email ?? '').trim().toLowerCase();
  if (!emailValido(email)) return error('email_invalido');
  if (typeof b.clave !== 'string' || b.clave.length < 8 || b.clave.length > 200) return error('clave_corta');
  const prisma = db();
  if (await prisma.usuario.findUnique({ where: { email } })) return error('email_existe', 409);
  const u = await prisma.usuario.create({
    data: {
      email,
      claveHash: await hashClave(b.clave),
      idioma: esLocale(b.idioma) ? b.idioma : 'es',
      progreso: esProgreso(b.progreso) ? (b.progreso as object) : undefined,
    },
  });
  await iniciarSesion(u.id);
  return ok({ email: u.email, accesoHasta: null });
}
