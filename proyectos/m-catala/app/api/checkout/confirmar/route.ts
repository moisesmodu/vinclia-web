import { stripe, guardarSubscripcio, modoPago, plan, activarPassi } from '@/lib/pagos';

export const dynamic = 'force-dynamic';

/** Tornada de Stripe Checkout: llegeix la sessió i guarda la subscripció o activa el passi (no depèn del webhook). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const idioma = u.searchParams.get('idioma') === 'es' ? 'es' : 'ca';
  const id = u.searchParams.get('session_id');
  if (modoPago() !== 'stripe' || !id) return Response.redirect(new URL(`/${idioma}/preus`, req.url), 303);
  try {
    const ses = await stripe().checkout.sessions.retrieve(id, { expand: ['subscription'] });
    if (ses.status === 'complete' && ses.mode === 'subscription' && ses.subscription && typeof ses.subscription !== 'string') {
      await guardarSubscripcio(ses.subscription, ses.client_reference_id ?? undefined);
      return Response.redirect(new URL(`/${idioma}/compte?pagat=1`, req.url), 303);
    }
    if (ses.status === 'complete' && ses.mode === 'payment' && ses.payment_status === 'paid' && ses.client_reference_id) {
      const p = plan(ses.metadata?.plan ?? 'pase');
      if (p) await activarPassi(ses.client_reference_id, p, typeof ses.customer === 'string' ? ses.customer : ses.customer?.id);
      return Response.redirect(new URL(`/${idioma}/compte?pagat=1`, req.url), 303);
    }
  } catch {}
  return Response.redirect(new URL(`/${idioma}/preus?error=1`, req.url), 303);
}
