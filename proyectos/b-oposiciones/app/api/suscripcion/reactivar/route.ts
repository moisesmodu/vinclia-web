import { usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { modoPago, stripe, guardarSuscripcion } from '@/lib/pagos';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  if (u.suscripcionEstado === 'demo') {
    await db.usuario.update({ where: { id: u.id }, data: { cancelaAlFinal: false } });
    return json({ ok: true });
  }
  if (modoPago() !== 'stripe' || !u.suscripcionId) return error('sin suscripción');
  const sub = await stripe().subscriptions.update(u.suscripcionId, { cancel_at_period_end: false });
  await guardarSuscripcion(sub, u.id);
  return json({ ok: true });
}
