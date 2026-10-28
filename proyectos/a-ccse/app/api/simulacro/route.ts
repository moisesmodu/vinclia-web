import { db } from '@/lib/db';
import { tieneAcceso, usuarioActual } from '@/lib/auth';
import { PAIS } from '@/lib/config';
import { ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

/** Cuenta los simulacros de las cuentas sin acceso. Los visitantes sin cuenta se controlan en el navegador. */
export async function POST() {
  const u = await usuarioActual().catch(() => null);
  if (!u) return ok({ permitido: null });
  if (tieneAcceso(u)) return ok({ permitido: true });
  if (u.simulacros >= PAIS.gratis.simulacros) return ok({ permitido: false });
  await db().usuario.update({ where: { id: u.id }, data: { simulacros: { increment: 1 } } });
  return ok({ permitido: true });
}
