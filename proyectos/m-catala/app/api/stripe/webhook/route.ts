import type Stripe from 'stripe';
import { stripe, guardarSubscripcio, modoPago, plan, activarPassi } from '@/lib/pagos';
import { error, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Webhook opcional (STRIPE_WEBHOOK_SECRET). Sense ell, l'app se sincronitza en tornar de Checkout i cada 12 h. */
export async function POST(req: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || modoPago() !== 'stripe') return error('webhook no configurat', 501);
  const cuerpo = await req.text();
  let ev: Stripe.Event;
  try { ev = stripe().webhooks.constructEvent(cuerpo, req.headers.get('stripe-signature') ?? '', secreto); } catch { return error('signatura invàlida', 400); }
  switch (ev.type) {
    case 'customer.subscription.created': case 'customer.subscription.updated': case 'customer.subscription.deleted': case 'customer.subscription.paused': case 'customer.subscription.resumed': {
      const sub = ev.data.object as Stripe.Subscription;
      await guardarSubscripcio(sub, sub.metadata?.usuariId || undefined);
      break;
    }
    case 'checkout.session.completed': {
      const s = ev.data.object as Stripe.Checkout.Session;
      if (s.mode === 'subscription' && s.subscription) {
        const sub = await stripe().subscriptions.retrieve(typeof s.subscription === 'string' ? s.subscription : s.subscription.id);
        await guardarSubscripcio(sub, s.client_reference_id ?? undefined);
      } else if (s.mode === 'payment' && s.payment_status === 'paid' && s.client_reference_id) {
        const p = plan(s.metadata?.plan ?? 'pase');
        if (p) await activarPassi(s.client_reference_id, p, typeof s.customer === 'string' ? s.customer : s.customer?.id);
      }
      break;
    }
  }
  return json({ rebut: true });
}
