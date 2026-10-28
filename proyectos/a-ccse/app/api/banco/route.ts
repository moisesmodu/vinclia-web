import { traducciones } from '@/lib/banco';
import { tieneAcceso, usuarioActual } from '@/lib/auth';
import { ES_GRATIS } from '@/lib/preguntas';
import { LENGUAS_EXPLICACION, type LenguaExplicacion } from '@/lib/config';
import { error, ok } from '@/lib/http';
export const dynamic = 'force-dynamic';

/** Explicaciones y traducciones: las 25 gratis para todos; el resto solo con acceso. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lengua = u.searchParams.get('lengua') as LenguaExplicacion;
  if (!LENGUAS_EXPLICACION.includes(lengua)) return error('lengua');
  const ids = (u.searchParams.get('ids') ?? '').split(',').map(Number).filter(Number.isFinite).slice(0, 300);
  const acceso = tieneAcceso(await usuarioActual().catch(() => null));
  const t = traducciones(lengua);
  const datos: Record<string, unknown> = {};
  const bloqueadas: number[] = [];
  for (const id of ids) {
    if (!acceso && !ES_GRATIS.has(id)) bloqueadas.push(id);
    else if (t[id]) datos[id] = t[id];
  }
  return ok({ acceso, datos, bloqueadas });
}
