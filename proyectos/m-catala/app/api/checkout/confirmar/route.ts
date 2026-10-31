import { stripe, guardarSubscripcio, modoPago, plan, activarPassi, registrarPagament, livemodeCoherent } from '@/lib/pagos';
import { usuariActual } from '@/lib/auth';
import { hayDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Tornada de Stripe Checkout: llegeix la sessió i guarda la subscripció o activa el passi (no depèn del webhook).
 *  Cada sessió de Checkout s'aplica una sola vegada (taula Pagament): recarregar la URL de tornada no renova res. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const idioma = u.searchParams.get('idioma') === 'es' ? 'es' : 'ca';
  const id = u.searchParams.get('session_id');
  if (modoPago() !== 'stripe' || !id || !/^cs_[A-Za-z0-9_]+$/.test(id) || !hayDb()) return Response.redirect(new URL(`/${idioma}/preus`, req.url), 303);
  try {
    const ses = await stripe().checkout.sessions.retrieve(id, { expand: ['subscription'] });
    if (!livemodeCoherent(ses.livemode)) return Response.redirect(new URL(`/${idioma}/preus?error=1`, req.url), 303);
    const usuariId = ses.client_reference_id ?? ses.metadata?.usuariId ?? null;
    // La URL de tornada només l'ha de fer servir qui ha pagat: si hi ha sessió iniciada, ha de ser la mateixa persona.
    const actual = await usuariActual();
    if (actual && usuariId && actual.id !== usuariId) return Response.redirect(new URL(`/${idioma}/compte`, req.url), 303);
    if (ses.status === 'complete' && ses.mode === 'subscription' && ses.subscription && typeof ses.subscription !== 'string') {
      if (await registrarPagament(ses.id, 'checkout.subscripcio', usuariId)) await guardarSubscripcio(ses.subscription, usuariId ?? undefined);
      return Response.redirect(new URL(`/${idioma}/compte?pagat=1`, req.url), 303);
    }
    if (ses.status === 'complete' && ses.mode === 'payment' && ses.payment_status === 'paid' && usuariId) {
      const p = plan(ses.metadata?.plan ?? 'pase');
      if (p && (await registrarPagament(ses.id, 'checkout.passi', usuariId))) {
        await activarPassi(usuariId, p, typeof ses.customer === 'string' ? ses.customer : ses.customer?.id, new Date(ses.created * 1000));
      }
      return Response.redirect(new URL(`/${idioma}/compte?pagat=1`, req.url), 303);
    }
  } catch (e) {
    console.error('checkout/confirmar', e);
  }
  return Response.redirect(new URL(`/${idioma}/preus?error=1`, req.url), 303);
}
