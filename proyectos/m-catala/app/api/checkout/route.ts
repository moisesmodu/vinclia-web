import { usuariActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { modoPago, plan, precioStripe, clienteStripe, stripe, activarPassi } from '@/lib/pagos';
import { urlBase } from '@/lib/datos';
import pais from '@/config/paises/es.json';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Sessió de Stripe Checkout: subscripció (mensual, anual amb 7 dies de prova) o pagament únic (passi de convocatòria de 3 mesos). */
export async function POST(req: Request) {
  const u = await usuariActual();
  const b = await req.json().catch(() => ({}));
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  if (!u) return json({ url: `/${idioma}/entrar?seguent=/${idioma}/preus` });
  const p = plan(String(b?.plan ?? 'mensual'));
  if (!p) return error('pla desconegut');
  const modo = modoPago();
  if (modo === 'off') return error('Pagaments no configurats', 503);
  if (modo === 'demo') {
    if (p.tipo === 'unic') await activarPassi(u.id, p);
    else {
      const fins = new Date(Date.now() + (p.intervalo === 'year' ? 365 : 30) * 864e5);
      await db.usuari.update({ where: { id: u.id }, data: { subscripcioEstat: 'demo', subscripcioFins: fins, subscripcioId: null, pla: p.id, cancelaAlFinal: false } });
    }
    return json({ url: `/${idioma}/compte?pagat=demo` });
  }
  const base = urlBase();
  const origen = new URL(req.url).origin;
  const arrel = process.env.NODE_ENV === 'production' ? base : origen;
  const comu = {
    customer: await clienteStripe(u),
    line_items: [{ price: await precioStripe(p), quantity: 1 }],
    success_url: `${arrel}/api/checkout/confirmar?session_id={CHECKOUT_SESSION_ID}&idioma=${idioma}`,
    cancel_url: `${arrel}/${idioma}/preus?cancelat=1`,
    locale: pais.stripeLocale as 'es',
    allow_promotion_codes: true,
    client_reference_id: u.id,
    metadata: { usuariId: u.id, plan: p.id, proyecto: 'm-catala' },
  };
  const ses = p.tipo === 'unic'
    ? await stripe().checkout.sessions.create({ ...comu, mode: 'payment', invoice_creation: { enabled: true } })
    : await stripe().checkout.sessions.create({ ...comu, mode: 'subscription', subscription_data: { metadata: { usuariId: u.id, plan: p.id, proyecto: 'm-catala' }, ...(p.diasPrueba ? { trial_period_days: p.diasPrueba } : {}) } });
  return json({ url: ses.url });
}
