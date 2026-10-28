import Stripe from "stripe";
import { config } from "./config";
import { db } from "./db";
import { normalizarEmail } from "./acceso";

let cliente: Stripe | null = null;

export function stripe(): Stripe | null {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) return null;
  if (!cliente) {
    // STRIPE_API_BASE solo se usa en pruebas locales (scripts/prueba-e2e.mjs) para apuntar a un simulador.
    const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
    cliente = base
      ? new Stripe(k, { host: base.hostname, port: Number(base.port), protocol: base.protocol.replace(":", "") as "http" | "https" })
      : new Stripe(k);
  }
  return cliente;
}

export function modoPrueba(): boolean {
  return !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
}

const DIA = 86400 * 1000;

/**
 * Da acceso a partir de una sesión de Checkout pagada. Idempotente: la llaman el webhook y la página de gracias,
 * y la que llegue primero gana; la segunda no cambia nada.
 */
export async function concederDesdeCheckout(s: Stripe.Checkout.Session): Promise<string | null> {
  const email = s.customer_details?.email ?? s.customer_email;
  if (!email) return null;
  const pagado = s.payment_status === "paid" || s.payment_status === "no_payment_required";
  if (s.status !== "complete" || !pagado) return null;
  const plan = s.metadata?.plan === "pack" ? "pack" : "suscripcion";
  const idioma = s.metadata?.idioma ?? config.idiomaPorDefecto;
  const correo = normalizarEmail(email);
  const inicio = new Date((s.created ?? Date.now() / 1000) * 1000);
  const hasta =
    plan === "pack"
      ? new Date(inicio.getTime() + config.precios.pack.mesesAcceso * 30.5 * DIA)
      : new Date(inicio.getTime() + 33 * DIA); // un mes + margen; invoice.paid lo ajusta al periodo real
  const customer = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
  const subscription = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;

  const actual = await db.usuario.findUnique({ where: { email: correo } });
  const nuevoHasta = actual?.accesoHasta && actual.accesoHasta > hasta ? actual.accesoHasta : hasta;
  await db.usuario.upsert({
    where: { email: correo },
    create: { email: correo, idioma, plan, accesoHasta: hasta, stripeCustomerId: customer, stripeSubscriptionId: subscription },
    update: {
      plan, accesoHasta: nuevoHasta,
      ...(customer ? { stripeCustomerId: customer } : {}),
      ...(subscription ? { stripeSubscriptionId: subscription } : {})
    }
  });
  return correo;
}
