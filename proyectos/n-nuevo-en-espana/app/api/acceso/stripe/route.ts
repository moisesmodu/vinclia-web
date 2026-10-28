import { NextResponse } from "next/server";
import { stripe, concederDesdeCheckout } from "@/lib/stripe";
import { abrirSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

// Al volver de Stripe: comprueba la sesión de pago, concede acceso (si el webhook aún no llegó) y abre sesión.
export async function GET(req: Request) {
  const s = stripe();
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!s || !id.startsWith("cs_")) return NextResponse.json({ ok: false }, { status: 400 });
  const sesion = await s.checkout.sessions.retrieve(id).catch(() => null);
  if (!sesion) return NextResponse.json({ ok: false }, { status: 404 });
  const email = await concederDesdeCheckout(sesion);
  if (!email) return NextResponse.json({ ok: false, pendiente: true }, { status: 202 });
  await abrirSesion(email);
  return NextResponse.json({ ok: true });
}
