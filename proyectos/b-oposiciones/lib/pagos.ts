import 'server-only';
import Stripe from 'stripe';
import type { Usuario } from '@prisma/client';
import { db } from './db';
import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';

export type Plan = (typeof pais.planes)[number];

/** Sin STRIPE_SECRET_KEY la app funciona en "modo demo" (solo fuera de producción o con PAGO_DEMO=1): el pago se simula. */
export const modoPago = (): 'stripe' | 'demo' | 'off' =>
  process.env.STRIPE_SECRET_KEY ? 'stripe' : process.env.NODE_ENV !== 'production' || process.env.PAGO_DEMO === '1' ? 'demo' : 'off';

export const esModoPrueba = () => !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Falta STRIPE_SECRET_KEY');
  if (!_stripe) {
    // STRIPE_API_HOST permite probar contra stripe-mock en local.
    const host = process.env.STRIPE_API_HOST;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, host ? { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: 'http' } : {});
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

/** Devuelve el id del precio del plan; si no existe en Stripe, crea producto y precio (así Moisés solo pega la clave). */
export async function precioStripe(p: Plan): Promise<string> {
  const env = process.env[`STRIPE_PRICE_${p.id.toUpperCase()}`];
  if (env) return env;
  const lookup = `aprova_${pais.codigo}_${p.id}_${p.importe}`;
  const guardado = await ajuste(`precio:${lookup}`);
  if (guardado) return guardado;
  const s = stripe();
  const existentes = await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  let id = existentes.data[0]?.id;
  if (!id) {
    const prodLookup = `producto:${pais.codigo}`;
    let producto = await ajuste(prodLookup);
    if (!producto) {
      producto = (await s.products.create({ name: `${marca.nombre} · oposicions de Catalunya`, metadata: { proyecto: 'b-oposiciones' } })).id;
      await guardarAjuste(prodLookup, producto);
    }
    id = (
      await s.prices.create({
        product: producto,
        currency: pais.moneda.toLowerCase(),
        unit_amount: p.importe,
        recurring: { interval: p.intervalo as 'month' | 'year', interval_count: p.intervaloCantidad },
        lookup_key: lookup,
        tax_behavior: 'inclusive',
        metadata: { plan: p.id },
      })
    ).id;
  }
  await guardarAjuste(`precio:${lookup}`, id);
  return id;
}

export async function clienteStripe(u: Usuario): Promise<string> {
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const c = await stripe().customers.create({ email: u.email, metadata: { usuarioId: u.id }, preferred_locales: ['es'] });
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

/** Portal de cliente de Stripe (facturas y tarjeta). Crea la configuración si la cuenta no tiene ninguna. */
export async function urlPortal(u: Usuario, volver: string): Promise<string> {
  const s = stripe();
  let configuration = await ajuste('portal');
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
    await guardarAjuste('portal', configuration);
  }
  const ses = await s.billingPortal.sessions.create({ customer: await clienteStripe(u), return_url: volver, configuration });
  return ses.url;
}
