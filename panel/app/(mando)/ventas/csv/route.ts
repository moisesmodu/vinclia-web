import { nombreProyecto } from '@/lib/control/comun';
import { datosStripe } from '@/lib/control/stripe';
import { csv, filtrarVentas, leerVentas } from '@/lib/mando/filtros';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const f = leerVentas(Object.fromEntries(new URL(req.url).searchParams));
  const r = await datosStripe();
  if (!r.ok) return new Response('Stripe no respondió', { status: 502 });
  const filas = [['fecha', 'proyecto', 'email', 'estado', 'importe_eur', 'reembolsado_eur', 'moneda', 'stripe']];
  for (const p of filtrarVentas(r.datos.pagos, f)) filas.push([p.creado.toISOString(), nombreProyecto(p.proyecto), p.email ?? '', p.estado, (p.importe / 100).toFixed(2), (p.reembolsado / 100).toFixed(2), p.moneda, p.url]);
  return csv(filas, 'ventas');
}
