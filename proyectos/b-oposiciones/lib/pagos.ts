import 'server-only';
import Stripe from 'stripe';
import type { Usuario } from '@prisma/client';
import { db } from './db';
import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';

export type Plan = (typeof pais.planes)[number];

/**
 * Cuenta de Stripe: Numi Mates (DESPLIEGUES.md §2). Se desarrolla con STRIPE_TEST_SECRET_KEY y se lanza con
 * STRIPE_SECRET_KEY poniendo STRIPE_MODO=real. Sin ninguna clave, "modo demo" (solo fuera de producción o con PAGO_DEMO=1).
 */
export function claveStripe(): string | undefined {
  const sk = process.env.STRIPE_SECRET_KEY;
  // Modo real: solo una clave live (la de la integración de Stripe en Vercel puede ser de prueba y no debe cobrar).
  if (process.env.STRIPE_MODO === 'real') return process.env.STRIPE_LIVE_SECRET_KEY || (sk?.match(/^(sk|rk)_live_/) ? sk : undefined);
  return process.env.STRIPE_TEST_SECRET_KEY || (sk?.match(/^(sk|rk)_test_/) ? sk : undefined);
}

export const modoPago = (): 'stripe' | 'demo' | 'off' =>
  claveStripe() ? 'stripe' : process.env.NODE_ENV !== 'production' || process.env.PAGO_DEMO === '1' ? 'demo' : 'off';

export const esModoPrueba = () => !/^(sk|rk)_live_/.test(claveStripe() ?? '');

/** 'test' o 'live' según la clave en uso. Los ids de Stripe (clientes, precios, portal) no se comparten entre modos. */
export const modoStripe = (): 'test' | 'live' => (esModoPrueba() ? 'test' : 'live');

/** Error de Stripe por falta de permisos (clave restringida sin el permiso necesario). */
function esErrorDePermisos(e: unknown): boolean {
  const x = e as { type?: string; statusCode?: number } | null;
  return x?.type === 'StripePermissionError' || x?.statusCode === 403;
}

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  const clave = claveStripe();
  if (!clave) throw new Error('Falta la clave de Stripe (STRIPE_TEST_SECRET_KEY o STRIPE_SECRET_KEY con STRIPE_MODO=real)');
  if (!_stripe) {
    // STRIPE_API_HOST permite probar contra stripe-mock en local.
    const host = process.env.STRIPE_API_HOST;
    _stripe = new Stripe(clave, host ? { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: 'http' } : {});
  }
  return _stripe;
}

export const planes = () => pais.planes.filter((p) => p.activo);
export const plan = (id: string) => planes().find((p) => p.id === id);

async function ajuste(clave: string): Promise<string | null> {
  return (await db.ajuste.findUnique({ where: { clave } }))?.valor ?? null;
}
async function guardarAjuste(clave: string, valor: string) {
  await db.ajuste.upsert({ where: { clave }, update: { valor }, create: { clave, valor } });
}

export const NOMBRE_PROYECTO = 'Oposiciones';
/** Nombre comercial que ve el cliente en Checkout, recibos y facturas (la cuenta de Stripe es Numi Mates). */
export const MARCA_PAGO = 'Oposita';
const NOMBRE_PLAN: Record<string, string> = { mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' };
export const nombreProducto = (planId: string) => `${MARCA_PAGO} — ${NOMBRE_PLAN[planId] ?? planId}`;
export const lookupPrecio = (p: Plan) => `b-oposiciones_${pais.codigo}_${p.id}_${p.importe}`;

/**
 * Id del precio del plan. Idempotente (busca antes de crear): precio por lookup_key; producto por metadatos.
 * Producto "Oposita — <Plan>" (antes "Cartera · Oposiciones · <Plan>") con metadata.proyecto = b-oposiciones (DESPLIEGUES.md §2).
 */
export async function precioStripe(p: Plan): Promise<string> {
  const env = process.env[`STRIPE_PRICE_${p.id.toUpperCase()}`];
  if (env) return env;
  const lookup = lookupPrecio(p);
  // Por modo: un precio de prueba no existe en modo real (y viceversa).
  const claveAjuste = `precio_${modoStripe()}:${lookup}`;
  const guardado = await ajuste(claveAjuste);
  if (guardado) return guardado;
  const s = stripe();
  const existentes = await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  let id = existentes.data[0]?.id;
  if (!id) {
    const nombre = nombreProducto(p.id);
    let producto: string | undefined;
    try {
      producto = (await s.products.search({ query: `metadata['proyecto']:'b-oposiciones' AND metadata['plan']:'${p.id}' AND active:'true'`, limit: 1 })).data[0]?.id;
    } catch {
      producto = (await s.products.list({ active: true, limit: 100 })).data.find((x) => x.metadata?.proyecto === 'b-oposiciones' && x.metadata?.plan === p.id)?.id;
    }
    if (!producto) producto = (await s.products.create({ name: nombre, metadata: { proyecto: 'b-oposiciones', plan: p.id, marca: marca.nombre } })).id;
    id = (
      await s.prices.create({
        product: producto,
        currency: pais.moneda.toLowerCase(),
        unit_amount: p.importe,
        recurring: { interval: p.intervalo as 'month' | 'year', interval_count: p.intervaloCantidad },
        lookup_key: lookup,
        tax_behavior: 'inclusive',
        metadata: { proyecto: 'b-oposiciones', plan: p.id },
      })
    ).id;
  }
  await guardarAjuste(claveAjuste, id);
  return id;
}

/**
 * Id del cliente de Stripe del usuario. El id guardado solo se reutiliza si existe (y no está borrado) en el modo
 * actual: al pasar de prueba a real, el cliente de prueba no existe en real y se crea uno nuevo.
 */
export async function clienteStripe(u: Usuario): Promise<string> {
  const s = stripe();
  if (u.stripeCustomerId) {
    try {
      const c = await s.customers.retrieve(u.stripeCustomerId);
      if (!c.deleted) return c.id;
    } catch (e) {
      const x = e as { code?: string; statusCode?: number } | null;
      if (x?.code !== 'resource_missing' && x?.statusCode !== 404) throw e;
    }
  }
  const c = await s.customers.create({ email: u.email, metadata: { usuarioId: u.id, proyecto: 'b-oposiciones' }, preferred_locales: ['es'] });
  await db.usuario.update({ where: { id: u.id }, data: { stripeCustomerId: c.id } });
  return c.id;
}

function finPeriodo(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const seg = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return seg ? new Date(seg * 1000) : null;
}

/** Copia el estado de la suscripción de Stripe al usuario. */
export async function guardarSuscripcion(sub: Stripe.Subscription, usuarioId?: string) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const where = usuarioId ? { id: usuarioId } : { stripeCustomerId: customer };
  const u = await db.usuario.findFirst({ where });
  if (!u) return null;
  return db.usuario.update({
    where: { id: u.id },
    data: {
      stripeCustomerId: customer,
      suscripcionId: sub.id,
      suscripcionEstado: sub.status,
      suscripcionHasta: finPeriodo(sub),
      cancelaAlFinal: !!sub.cancel_at_period_end,
      sincronizado: new Date(),
    },
  });
}

/** Sin webhook configurado, la app se mantiene al día preguntando a Stripe cada 12 horas como mucho. */
export async function sincronizarSiHaceFalta(u: Usuario): Promise<Usuario> {
  if (modoPago() !== 'stripe' || !u.suscripcionId) return u;
  const viejo = !u.sincronizado || Date.now() - u.sincronizado.getTime() > 12 * 3600e3;
  const caducado = u.suscripcionHasta && u.suscripcionHasta.getTime() < Date.now();
  if (!viejo && !caducado) return u;
  try {
    const sub = await stripe().subscriptions.retrieve(u.suscripcionId);
    return (await guardarSuscripcion(sub, u.id)) ?? u;
  } catch {
    return u;
  }
}

/** El portal de cliente no se puede abrir (normalmente, la clave restringida no tiene permiso de "Customer portal"). */
export class PortalNoDisponible extends Error {
  constructor(causa?: unknown) {
    super('El portal de cliente de Stripe no está disponible: la clave de Stripe no tiene permiso para configurarlo o abrirlo.');
    this.name = 'PortalNoDisponible';
    if (causa) (this as { cause?: unknown }).cause = causa;
  }
}

/**
 * Portal de cliente de Stripe (facturas y tarjeta). Crea la configuración si la cuenta no tiene ninguna.
 * La configuración se guarda por modo (portal_test / portal_live). Lanza PortalNoDisponible si faltan permisos.
 */
export async function urlPortal(u: Usuario, volver: string): Promise<string> {
  const s = stripe();
  const claveAjuste = `portal_${modoStripe()}`;
  try {
    let configuration = await ajuste(claveAjuste);
    if (!configuration) {
      const lista = await s.billingPortal.configurations.list({ is_default: true, limit: 1 });
      configuration =
        lista.data[0]?.id ??
        (
          await s.billingPortal.configurations.create({
            business_profile: { headline: `${marca.nombre}: subscripció` },
            features: {
              invoice_history: { enabled: true },
              payment_method_update: { enabled: true },
              subscription_cancel: { enabled: true, mode: 'at_period_end' },
            },
          })
        ).id;
      await guardarAjuste(claveAjuste, configuration);
    }
    const ses = await s.billingPortal.sessions.create({ customer: await clienteStripe(u), return_url: volver, configuration });
    return ses.url;
  } catch (e) {
    if (esErrorDePermisos(e)) {
      console.error('[pagos] portal de cliente sin permisos en Stripe', (e as Error)?.message);
      throw new PortalNoDisponible(e);
    }
    throw e;
  }
}
