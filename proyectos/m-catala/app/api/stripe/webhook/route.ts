import type Stripe from 'stripe';
import { stripe, guardarSubscripcio, modoPago, plan, activarPassi, registrarPagament, revocarPremium, livemodeCoherent } from '@/lib/pagos';
import { hayDb } from '@/lib/db';
import { error, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Webhook opcional (STRIPE_WEBHOOK_SECRET). Sense ell, l'app se sincronitza en tornar de Checkout i cada 12 h.
 *  Cada esdeveniment s'aplica una sola vegada (taula Pagament, id = ev.id; el passi, per id de sessió, compartit amb /api/checkout/confirmar).
 *  Es rebutgen esdeveniments d'un livemode diferent del mode configurat (STRIPE_MODO). */
export async function POST(req: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || modoPago() !== 'stripe') return error('webhook no configurat', 501);
  if (!hayDb()) return error('Base de dades no configurada', 503);
  const cuerpo = await req.text();
  let ev: Stripe.Event;
  try { ev = stripe().webhooks.constructEvent(cuerpo, req.headers.get('stripe-signature') ?? '', secreto); } catch { return error('signatura invàlida', 400); }
  if (!livemodeCoherent(ev.livemode)) return error('livemode incoherent amb STRIPE_MODO', 400);
  if (!(await registrarPagament(ev.id, `event.${ev.type}`))) return json({ rebut: true, repetit: true });
  const s = stripe();
  switch (ev.type) {
    case 'customer.subscription.created': case 'customer.subscription.updated': case 'customer.subscription.paused': case 'customer.subscription.resumed': {
      const sub = ev.data.object as Stripe.Subscription;
      await guardarSubscripcio(sub, sub.metadata?.usuariId || undefined);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = ev.data.object as Stripe.Subscription;
      await revocarPremium({ usuariId: sub.metadata?.usuariId || null, customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id }, 'canceled');
      break;
    }
    case 'checkout.session.completed': {
      const ses = ev.data.object as Stripe.Checkout.Session;
      const usuariId = ses.client_reference_id ?? ses.metadata?.usuariId ?? null;
      if (ses.mode === 'subscription' && ses.subscription) {
        const sub = await s.subscriptions.retrieve(typeof ses.subscription === 'string' ? ses.subscription : ses.subscription.id);
        await guardarSubscripcio(sub, usuariId ?? undefined);
      } else if (ses.mode === 'payment' && ses.payment_status === 'paid' && usuariId) {
        const p = plan(ses.metadata?.plan ?? 'pase');
        if (p && (await registrarPagament(ses.id, 'checkout.passi', usuariId))) {
          await activarPassi(usuariId, p, typeof ses.customer === 'string' ? ses.customer : ses.customer?.id, new Date(ses.created * 1000));
        }
      }
      break;
    }
    case 'charge.refunded': {
      const ch = ev.data.object as Stripe.Charge;
      const total = ch.refunded || (ch.amount_refunded ?? 0) >= ch.amount;
      if (total) await revocarPremium({ customer: typeof ch.customer === 'string' ? ch.customer : ch.customer?.id, usuariId: ch.metadata?.usuariId || null }, 'refunded');
      else console.warn('charge.refunded parcial', ch.id, ch.amount_refunded, ch.amount);
      break;
    }
    case 'charge.dispute.created': {
      const d = ev.data.object as Stripe.Dispute;
      const chId = typeof d.charge === 'string' ? d.charge : d.charge?.id;
      let customer: string | null = null;
      if (chId) { try { const ch = await s.charges.retrieve(chId); customer = typeof ch.customer === 'string' ? ch.customer : ch.customer?.id ?? null; } catch (e) { console.error('dispute: charge', e); } }
      await revocarPremium({ customer }, 'disputed');
      break;
    }
  }
  return json({ rebut: true });
}
