import { usuarioActual, estaSuscrito } from '@/lib/auth';
import { db } from '@/lib/db';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await usuarioActual().catch(() => null);
  if (!u) return json({ usuario: null });
  const suscrito = estaSuscrito(u);
  let pagoPendiente: string | null = null;
  if (!suscrito) {
    const a = await db.ajuste.findUnique({ where: { clave: `checkout:${u.id}` } }).catch(() => null);
    if (a) { const v = JSON.parse(a.valor); if (v.hasta > Date.now()) pagoPendiente = v.url; }
  }
  return json({ usuario: { email: u.email, suscrito, estado: u.suscripcionEstado, hasta: u.suscripcionHasta, cancelaAlFinal: u.cancelaAlFinal }, pagoPendiente });
}
