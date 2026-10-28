import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, concederDesdeCheckout } from "@/lib/stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = stripe();
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secreto) return NextResponse.json({ error: "Stripe sin configurar" }, { status: 503 });
  const firma = req.headers.get("stripe-signature") ?? "";
  const cuerpo = await req.text();
  let ev: Stripe.Event;
  try {
    ev = s.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return NextResponse.json({ error: "firma no válida" }, { status: 400 });
  }
  // Idempotencia: Stripe puede reenviar el mismo evento.
  const visto = await db.eventoStripe.findUnique({ where: { id: ev.id } });
  if (visto) return NextResponse.json({ ok: true, repetido: true });

  switch (ev.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await concederDesdeCheckout(ev.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.paid": {
      // Cada mes pagado amplía el acceso hasta el final del periodo (+2 días de margen).
      const inv = ev.data.object as Stripe.Invoice;
      const customer = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      const fin = Math.max(0, ...inv.lines.data.map((l) => l.period?.end ?? 0));
      if (customer && fin) {
        const hasta = new Date((fin + 2 * 86400) * 1000);
        const u = await db.usuario.findUnique({ where: { stripeCustomerId: customer } });
        if (u && (!u.accesoHasta || u.accesoHasta < hasta)) await db.usuario.update({ where: { id: u.id }, data: { accesoHasta: hasta, plan: "suscripcion" } });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = ev.data.object as Stripe.Subscription;
      const u = await db.usuario.findUnique({ where: { stripeSubscriptionId: sub.id } });
      if (u && u.plan === "suscripcion") {
        const fin = sub.ended_at ? new Date(sub.ended_at * 1000) : new Date();
        await db.usuario.update({ where: { id: u.id }, data: { accesoHasta: fin } });
      }
      break;
    }
    case "charge.refunded": {
      const ch = ev.data.object as Stripe.Charge;
      const customer = typeof ch.customer === "string" ? ch.customer : ch.customer?.id;
      if (customer && ch.refunded) await db.usuario.updateMany({ where: { stripeCustomerId: customer }, data: { accesoHasta: new Date() } });
      break;
    }
  }
  await db.eventoStripe.create({ data: { id: ev.id, tipo: ev.type } });
  return NextResponse.json({ ok: true });
}
