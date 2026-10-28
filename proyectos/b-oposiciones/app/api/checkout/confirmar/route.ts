import { stripe, guardarSuscripcion, modoPago } from '@/lib/pagos';

export const dynamic = 'force-dynamic';

/** Vuelta de Stripe Checkout: lee la sesión y guarda la suscripción (no depende del webhook). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const idioma = u.searchParams.get('idioma') === 'es' ? 'es' : 'ca';
  const id = u.searchParams.get('session_id');
  if (modoPago() !== 'stripe' || !id) return Response.redirect(new URL(`/${idioma}/precios`, req.url), 303);
  try {
    const ses = await stripe().checkout.sessions.retrieve(id, { expand: ['subscription'] });
    if (ses.status === 'complete' && ses.subscription && typeof ses.subscription !== 'string') {
      await guardarSuscripcion(ses.subscription, ses.client_reference_id ?? undefined);
      return Response.redirect(new URL(`/${idioma}/cuenta?pagado=1`, req.url), 303);
    }
  } catch {}
  return Response.redirect(new URL(`/${idioma}/precios?error=1`, req.url), 303);
}
