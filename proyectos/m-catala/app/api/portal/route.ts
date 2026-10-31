import { usuariActual } from '@/lib/auth';
import { modoPago, urlPortal } from '@/lib/pagos';
import { json, error } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const u = await usuariActual();
  if (!u) return error('sense sessió', 401);
  if (modoPago() !== 'stripe' || !u.stripeCustomerId) return error('sense client de Stripe', 400);
  const idioma = (await req.json().catch(() => ({})))?.idioma === 'es' ? 'es' : 'ca';
  try { return json({ url: await urlPortal(u, `${new URL(req.url).origin}/${idioma}/compte`) }); } catch { return error('portal no disponible', 503); }
}
