import { NextResponse } from "next/server";
import { config, esIdioma, urlBase } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { emailSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = stripe();
  if (!s) return NextResponse.json({ error: "Stripe sin configurar (falta STRIPE_SECRET_KEY)" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const plan = body.plan === "pack" ? "pack" : body.plan === "suscripcion" ? "suscripcion" : null;
  const idioma = typeof body.idioma === "string" && esIdioma(body.idioma) ? body.idioma : config.idiomaPorDefecto;
  if (!plan) return NextResponse.json({ error: "plan" }, { status: 400 });
  // Consentimiento expreso para contenido digital (art. 103.m TRLGDCU): sin él no se vende.
  if (body.desistimiento !== true || body.condiciones !== true) return NextResponse.json({ error: "consentimiento" }, { status: 400 });

  const email = await emailSesion();
  const base = urlBase();
  const p = config.precios;
  const comun = {
    success_url: `${base}/${idioma}/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/${idioma}/precios`,
    locale: "auto" as const,
    customer_email: email ?? undefined,
    metadata: { plan, idioma, pais: config.pais, consentimientoDesistimiento: new Date().toISOString() },
    allow_promotion_codes: true
  };
  const sesion =
    plan === "pack"
      ? await s.checkout.sessions.create({
          ...comun,
          mode: "payment",
          customer_creation: "always",
          line_items: [{ quantity: 1, price_data: { currency: config.moneda, unit_amount: p.pack.importeCentimos, product_data: { name: `${config.marca} · Pack ${p.pack.mesesAcceso} meses` } } }]
        })
      : await s.checkout.sessions.create({
          ...comun,
          mode: "subscription",
          subscription_data: { metadata: { plan, idioma, pais: config.pais } },
          line_items: [{ quantity: 1, price_data: { currency: config.moneda, unit_amount: p.suscripcion.importeCentimos, recurring: { interval: "month" }, product_data: { name: `${config.marca} · Suscripción mensual` } } }]
        });
  return NextResponse.json({ url: sesion.url });
}
