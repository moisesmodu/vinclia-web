import type Stripe from 'stripe';
import { stripe, secretoWebhook, concederAcceso, recuperarPago } from '@/lib/stripe';
import { error, ok } from '@/lib/http';

export async function POST(req: Request) {
  const firma = req.headers.get('stripe-signature');
  const secreto = await secretoWebhook().catch(() => null);
  if (!firma || !secreto) return error('sin_firma', 400);
  const crudo = await req.text();
  let evento: Stripe.Event;
  try {
    evento = await stripe().webhooks.constructEventAsync(crudo, firma, secreto);
  } catch {
    return error('firma_invalida', 400);
  }
  if (evento.type === 'checkout.session.completed' || evento.type === 'checkout.session.async_payment_succeeded') {
    await concederAcceso(evento.data.object as Stripe.Checkout.Session);
  }
  if (evento.type === 'checkout.session.expired') await recuperarPago(evento.data.object as Stripe.Checkout.Session);
  return ok({ recibido: true });
}
