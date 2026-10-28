import 'server-only';
import Stripe from 'stripe';
import { db } from './db';
import { PAIS, SITE_URL } from './config';

let cliente: Stripe | null = null;
export function stripe(): Stripe {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error('Falta STRIPE_SECRET_KEY');
  if (!cliente) {
    cliente = new Stripe(k, {
      // Permite probar contra stripe-mock en local (STRIPE_API_BASE=http://localhost:12111)
      ...(process.env.STRIPE_API_BASE
        ? (() => {
            const u = new URL(process.env.STRIPE_API_BASE!);
            return { host: u.hostname, port: Number(u.port), protocol: u.protocol.replace(':', '') as 'http' | 'https' };
          })()
        : {}),
    });
  }
  return cliente;
}
export const modoStripe = () => (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test');
const CLAVE_WEBHOOK = () => `stripe_webhook_secret_${modoStripe()}`;
export const URL_WEBHOOK = () => `${SITE_URL}/api/stripe/webhook`;

/** Secreto del webhook: variable de entorno o el que la app guardó al crearlo sola. */
export async function secretoWebhook(): Promise<string | null> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET;
  const c = await db().config.findUnique({ where: { clave: CLAVE_WEBHOOK() } });
  return c?.valor ?? null;
}

/** Crea el endpoint del webhook en Stripe la primera vez (solo con URL pública https). Nunca rompe el pago. */
export async function asegurarWebhook() {
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET || !SITE_URL.startsWith('https://')) return;
    if (await secretoWebhook()) return;
    const s = stripe();
    const existentes = await s.webhookEndpoints.list({ limit: 100 });
    for (const e of existentes.data) if (e.url === URL_WEBHOOK()) await s.webhookEndpoints.del(e.id);
    const nuevo = await s.webhookEndpoints.create({
      url: URL_WEBHOOK(),
      enabled_events: ['checkout.session.completed', 'checkout.session.async_payment_succeeded'],
      description: `${PAIS.producto} (creado por la app)`,
    });
    if (nuevo.secret)
      await db().config.upsert({
        where: { clave: CLAVE_WEBHOOK() },
        create: { clave: CLAVE_WEBHOOK(), valor: nuevo.secret },
        update: { valor: nuevo.secret },
      });
  } catch (e) {
    console.error('No se pudo crear el webhook de Stripe', e);
  }
}

export async function crearCheckout(opts: { usuarioId: string; email: string; locale: string }) {
  await asegurarWebhook();
  const stripeLocale = (['es', 'fr', 'en', 'ro', 'zh'] as const).includes(opts.locale as 'es') ? (opts.locale as 'es') : 'auto';
  return stripe().checkout.sessions.create({
    mode: 'payment',
    client_reference_id: opts.usuarioId,
    customer_email: opts.email,
    locale: stripeLocale,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PAIS.moneda.toLowerCase(),
          unit_amount: PAIS.precioCentimos,
          product_data: {
            name: `${PAIS.producto} · ${PAIS.accesoDias} días`,
            description: 'Acceso completo: 300 preguntas oficiales explicadas en 7 idiomas, simulacros ilimitados y repaso.',
          },
        },
      },
    ],
    custom_text: {
      submit: {
        message:
          'Al pagar aceptas las condiciones de venta y pides que el acceso empiece ya, por lo que pierdes el derecho de desistimiento (art. 103.m TRLGDCU). Garantía de aprobado incluida.',
      },
    },
    metadata: { usuarioId: opts.usuarioId, producto: 'a-ccse', pais: PAIS.pais },
    success_url: `${SITE_URL}/${opts.locale}/pago/ok?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/${opts.locale}/precio?cancelado=1`,
  });
}

/** Idempotente: un pago por sesión de Checkout. Suma los días de acceso desde hoy o desde el final del acceso vigente. */
export async function concederAcceso(sesion: Stripe.Checkout.Session): Promise<{ ok: boolean; accesoHasta?: Date }> {
  if (sesion.payment_status !== 'paid') return { ok: false };
  const usuarioId = sesion.client_reference_id || sesion.metadata?.usuarioId;
  if (!usuarioId) return { ok: false };
  const prisma = db();
  return prisma.$transaction(async (tx) => {
    const ya = await tx.pago.findUnique({ where: { sesionId: sesion.id } });
    const u = await tx.usuario.findUnique({ where: { id: usuarioId } });
    if (!u) return { ok: false };
    if (ya) return { ok: true, accesoHasta: u.accesoHasta ?? undefined };
    const base = u.accesoHasta && u.accesoHasta.getTime() > Date.now() ? u.accesoHasta.getTime() : Date.now();
    const accesoHasta = new Date(base + PAIS.accesoDias * 86400_000);
    await tx.pago.create({
      data: { sesionId: sesion.id, usuarioId, importe: sesion.amount_total ?? PAIS.precioCentimos, moneda: sesion.currency ?? 'eur', modo: sesion.livemode ? 'live' : 'test' },
    });
    await tx.usuario.update({ where: { id: usuarioId }, data: { accesoHasta } });
    return { ok: true, accesoHasta };
  });
}
