import { usuarioActual } from '@/lib/auth';
import { claveStripe, crearCheckout } from '@/lib/stripe';
import { cuerpo, error, ok } from '@/lib/http';
import { esLocale } from '@/lib/config';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const u = await usuarioActual().catch(() => null);
  if (!u) return error('no_autenticado', 401);
  if (!claveStripe()) return error('stripe_no_configurado', 503);
  const b = await cuerpo<{ locale: string }>(req);
  try {
    const s = await crearCheckout({ usuarioId: u.id, email: u.email, locale: esLocale(b.locale) ? b.locale : 'es', ref: (await cookies()).get('ccse_ref')?.value ?? null });
    await db().usuario.update({ where: { id: u.id }, data: { checkoutIniciado: new Date() } }).catch(() => {});
    return ok({ url: s.url });
  } catch (e) {
    console.error(e);
    return error('stripe_error', 502);
  }
}
