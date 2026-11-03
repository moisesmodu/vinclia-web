import { PROYECTOS_CONTROL } from '@/lib/control/comun';
import { filtrar, leerFiltros, usuariosUnificados } from '@/lib/control/unificado';
import { csv } from '@/lib/mando/filtros';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const f = leerFiltros(Object.fromEntries(new URL(req.url).searchParams));
  const { usuarios } = await usuariosUnificados();
  const nombre = (c: string) => PROYECTOS_CONTROL.find((p) => p.clave === c)?.nombre ?? c;
  const filas = [['proyecto', 'email', 'alta', 'estado', 'plan', 'ultimo_pago']];
  for (const u of filtrar(usuarios, f)) filas.push([nombre(u.proyecto), u.email, u.alta.toISOString(), u.estado, u.plan, u.ultimoPago?.toISOString() ?? '']);
  return csv(filas, 'usuarios');
}
