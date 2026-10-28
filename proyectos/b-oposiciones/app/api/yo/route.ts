import { usuarioActual, estaSuscrito } from '@/lib/auth';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await usuarioActual().catch(() => null);
  if (!u) return json({ usuario: null });
  return json({ usuario: { email: u.email, suscrito: estaSuscrito(u), estado: u.suscripcionEstado, hasta: u.suscripcionHasta, cancelaAlFinal: u.cancelaAlFinal } });
}
