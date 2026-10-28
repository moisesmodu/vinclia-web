import Stripe from "stripe";
import { URL_BASE, precioCents, type Formato } from "./config";

// Stripe Checkout. Sin STRIPE_SECRET_KEY se usa el «simulador»: una página local que dispara
// el mismo webhook firmado con STRIPE_WEBHOOK_SECRET, para probar el flujo de punta a punta.
export const SECRETO_WEBHOOK_LOCAL = "whsec_simulador_local_lunilla";

export function stripe(): Stripe | null {
  const k = process.env.STRIPE_SECRET_KEY;
  return k ? new Stripe(k) : null;
}

export function secretoWebhook(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? SECRETO_WEBHOOK_LOCAL;
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
    metadata: { pedidoId: d.pedidoId, formato: d.formato, afiliado: d.afiliado ?? "" },
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: precioCents(d.formato), product_data: { name: nombre } } }],
    ...(d.formato === "tapaDura"
      ? { shipping_address_collection: { allowed_countries: ["ES"] }, phone_number_collection: { enabled: true } }
      : {}),
    allow_promotion_codes: true,
    success_url: `${base}${pref}/pedido/${d.pedidoId}?ok=1`,
    cancel_url: `${base}${pref}/cuento/${d.pedidoId}`,
  });
  return { url: sesion.url!, sessionId: sesion.id, simulado: false };
}
