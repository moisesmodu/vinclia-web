import { usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { modoPago, plan, precioStripe, clienteStripe, stripe, MARCA_PAGO, nombreProducto } from '@/lib/pagos';
import { urlBase } from '@/lib/datos';
import pais from '@/config/paises/es.json';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Crea la sesión de Stripe Checkout para un plan. En modo demo (sin claves, fuera de producción) simula el pago. */
export async function POST(req: Request) {
  const u = await usuarioActual();
  const b = await req.json().catch(() => ({}));
  const idioma = b?.idioma === 'es' ? 'es' : 'ca';
  if (!u) return json({ url: `/${idioma}/entrar?plan=${encodeURIComponent(String(b?.plan ?? 'mensual'))}` });
  const p = plan(String(b?.plan ?? 'mensual'));
  if (!p) return error('plan desconocido');
  const modo = modoPago();
  if (modo === 'off') return error('Pagos no configurados', 503);
  if (modo === 'demo') {
    const hasta = new Date(Date.now() + (p.intervalo === 'year' ? 365 : 30 * p.intervaloCantidad) * 864e5);
    await db.usuario.update({ where: { id: u.id }, data: { suscripcionEstado: 'demo', suscripcionHasta: hasta, suscripcionId: null, cancelaAlFinal: false } });
    return json({ url: `/${idioma}/cuenta?pagado=demo` });
  }
  const base = urlBase();
  const origen = new URL(req.url).origin;
  const raiz = process.env.NODE_ENV === 'production' ? base : origen;
  const ses = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: await clienteStripe(u),
    line_items: [{ price: await precioStripe(p), quantity: 1 }],
    success_url: `${raiz}/api/checkout/confirmar?session_id={CHECKOUT_SESSION_ID}&idioma=${idioma}`,
    cancel_url: `${raiz}/${idioma}/precios?cancelado=1`,
    locale: pais.stripeLocale as 'es',
    allow_promotion_codes: true,
    client_reference_id: u.id,
    // Suscripción: el descriptor bancario dinámico no se puede fijar por sesión (el extracto usa el de la cuenta).
    subscription_data: { description: nombreProducto(p.id), metadata: { usuarioId: u.id, plan: p.id } },
    custom_text: {
      submit: {
        message: `${MARCA_PAGO} · ` + (idioma === 'es' ? 'Cancela cuando quieras desde tu cuenta.' : 'Cancel·la quan vulguis des del teu compte.'),
      },
    },
    metadata: { usuarioId: u.id, plan: p.id },
    // Recuperación: si la sesión caduca sin pagar, Stripe genera un enlace nuevo (lo usa el aviso del webhook).
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: true } },
    expires_at: Math.floor(Date.now() / 1000) + 2 * 3600,
  });
  // Pago a medias: la app lo recuerda una vez (aviso en la cuenta y en la práctica).
  await db.ajuste.upsert({ where: { clave: `checkout:${u.id}` }, update: { valor: JSON.stringify({ url: ses.url, hasta: ses.expires_at * 1000 }) }, create: { clave: `checkout:${u.id}`, valor: JSON.stringify({ url: ses.url, hasta: ses.expires_at * 1000 }) } });
  return json({ url: ses.url });
}
