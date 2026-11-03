import { nombreProyecto } from '@/lib/control/comun';
import { datosStripe, esDeCartera } from '@/lib/control/stripe';
import { csv } from '@/lib/mando/filtros';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const r = await datosStripe();
  if (!r.ok) return new Response('Stripe no respondió', { status: 502 });
  const filas = [['proyecto', 'email', 'producto', 'estado', 'mensual_eur', 'intervalo', 'creada', 'fin_periodo', 'fin_prueba', 'cancela_al_final', 'cancelada_el', 'stripe']];
  for (const s of r.datos.suscripciones.filter((x) => sp.get('todas') === '1' || esDeCartera(x.proyecto)))
    filas.push([nombreProyecto(s.proyecto), s.email ?? '', s.producto, s.estado, (s.mensual / 100).toFixed(2), s.intervalo, s.creada.toISOString(), s.finPeriodo?.toISOString() ?? '', s.finPrueba?.toISOString() ?? '', s.cancelaAlFinal ? 'sí' : 'no', s.canceladaEl?.toISOString() ?? '', s.url]);
  return csv(filas, 'suscripciones');
}
