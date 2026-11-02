import { cache } from 'react';
import { intentar, memorizar, PROYECTOS_CONTROL, type Resultado } from './comun';

// Solo lectura: la clave es restringida y únicamente se usan peticiones GET.
const BASE = 'https://api.stripe.com/v1/';
const SLUGS = new Set(PROYECTOS_CONTROL.map((p) => p.slug));

async function get(ruta: string, params: Record<string, string | string[]>): Promise<any> {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) throw new Error('Falta la variable STRIPE_SECRET_KEY');
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) for (const x of Array.isArray(v) ? v : [v]) q.append(k, x);
  const r = await fetch(`${BASE}${ruta}?${q}`, { method: 'GET', headers: { Authorization: `Bearer ${clave}` }, cache: 'no-store', signal: AbortSignal.timeout(12_000) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Stripe ${ruta}: ${j?.error?.message ?? r.status}`);
  return j;
}

async function todos(ruta: string, params: Record<string, string | string[]>, maxPaginas = 10): Promise<any[]> {
  const salida: any[] = [];
  let despues: string | undefined;
  for (let i = 0; i < maxPaginas; i++) {
    const j = await get(ruta, { limit: '100', ...params, ...(despues ? { starting_after: despues } : {}) });
    salida.push(...j.data);
    if (!j.has_more || j.data.length === 0) break;
    despues = j.data[j.data.length - 1].id;
  }
  return salida;
}

export type Reembolso = { id: string; importe: number; creado: Date; estado: string };
export type PagoStripe = {
  id: string; cargo: string | null; proyecto: string | null; importe: number; reembolsado: number; moneda: string;
  email: string | null; estado: 'pagado' | 'reembolsado' | 'reembolso parcial' | 'en disputa' | 'pendiente' | 'fallido' | 'cancelado' | 'requiere acción';
  creado: Date; descripcion: string | null; reembolsos: Reembolso[]; disputado: boolean; url: string;
};
export type Disputa = { id: string; cargo: string; pago: string | null; proyecto: string | null; importe: number; moneda: string; estado: string; motivo: string; creado: Date; email: string | null; url: string };
export type SuscripcionStripe = {
  id: string; proyecto: string | null; estado: string; email: string | null; producto: string; mensual: number; moneda: string;
  intervalo: string; creada: Date; finPeriodo: Date | null; finPrueba: Date | null; cancelaAlFinal: boolean; canceladaEl: Date | null; url: string;
};
export type DatosStripe = { pagos: PagoStripe[]; disputas: Disputa[]; disputasAviso: string | null; suscripciones: SuscripcionStripe[]; desde: Date };

const proyectoValido = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

async function cargar(): Promise<DatosStripe> {
  const desde = new Date(Date.now() - 400 * 864e5);
  const gte = String(Math.floor(desde.getTime() / 1000));
  const [intents, sesiones, subs, productos] = await Promise.all([
    todos('payment_intents', { 'created[gte]': gte, 'expand[]': ['data.latest_charge.refunds'] }),
    todos('checkout/sessions', { 'created[gte]': gte }),
    todos('subscriptions', { status: 'all', 'expand[]': ['data.customer', 'data.items.data.price'] }, 5),
    todos('products', {}, 5),
  ]);

  const proyectoProducto = new Map<string, string | null>(productos.map((p: any) => [p.id, proyectoValido(p.metadata?.proyecto)]));
  const nombreProducto = new Map<string, string>(productos.map((p: any) => [p.id, p.name]));
  const sesionPorIntent = new Map<string, any>();
  for (const s of sesiones) if (s.payment_intent) sesionPorIntent.set(typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent.id, s);

  const suscripciones: SuscripcionStripe[] = subs.map((s: any) => {
    const items = s.items?.data ?? [];
    let mensual = 0; let moneda = s.currency ?? 'eur'; let intervalo = '';
    for (const it of items) {
      const pr = it.price ?? {}; const rec = pr.recurring ?? {};
      const unidad = (pr.unit_amount ?? 0) * (it.quantity ?? 1);
      const n = rec.interval_count ?? 1;
      const factor = rec.interval === 'year' ? 1 / (12 * n) : rec.interval === 'week' ? 52 / (12 * n) : rec.interval === 'day' ? 365 / (12 * n) : 1 / n;
      mensual += unidad * factor; moneda = pr.currency ?? moneda;
      intervalo = rec.interval ? `${n > 1 ? n + ' ' : ''}${{ month: 'mes', year: 'año', week: 'semana', day: 'día' }[rec.interval as string] ?? rec.interval}` : '';
    }
    const prod = items[0]?.price?.product;
    const prodId = typeof prod === 'string' ? prod : prod?.id;
    const fin = s.current_period_end ?? items[0]?.current_period_end ?? null;
    return {
      id: s.id, proyecto: proyectoValido(s.metadata?.proyecto) ?? (prodId ? proyectoProducto.get(prodId) ?? null : null), estado: s.status,
      email: typeof s.customer === 'object' ? s.customer?.email ?? null : null, producto: (prodId && nombreProducto.get(prodId)) || items[0]?.price?.nickname || '—',
      mensual: Math.round(mensual), moneda, intervalo, creada: new Date(s.created * 1000), finPeriodo: fin ? new Date(fin * 1000) : null,
      finPrueba: s.trial_end ? new Date(s.trial_end * 1000) : null, cancelaAlFinal: !!s.cancel_at_period_end || !!s.cancel_at,
      canceladaEl: s.canceled_at ? new Date(s.canceled_at * 1000) : null, url: `https://dashboard.stripe.com/subscriptions/${s.id}`,
    };
  });
  const proyectoCliente = new Map<string, string | null>();
  for (const s of subs) { const c = typeof s.customer === 'string' ? s.customer : s.customer?.id; const sub = suscripciones.find((x) => x.id === s.id); if (c && sub?.proyecto) proyectoCliente.set(c, sub.proyecto); }

  const porCargo = new Map<string, PagoStripe>();
  const pagos: PagoStripe[] = intents.map((pi: any) => {
    const ch = typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
    const sesion = sesionPorIntent.get(pi.id);
    const cliente = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id;
    const proyecto = proyectoValido(pi.metadata?.proyecto) ?? proyectoValido(sesion?.metadata?.proyecto) ?? (cliente ? proyectoCliente.get(cliente) ?? null : null);
    const importe = ch?.amount ?? pi.amount_received ?? pi.amount;
    const reembolsado = ch?.amount_refunded ?? 0;
    let estado: PagoStripe['estado'];
    if (ch?.disputed) estado = 'en disputa';
    else if (pi.status === 'succeeded') estado = reembolsado >= importe && importe > 0 ? 'reembolsado' : reembolsado > 0 ? 'reembolso parcial' : 'pagado';
    else if (pi.status === 'processing') estado = 'pendiente';
    else if (pi.status === 'canceled') estado = 'cancelado';
    else if (pi.status === 'requires_action' || pi.status === 'requires_confirmation') estado = 'requiere acción';
    else estado = 'fallido';
    const p: PagoStripe = {
      id: pi.id, cargo: ch?.id ?? null, proyecto, importe, reembolsado, moneda: pi.currency,
      email: (ch?.billing_details?.email || pi.receipt_email || sesion?.customer_details?.email || null)?.toLowerCase() ?? null,
      estado, creado: new Date(pi.created * 1000), descripcion: pi.description ?? null, disputado: !!ch?.disputed,
      reembolsos: (ch?.refunds?.data ?? []).map((r: any) => ({ id: r.id, importe: r.amount, creado: new Date(r.created * 1000), estado: r.status })),
      url: `https://dashboard.stripe.com/payments/${pi.id}`,
    };
    if (p.cargo) porCargo.set(p.cargo, p);
    return p;
  });
  // Los intentos de pago que nunca llegaron a cobrarse (checkout abandonado) no aportan nada en la lista.
  const utiles = pagos.filter((p) => p.cargo || p.estado === 'pendiente');

  // Disputas: la clave no puede leer /disputes; se reconstruyen con los eventos (últimos 30 días).
  let disputas: Disputa[] = []; let disputasAviso: string | null = null;
  try {
    const eventos = await todos('events', { 'types[]': ['charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed', 'charge.dispute.funds_withdrawn', 'charge.dispute.funds_reinstated'] }, 3);
    const ultimo = new Map<string, any>();
    for (const ev of eventos) { const d = ev.data?.object; if (d?.id && !ultimo.has(d.id)) ultimo.set(d.id, d); }
    disputas = [...ultimo.values()].map((d: any) => {
      const cargo = typeof d.charge === 'string' ? d.charge : d.charge?.id; const pago = porCargo.get(cargo);
      return { id: d.id, cargo, pago: pago?.id ?? (typeof d.payment_intent === 'string' ? d.payment_intent : null), proyecto: pago?.proyecto ?? null, importe: d.amount, moneda: d.currency, estado: d.status, motivo: d.reason, creado: new Date(d.created * 1000), email: pago?.email ?? null, url: `https://dashboard.stripe.com/disputes/${d.id}` };
    });
  } catch (e) {
    disputasAviso = 'No se pudieron leer los eventos de disputas.';
  }
  // Cargos marcados como disputados sin evento (más de 30 días).
  for (const p of utiles) if (p.disputado && !disputas.some((d) => d.cargo === p.cargo)) disputas.push({ id: '', cargo: p.cargo!, pago: p.id, proyecto: p.proyecto, importe: p.importe, moneda: p.moneda, estado: 'abierta o cerrada (ver Stripe)', motivo: '—', creado: p.creado, email: p.email, url: p.url });

  return { pagos: utiles.sort((a, b) => +b.creado - +a.creado), disputas: disputas.sort((a, b) => +b.creado - +a.creado), disputasAviso, suscripciones, desde };
}

export const datosStripe = cache((): Promise<Resultado<DatosStripe>> => intentar(() => memorizar('stripe', cargar)));

export const esDeCartera = (proyecto: string | null) => !!proyecto && SLUGS.has(proyecto);

/** Ingresos netos en un intervalo: cobros del intervalo menos reembolsos hechos en el intervalo (en EUR). */
export function netoEntre(pagos: PagoStripe[], desde: Date, hasta = new Date(), filtro: (p: PagoStripe) => boolean = () => true) {
  let cobrado = 0; let reembolsado = 0; let cobros = 0;
  for (const p of pagos) {
    if (!filtro(p) || p.moneda !== 'eur' || !p.cargo) continue;
    if (p.creado >= desde && p.creado <= hasta && p.estado !== 'fallido') { cobrado += p.importe; cobros++; }
    for (const r of p.reembolsos) if (r.estado !== 'failed' && r.estado !== 'canceled' && r.creado >= desde && r.creado <= hasta) reembolsado += r.importe;
  }
  return { cobrado, reembolsado, neto: cobrado - reembolsado, cobros };
}

export const ESTADOS_SUSCRIPCION_MRR = new Set(['active', 'past_due']);
