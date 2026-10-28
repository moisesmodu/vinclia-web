import type Stripe from 'stripe';
import { stripe, guardarSuscripcion } from '@/lib/pagos';
import { error, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Webhook opcional (STRIPE_WEBHOOK_SECRET). Sin él, la app se sincroniza al volver de Checkout y cada 12 h. */
export async function POST(req: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || !process.env.STRIPE_SECRET_KEY) return error('webhook no configurado', 501);
  const cuerpo = await req.text();
  let ev: Stripe.Event;
  try {
    ev = stripe().webhooks.constructEvent(cuerpo, req.headers.get('stripe-signature') ?? '', secreto);
  } catch {
    return error('firma inválida', 400);
  }
  switch (ev.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed': {
      const sub = ev.data.object as Stripe.Subscription;
      await guardarSuscripcion(sub, sub.metadata?.usuarioId || undefined);
      break;
    }
    case 'checkout.session.completed': {
      const s = ev.data.object as Stripe.Checkout.Session;
      if (s.subscription) {
        const sub = await stripe().subscriptions.retrieve(typeof s.subscription === 'string' ? s.subscription : s.subscription.id);
        await guardarSuscripcion(sub, s.client_reference_id ?? undefined);
      }
      break;
    }
  }
  return json({ recibido: true });
}
