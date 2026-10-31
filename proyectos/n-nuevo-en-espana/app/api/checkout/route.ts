import { NextResponse } from "next/server";
import { config, esIdioma, urlBase } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { emailSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/** Nombre comercial que ve el cliente en Checkout y recibos (la cuenta de Stripe es Numi Mates). */
const MARCA = "Tus Papeles";
/** Sufijo del descriptor bancario: prefijo de la cuenta + «* » + esto ≤ 22; solo letras, números y espacios. */
const DESCRIPTOR_SUFIJO = "TUSPAPELES";

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
    metadata: { proyecto: config.proyecto, plan, idioma, pais: config.pais, consentimientoDesistimiento: new Date().toISOString() },
    allow_promotion_codes: true,
    custom_text: { submit: { message: `${MARCA} · Acceso inmediato en tuspapeles.app tras el pago.` } }
  };
  const sesion =
    plan === "pack"
      ? await s.checkout.sessions.create({
          ...comun,
          mode: "payment",
          customer_creation: "always",
          // El extracto del banco muestra la web y no solo la cuenta (p. ej. «NUMI MATES* TUSPAPELES»).
          payment_intent_data: { statement_descriptor_suffix: DESCRIPTOR_SUFIJO, description: p.pack.productoStripe },
          line_items: [process.env.STRIPE_PRICE_PACK
            ? { quantity: 1, price: process.env.STRIPE_PRICE_PACK }
            : { quantity: 1, price_data: { currency: config.moneda, unit_amount: p.pack.importeCentimos, tax_behavior: "inclusive", product_data: { name: p.pack.productoStripe, metadata: { proyecto: config.proyecto } } } }]
        })
      : await s.checkout.sessions.create({
          ...comun,
          mode: "subscription",
          // En suscripciones el descriptor dinámico no se puede fijar por sesión: el extracto usa el de la cuenta.
          subscription_data: { description: `${MARCA} — suscripción mensual`, metadata: { plan, idioma, pais: config.pais } },
          line_items: [process.env.STRIPE_PRICE_MENSUAL
            ? { quantity: 1, price: process.env.STRIPE_PRICE_MENSUAL }
            : { quantity: 1, price_data: { currency: config.moneda, unit_amount: p.suscripcion.importeCentimos, tax_behavior: "inclusive", recurring: { interval: "month" }, product_data: { name: p.suscripcion.productoStripe, metadata: { proyecto: config.proyecto } } } }]
        });
  return NextResponse.json({ url: sesion.url });
}
