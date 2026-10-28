import type Stripe from 'stripe';
import { stripe, guardarSuscripcion, modoPago } from '@/lib/pagos';
import { error, json } from '@/lib/http';
import { db } from '@/lib/db';
import { enviarCorreo } from '@/lib/correo';

export const dynamic = 'force-dynamic';

/** Webhook opcional (STRIPE_WEBHOOK_SECRET). Sin él, la app se sincroniza al volver de Checkout y cada 12 h. */
export async function POST(req: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || modoPago() !== 'stripe') return error('webhook no configurado', 501);
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
    case 'checkout.session.expired': {
      // Recuperación: un solo correo con el enlace de pago nuevo que genera Stripe.
      const s = ev.data.object as Stripe.Checkout.Session;
      const url = s.after_expiration?.recovery?.url;
      const uid = s.client_reference_id;
      if (url && uid) {
        const ya = await db.ajuste.findUnique({ where: { clave: `aviso-recuperacion:${uid}` } });
        const u = await db.usuario.findUnique({ where: { id: uid } });
        if (!ya && u && !['active', 'trialing'].includes(u.suscripcionEstado ?? '')) {
          const ca = u.idioma !== 'es';
          await enviarCorreo(u.email, ca ? 'El teu pagament de Plaça ha quedat a mitges' : 'Tu pago de Plaça se quedó a medias',
            ca ? `Hola,\n\nVas començar la subscripció a Plaça però no es va completar. Si encara la vols, aquí tens l'enllaç (9,99 €/mes, cancel·la amb un clic):\n${url}\n\nNo t'escriurem més per això.\n\nPlaça`
               : `Hola:\n\nEmpezaste la suscripción a Plaça pero no se completó. Si aún la quieres, aquí tienes el enlace (9,99 €/mes, cancela en un clic):\n${url}\n\nNo te escribiremos más por esto.\n\nPlaça`).catch(() => false);
          await db.ajuste.create({ data: { clave: `aviso-recuperacion:${uid}`, valor: new Date().toISOString() } });
          await db.ajuste.upsert({ where: { clave: `checkout:${uid}` }, update: { valor: JSON.stringify({ url, hasta: Date.now() + 30 * 864e5 }) }, create: { clave: `checkout:${uid}`, valor: JSON.stringify({ url, hasta: Date.now() + 30 * 864e5 }) } });
        }
      }
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
