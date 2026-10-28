import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailSesion } from "@/lib/sesion";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Cancela al final del periodo pagado. El acceso sigue hasta entonces; el webhook lo cierra después.
export async function POST() {
  const email = await emailSesion();
  const s = stripe();
  if (!email || !s) return NextResponse.json({ error: "sin sesión" }, { status: 401 });
  const u = await db.usuario.findUnique({ where: { email } });
  if (!u?.stripeSubscriptionId) return NextResponse.json({ error: "sin suscripción" }, { status: 404 });
  await s.subscriptions.update(u.stripeSubscriptionId, { cancel_at_period_end: true });
  return NextResponse.json({ ok: true });
}
