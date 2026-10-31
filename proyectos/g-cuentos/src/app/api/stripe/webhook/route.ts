import { after, NextResponse } from "next/server";
import Stripe from "stripe";
import { evento } from "@/lib/db";
import { secretoWebhook, stripe } from "@/lib/pagos";
import { avanzar, marcarPagado } from "@/lib/pedidos";
import type { DireccionEnvio } from "@/lib/imprenta/gelato";

export const runtime = "nodejs";
export const maxDuration = 300;

type Direccion = { line1?: string | null; line2?: string | null; city?: string | null; postal_code?: string | null; state?: string | null; country?: string | null };

export async function POST(req: Request) {
  const firma = req.headers.get("stripe-signature");
  const cuerpo = await req.text();
  let ev: Stripe.Event;
  try {
    // constructEvent no usa la clave secreta, solo el secreto del webhook.
    ev = (stripe() ?? new Stripe("sk_test_solo_para_verificar")).webhooks.constructEvent(cuerpo, firma ?? "", secretoWebhook());
  } catch (e) {
    return NextResponse.json({ error: `firma no válida: ${(e as Error).message}` }, { status: 400 });
  }
  if (ev.type !== "checkout.session.completed" && ev.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ recibido: true });
  }
  const s = ev.data.object as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Direccion | null } | null;
    collected_information?: { shipping_details?: { name?: string | null; address?: Direccion | null } | null } | null;
  };
  // «no_payment_required»: pedido gratis con un cupón del 100 % (también hay que producirlo)
  if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") return NextResponse.json({ recibido: true, pendiente: true });
  const pedidoId = s.metadata?.pedidoId ?? s.client_reference_id;
  if (!pedidoId) return NextResponse.json({ error: "sin pedido" }, { status: 400 });
  const envioStripe = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const a = envioStripe?.address;
  const envio: DireccionEnvio | null = a?.line1
    ? {
        nombre: envioStripe?.name ?? s.customer_details?.name ?? "", linea1: a.line1, linea2: a.line2 ?? undefined,
        ciudad: a.city ?? "", cp: a.postal_code ?? "", provincia: a.state ?? undefined, pais: a.country ?? "ES",
        email: s.customer_details?.email ?? "", telefono: s.customer_details?.phone ?? undefined,
      }
    : null;
  const p = await marcarPagado({
    pedidoId, sessionId: s.id, paymentId: typeof s.payment_intent === "string" ? s.payment_intent : undefined,
    email: s.customer_details?.email ?? s.customer_email, nombre: s.customer_details?.name, importe: s.amount_total ?? 0,
    envio, afiliado: s.metadata?.afiliado || null, formato: (s.metadata?.formato as "pdf" | "tapaDura") ?? undefined,
  });
  if (!p) return NextResponse.json({ error: "pedido desconocido" }, { status: 404 });
  await evento("webhook", p.id, { tipo: ev.type, livemode: ev.livemode });
  after(async () => { await avanzar(p.id); });
  return NextResponse.json({ recibido: true });
}
