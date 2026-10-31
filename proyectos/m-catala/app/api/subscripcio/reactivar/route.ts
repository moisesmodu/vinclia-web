import { usuariActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { modoPago, stripe, guardarSubscripcio } from '@/lib/pagos';
import { json, error } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function POST() {
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  if (u.subscripcioEstat === 'demo' || u.subscripcioEstat === 'passi') { await db.usuari.update({ where: { id: u.id }, data: { cancelaAlFinal: false } }); return json({ ok: true }); }
  if (modoPago() !== 'stripe' || !u.subscripcioId) return error('sense subscripció');
  const sub = await stripe().subscriptions.update(u.subscripcioId, { cancel_at_period_end: false });
  await guardarSubscripcio(sub, u.id);
  return json({ ok: true });
}
