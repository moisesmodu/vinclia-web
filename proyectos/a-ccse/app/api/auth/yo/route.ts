import { tieneAcceso, usuarioActual } from '@/lib/auth';
import { ok } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  const u = await usuarioActual().catch(() => null);
  if (!u) return ok({ anonimo: true });
  return ok({ email: u.email, accesoHasta: u.accesoHasta, acceso: tieneAcceso(u), simulacros: u.simulacros, pagoPendiente: !tieneAcceso(u) && !!u.checkoutIniciado });
}
