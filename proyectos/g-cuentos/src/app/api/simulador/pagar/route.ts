import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { precioCents, URL_BASE } from "@/lib/config";
import { db } from "@/lib/db";
import { secretoWebhook } from "@/lib/pagos";

export const runtime = "nodejs";

// SOLO sin STRIPE_SECRET_KEY: fabrica el evento checkout.session.completed que mandaría Stripe,
// lo firma con el secreto del webhook y lo envía por HTTP al webhook real.
const Esquema = z.object({
  pedidoId: z.string(), sessionId: z.string().startsWith("cs_sim_"), formato: z.enum(["pdf", "tapaDura"]),
  email: z.string().email(), nombre: z.string().min(1),
  linea1: z.string().optional(), ciudad: z.string().optional(), cp: z.string().optional(), telefono: z.string().optional(),
});

export async function POST(req: Request) {
  if (process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "simulador desactivado: hay claves de Stripe" }, { status: 403 });
  const r = Esquema.safeParse(await req.json().catch(() => ({})));
  if (!r.success) return NextResponse.json({ error: r.error.issues.map((i) => i.path.join(".")).join(", ") }, { status: 400 });
  const d = r.data;
  const p = await db.pedido.findUnique({ where: { id: d.pedidoId } });
  if (!p) return NextResponse.json({ error: "pedido desconocido" }, { status: 404 });
  const sesion = {
    id: d.sessionId, object: "checkout.session", payment_status: "paid", status: "complete", mode: "payment",
    amount_total: precioCents(d.formato), currency: "eur", client_reference_id: d.pedidoId, customer_email: d.email,
    payment_intent: `pi_sim_${Date.now()}`,
    metadata: { pedidoId: d.pedidoId, formato: d.formato, afiliado: p.afiliado ?? "" },
    customer_details: { email: d.email, name: d.nombre, phone: d.telefono ?? null },
    collected_information: d.formato === "tapaDura" ? { shipping_details: { name: d.nombre, address: { line1: d.linea1, line2: null, city: d.ciudad, postal_code: d.cp, state: null, country: "ES" } } } : null,
  };
  const evento = { id: `evt_sim_${Date.now()}`, object: "event", type: "checkout.session.completed", livemode: false, created: Math.floor(Date.now() / 1000), data: { object: sesion } };
  const payload = JSON.stringify(evento);
  const header = new Stripe("sk_test_simulador").webhooks.generateTestHeaderString({ payload, secret: secretoWebhook() });
  const resp = await fetch(`${URL_BASE()}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload });
  const j = await resp.json();
  return NextResponse.json({ webhook: resp.status, respuesta: j }, { status: resp.ok ? 200 : 502 });
}
