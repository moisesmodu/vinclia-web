import { stripe, concederAcceso } from '@/lib/stripe';
import { usuarioIdActual } from '@/lib/auth';
import { error, ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

/** Al volver de Checkout: comprueba la sesión con Stripe y da acceso sin esperar al webhook. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('session_id');
  if (!id || !/^cs_[A-Za-z0-9_]+$/.test(id)) return error('sesion');
  const yo = await usuarioIdActual();
  try {
    const s = await stripe().checkout.sessions.retrieve(id);
    if (yo && s.client_reference_id !== yo) return error('otra_cuenta', 403);
    const r = await concederAcceso(s);
    return ok({ pagado: s.payment_status === 'paid', ...r });
  } catch (e) {
    console.error(e);
    return error('stripe_error', 502);
  }
}
