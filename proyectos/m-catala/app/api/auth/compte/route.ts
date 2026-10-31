import { db, hayDb } from '@/lib/db';
import { usuariActual, cerrarSesion, comprobarClave } from '@/lib/auth';
import { json, error, limitar } from '@/lib/http';
import { modoPago, stripe } from '@/lib/pagos';

export const dynamic = 'force-dynamic';

/** RGPD, dret de supressió: esborra l'usuari i totes les seves dades (Progres i Pagament en cascada; Simulacre, Correccio i Us explícitament)
 *  i tanca la sessió. Cal la contrasenya al cos ({clau}). Si té subscripció activa a Stripe, es cancel·la primer. */
export async function DELETE(req: Request) {
  if (!hayDb()) return error('Base de dades no configurada', 503);
  if (!(await limitar(req, 'compte-esborrar', 5, 600_000))) return error('massa peticions', 429);
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  const b = await req.json().catch(() => null);
  if (!comprobarClave(String(b?.clau ?? '').slice(0, 200), u.hash)) return error('credencials', 401);
  if (modoPago() === 'stripe' && u.subscripcioId) {
    try { await stripe().subscriptions.cancel(u.subscripcioId); } catch (e) { console.error('esborrar compte: cancel·lació Stripe', e); }
  }
  await db.$transaction([
    db.simulacre.deleteMany({ where: { usuariId: u.id } }),
    db.correccio.deleteMany({ where: { usuariId: u.id } }),
    db.us.deleteMany({ where: { clau: { startsWith: `${u.id}:` } } }),
    db.alerta.deleteMany({ where: { email: u.email } }),
    db.usuari.delete({ where: { id: u.id } }), // Progres i Pagament cauen en cascada
  ]);
  await cerrarSesion();
  return json({ ok: true });
}
