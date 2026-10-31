import Stripe from "stripe";
import { URL_BASE, precioCents, type Formato } from "./config";

// Stripe Checkout. Sin STRIPE_SECRET_KEY se usa el «simulador»: una página local que dispara
// el mismo webhook firmado con STRIPE_WEBHOOK_SECRET, para probar el flujo de punta a punta.
export const SECRETO_WEBHOOK_LOCAL = "whsec_simulador_local_lunilla";

// Cuenta de Stripe «Numi Mates» (DESPLIEGUES.md §2): STRIPE_SECRET_KEY (real, al lanzar) o STRIPE_TEST_SECRET_KEY.
export function claveStripe(): string | undefined {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY || undefined;
}

export function stripe(): Stripe | null {
  const k = claveStripe();
  return k ? new Stripe(k) : null;
}

/** En producción el secreto local (público en el repo) permitiría falsificar pagos: ahí es obligatorio el real. */
export const esProduccion = () => process.env.VERCEL_ENV === "production" || process.env.NODE_ENV_LUNILLA === "production";

export function secretoWebhook(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (s) return s;
  if (esProduccion()) throw new Error("Falta STRIPE_WEBHOOK_SECRET en producción");
  return SECRETO_WEBHOOK_LOCAL;
}

function precioStripe(f: Formato): string | undefined {
  return (f === "pdf" ? process.env.STRIPE_PRICE_PDF : process.env.STRIPE_PRICE_TAPA_DURA) || undefined;
}

export interface DatosCheckout {
  pedidoId: string;
  formato: Formato;
  titulo: string;
  idioma: "es" | "ca";
  email?: string;
  afiliado?: string;
}

export async function crearCheckout(d: DatosCheckout): Promise<{ url: string; sessionId: string; simulado: boolean }> {
  const s = stripe();
  const base = URL_BASE();
  const pref = d.idioma === "ca" ? "/ca" : "";
  if (!s) {
    const sessionId = `cs_sim_${d.pedidoId}_${Date.now()}`;
    return { url: `${base}${pref}/pago-simulado/${d.pedidoId}?s=${sessionId}&f=${d.formato}`, sessionId, simulado: true };
  }
  const nombre =
    d.formato === "pdf"
      ? d.idioma === "ca" ? `Conte personalitzat en PDF: ${d.titulo}` : `Cuento personalizado en PDF: ${d.titulo}`
      : d.idioma === "ca" ? `Conte personalitzat en tapa dura: ${d.titulo}` : `Cuento personalizado en tapa dura: ${d.titulo}`;
  const sesion = await s.checkout.sessions.create({
    mode: "payment",
    locale: d.idioma === "ca" ? "auto" : "es",
    customer_email: d.email,
    client_reference_id: d.pedidoId,
    metadata: { proyecto: "g-cuentos", pedidoId: d.pedidoId, formato: d.formato, afiliado: d.afiliado ?? "" },
    payment_intent_data: { metadata: { proyecto: "g-cuentos", pedidoId: d.pedidoId } },
    // Precio creado por scripts/stripe-configurar.mjs (STRIPE_PRICE_*); si no existe, precio en línea.
    line_items: [
      precioStripe(d.formato)
        ? { quantity: 1, price: precioStripe(d.formato)! }
        : { quantity: 1, price_data: { currency: "eur", unit_amount: precioCents(d.formato), product_data: { name: nombre } } },
    ],
    ...(d.formato === "tapaDura"
      ? { shipping_address_collection: { allowed_countries: ["ES"] }, phone_number_collection: { enabled: true } }
      : {}),
    allow_promotion_codes: true,
    success_url: `${base}${pref}/pedido/${d.pedidoId}?ok=1`,
    cancel_url: `${base}${pref}/cuento/${d.pedidoId}`,
  });
  return { url: sesion.url!, sessionId: sesion.id, simulado: false };
}
