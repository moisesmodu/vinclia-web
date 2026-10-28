import 'server-only';
import Stripe from 'stripe';
import type { Usuari } from '@prisma/client';
import { db } from './db';
import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';

export type Plan = (typeof pais.planes)[number];
const PROYECTO = 'm-catala';
export const NOMBRE_PROYECTO = 'Català';
const NOMBRE_PLAN: Record<string, string> = { mensual: 'Mensual', anual: 'Anual', pase: 'Passi de convocatòria', revisio: 'Revisió humana' };

/**
 * Cuenta de Stripe: Numi Mates (DESPLIEGUES.md §2). Se desarrolla con STRIPE_TEST_SECRET_KEY y se lanza con
 * STRIPE_SECRET_KEY poniendo STRIPE_MODO=real. Sin ninguna clave, "modo demo" (solo fuera de producción o con PAGO_DEMO=1).
 */
export function claveStripe(): string | undefined {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (process.env.STRIPE_MODO === 'real') return process.env.STRIPE_LIVE_SECRET_KEY || (sk?.match(/^(sk|rk)_live_/) ? sk : undefined);
  return process.env.STRIPE_TEST_SECRET_KEY || (sk?.match(/^(sk|rk)_test_/) ? sk : undefined);
}

export const modoPago = (): 'stripe' | 'demo' | 'off' =>
  claveStripe() ? 'stripe' : process.env.NODE_ENV !== 'production' || process.env.PAGO_DEMO === '1' ? 'demo' : 'off';

export const esModoPrueba = () => !/^(sk|rk)_live_/.test(claveStripe() ?? '');

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  const clave = claveStripe();
  if (!clave) throw new Error('Falta la clave de Stripe (STRIPE_TEST_SECRET_KEY o STRIPE_SECRET_KEY con STRIPE_MODO=real)');
  if (!_stripe) {
    const host = process.env.STRIPE_API_HOST;
    // Detrás del proxy de las sesiones en la nube (HTTPS_PROXY + NODE_USE_ENV_PROXY=1) el cliente fetch respeta el proxy; en Vercel no hace falta.
    const viaProxy = !host && process.env.HTTPS_PROXY && process.env.NODE_USE_ENV_PROXY ? { httpClient: Stripe.createFetchHttpClient() } : {};
    _stripe = new Stripe(clave, host ? { host, port: Number(process.env.STRIPE_API_PORT || 12111), protocol: 'http' } : viaProxy);
  }
  return _stripe;
}

export const planes = () => pais.planes.filter((p) => p.activo);
export const plan = (id: string) => planes().find((p) => p.id === id);

async function ajuste(clave: string): Promise<string | null> {
  return (await db.ajust.findUnique({ where: { clau: clave } }))?.valor ?? null;
}
async function guardarAjuste(clave: string, valor: string) {
  await db.ajust.upsert({ where: { clau: clave }, update: { valor }, create: { clau: clave, valor } });
}

export const lookupPrecio = (p: Plan) => `${PROYECTO}_${pais.codigo}_${p.id}_${p.importe}`;

/** Id del precio del plan. Idempotente: precio por lookup_key, producto por metadatos. Producto "Cartera · Català · <Plan>". */
export async function precioStripe(p: Plan): Promise<string> {
  const env = process.env[`STRIPE_PRICE_${p.id.toUpperCase()}`];
  if (env) return env;
  const lookup = lookupPrecio(p);
  const guardado = await ajuste(`precio:${lookup}`);
  if (guardado) return guardado;
  const s = stripe();
  const existentes = await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  let id = existentes.data[0]?.id;
  if (!id) {
    const nombre = `Cartera · ${NOMBRE_PROYECTO} · ${NOMBRE_PLAN[p.id] ?? p.id}`;
    let producto: string | undefined;
    try {
      producto = (await s.products.search({ query: `metadata['proyecto']:'${PROYECTO}' AND metadata['plan']:'${p.id}' AND active:'true'`, limit: 1 })).data[0]?.id;
    } catch {
      producto = (await s.products.list({ active: true, limit: 100 })).data.find((x) => x.metadata?.proyecto === PROYECTO && x.metadata?.plan === p.id)?.id;
    }
    if (!producto) producto = (await s.products.create({ name: nombre, metadata: { proyecto: PROYECTO, plan: p.id, marca: marca.nombre } })).id;
    const base: Stripe.PriceCreateParams = { product: producto, currency: pais.moneda.toLowerCase(), unit_amount: p.importe, lookup_key: lookup, tax_behavior: 'inclusive', metadata: { proyecto: PROYECTO, plan: p.id } };
    if (p.tipo === 'subscripcio') base.recurring = { interval: p.intervalo as 'month' | 'year', interval_count: p.intervaloCantidad as number };
    id = (await s.prices.create(base)).id;
  }
  await guardarAjuste(`precio:${lookup}`, id);
  return id;
}

export async function clienteStripe(u: Usuari): Promise<string> {
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const c = await stripe().customers.create({ email: u.email, metadata: { usuariId: u.id, proyecto: PROYECTO }, preferred_locales: ['ca', 'es'] });
  await db.usuari.update({ where: { id: u.id }, data: { stripeCustomerId: c.id } });
  return c.id;
}

function finPeriodo(sub: Stripe.Subscription): Date | null {
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const seg = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return seg ? new Date(seg * 1000) : null;
}

/** Copia el estado de la suscripción de Stripe al usuario. */
export async function guardarSubscripcio(sub: Stripe.Subscription, usuariId?: string) {
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const where = usuariId ? { id: usuariId } : { stripeCustomerId: customer };
  const u = await db.usuari.findFirst({ where });
  if (!u) return null;
  return db.usuari.update({
    where: { id: u.id },
    data: { stripeCustomerId: customer, subscripcioId: sub.id, subscripcioEstat: sub.status, subscripcioFins: finPeriodo(sub), pla: sub.metadata?.plan ?? u.pla, cancelaAlFinal: !!sub.cancel_at_period_end, sincronitzat: new Date() },
  });
}

/** Pase de convocatoria (pago único): acceso premium durante p.dies días. */
export async function activarPassi(usuariId: string, p: Plan, customer?: string | null) {
  const dies = (p as { dies?: number }).dies ?? 92;
  return db.usuari.update({
    where: { id: usuariId },
    data: { subscripcioEstat: 'passi', subscripcioFins: new Date(Date.now() + dies * 864e5), subscripcioId: null, pla: p.id, cancelaAlFinal: false, sincronitzat: new Date(), ...(customer ? { stripeCustomerId: customer } : {}) },
  });
}

/** Sin webhook configurado, la app se mantiene al día preguntando a Stripe cada 12 horas como mucho. */
export async function sincronitzarSiCal(u: Usuari): Promise<Usuari> {
  if (modoPago() !== 'stripe' || !u.subscripcioId) return u;
  const vell = !u.sincronitzat || Date.now() - u.sincronitzat.getTime() > 12 * 3600e3;
  const caducat = u.subscripcioFins && u.subscripcioFins.getTime() < Date.now();
  if (!vell && !caducat) return u;
  try {
    const sub = await stripe().subscriptions.retrieve(u.subscripcioId);
    return (await guardarSubscripcio(sub, u.id)) ?? u;
  } catch {
    return u;
  }
}

/** Portal de cliente de Stripe (facturas y tarjeta). */
export async function urlPortal(u: Usuari, volver: string): Promise<string> {
  const s = stripe();
  let configuration = await ajuste('portal');
  if (!configuration) {
    const lista = await s.billingPortal.configurations.list({ is_default: true, limit: 1 });
    configuration = lista.data[0]?.id ?? (await s.billingPortal.configurations.create({
      business_profile: { headline: `${marca.nombre}: subscripció` },
      features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: true, mode: 'at_period_end' } },
    })).id;
    await guardarAjuste('portal', configuration);
  }
  const ses = await s.billingPortal.sessions.create({ customer: await clienteStripe(u), return_url: volver, configuration });
  return ses.url;
}
