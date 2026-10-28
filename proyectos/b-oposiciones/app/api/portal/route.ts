import { usuarioActual } from '@/lib/auth';
import { modoPago, urlPortal } from '@/lib/pagos';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  if (modoPago() !== 'stripe' || !u.stripeCustomerId) return error('sin cliente de Stripe', 400);
  const idioma = (await req.json().catch(() => ({})))?.idioma === 'es' ? 'es' : 'ca';
  return json({ url: await urlPortal(u, `${new URL(req.url).origin}/${idioma}/cuenta`) });
}
