import 'server-only';
import Stripe from 'stripe';
import { db } from './db';
import { PAIS, SITE_URL } from './config';

let cliente: Stripe | null = null;
/** Desarrollo con la clave de prueba de Numi Mates; STRIPE_MODO=live usa la real (DESPLIEGUES.md §2). */
export function claveStripe(): string | undefined {
  return process.env.STRIPE_MODO === 'live'
    ? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
}
export function stripe(): Stripe {
  const k = claveStripe();
  if (!k) throw new Error('Falta STRIPE_TEST_SECRET_KEY o STRIPE_SECRET_KEY');
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
export const modoStripe = () => (/^(sk|rk)_live_/.test(claveStripe() ?? '') ? 'live' : 'test');
const CLAVE_WEBHOOK = () => `stripe_webhook_secret_${modoStripe()}`;
export const EVENTOS_WEBHOOK = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'] as const;
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
      enabled_events: [...EVENTOS_WEBHOOK],
      description: `Cartera · CCSE · webhook (creado por la app)`,
      metadata: { proyecto: 'a-ccse' },
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

export const NOMBRE_PRODUCTO = 'Cartera · CCSE · Acceso 3 meses';
export const LOOKUP_PRECIO = `a-ccse-acceso-${PAIS.accesoDias}d-${PAIS.precioCentimos}${PAIS.moneda.toLowerCase()}`;
let precioCache: string | null = null;

/** Producto y precio por API, idempotente: busca por lookup_key y solo crea si no existe. */
export async function precioId(): Promise<string> {
  if (precioCache) return precioCache;
  const s = stripe();
  const ya = await s.prices.list({ lookup_keys: [LOOKUP_PRECIO], active: true, limit: 1 });
  if (ya.data[0]) return (precioCache = ya.data[0].id);
  const productos = await s.products.search({ query: `metadata['proyecto']:'a-ccse' AND active:'true'` }).catch(() => null);
  const producto =
    productos?.data.find((x) => x.name === NOMBRE_PRODUCTO) ??
    (await s.products.create({
      name: NOMBRE_PRODUCTO,
      description: 'Acceso completo a CCSE en tu idioma: 300 preguntas oficiales explicadas en 7 idiomas, simulacros y repaso.',
      metadata: { proyecto: 'a-ccse', plan: 'acceso-3-meses' },
    }));
  const precio = await s.prices.create({
    product: producto.id,
    currency: PAIS.moneda.toLowerCase(),
    unit_amount: PAIS.precioCentimos,
    tax_behavior: 'inclusive',
    lookup_key: LOOKUP_PRECIO,
    metadata: { proyecto: 'a-ccse', dias: String(PAIS.accesoDias) },
  });
  return (precioCache = precio.id);
}

export async function crearCheckout(opts: { usuarioId: string; email: string; locale: string; ref?: string | null }) {
  await asegurarWebhook();
  const stripeLocale = (['es', 'fr', 'en', 'ro', 'zh'] as const).includes(opts.locale as 'es') ? (opts.locale as 'es') : 'auto';
  return stripe().checkout.sessions.create({
    mode: 'payment',
    allow_promotion_codes: true,
    // Recuperación (SESIONES.md «Monetizar primero»): caduca a las 3 h y Stripe da un enlace de recuperación de 30 días.
    expires_at: Math.floor(Date.now() / 1000) + 3 * 3600,
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: true } },
    // Sin consent_collection: Stripe no lo admite en cuentas de España («not available in your country»).
    client_reference_id: opts.usuarioId,
    customer_email: opts.email,
    locale: stripeLocale,
    line_items: [{ quantity: 1, price: await precioId() }],
    payment_intent_data: { metadata: { proyecto: 'a-ccse', usuarioId: opts.usuarioId } },
    custom_text: {
      submit: {
        message:
          'Al pagar aceptas las condiciones de venta y pides que el acceso empiece ya, por lo que pierdes el derecho de desistimiento (art. 103.m TRLGDCU). Garantía de aprobado incluida.',
      },
    },
    metadata: { usuarioId: opts.usuarioId, proyecto: 'a-ccse', pais: PAIS.pais, afiliado: opts.ref ?? '' },
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

/** Pago a medias: como máximo un correo, solo si la persona aceptó correos en Checkout; en la app siempre hay aviso. */
export async function recuperarPago(sesion: Stripe.Checkout.Session): Promise<'enviado' | 'sin_consentimiento' | 'omitido'> {
  const usuarioId = sesion.client_reference_id || sesion.metadata?.usuarioId;
  const url = sesion.after_expiration?.recovery?.url;
  if (!usuarioId || sesion.payment_status === 'paid') return 'omitido';
  const u = await db().usuario.findUnique({ where: { id: usuarioId } });
  if (!u || u.recuperacionEnviada || (u.accesoHasta && u.accesoHasta.getTime() > Date.now()) || u.email.endsWith('.invalid')) return 'omitido';
  if (sesion.consent?.promotions !== 'opt_in' || !url) return 'sin_consentimiento';
  const { enviarCorreo } = await import('./correo');
  const ok = await enviarCorreo({
    para: u.email,
    asunto: 'Tu acceso al CCSE quedó a medias',
    texto:
      `Hola:\n\nEmpezaste a pagar el acceso completo a CCSE en tu idioma, pero no se completó.\n` +
      `Puedes terminarlo aquí (el enlace vale 30 días): ${url}\n\n` +
      `Son ${(PAIS.precioCentimos / 100).toFixed(2).replace('.', ',')} €, pago único, ${PAIS.accesoDias} días, con garantía de aprobado.\n\n` +
      `Es el único recordatorio que te enviamos. Si no quieres más correos, responde «BAJA».`,
  });
  if (ok) await db().usuario.update({ where: { id: u.id }, data: { recuperacionEnviada: new Date() } });
  return ok ? 'enviado' : 'omitido';
}
