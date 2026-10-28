import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { cerrarSesion, usuarioIdActual } from '@/lib/auth';
import { error, ok } from '@/lib/http';

/**
 * «Cancela en un clic»: borra los datos personales y el progreso (RGPD art. 17).
 * La fila se anonimiza en lugar de eliminarse porque los pagos se conservan 6 años por obligación fiscal.
 */
export async function DELETE() {
  const id = await usuarioIdActual();
  if (!id) return error('no_autenticado', 401);
  const prisma = db();
  await prisma.tokenClave.deleteMany({ where: { usuarioId: id } });
  await prisma.usuario.update({
    where: { id },
    data: { email: `borrado-${id}@borrado.invalid`, claveHash: '-', progreso: Prisma.DbNull, accesoHasta: null, simulacros: 0 },
  });
  await cerrarSesion();
  return ok({ borrada: true });
}
