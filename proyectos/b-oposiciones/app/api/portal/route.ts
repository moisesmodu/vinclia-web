import { usuarioActual } from '@/lib/auth';
import { modoPago, urlPortal, PortalNoDisponible } from '@/lib/pagos';
import { json, error } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  if (modoPago() !== 'stripe' || !u.stripeCustomerId) return error('sin cliente de Stripe', 400);
  const idioma = (await req.json().catch(() => ({})))?.idioma === 'es' ? 'es' : 'ca';
  try {
    return json({ url: await urlPortal(u, `${new URL(req.url).origin}/${idioma}/cuenta`) });
  } catch (e) {
    // Una clave restringida sin permiso de "Customer portal" no puede abrirlo: la cancelación sigue disponible en la cuenta.
    if (!(e instanceof PortalNoDisponible)) console.error('[portal]', (e as Error)?.message);
    const mensaje =
      idioma === 'es'
        ? 'Ahora mismo no se puede abrir el portal de facturación. Puedes cancelar o reactivar la suscripción desde esta página; para facturas o cambiar la tarjeta, escríbenos.'
        : 'Ara mateix no es pot obrir el portal de facturació. Pots cancel·lar o reactivar la subscripció des d’aquesta pàgina; per a factures o canviar la targeta, escriu-nos.';
    return json({ error: 'portal no disponible', mensaje }, 503);
  }
}
