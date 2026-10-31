// Cotizaciones a la Seguridad Social del Régimen General (trabajador por cuenta ajena).
// Método: base mensual = retribución anual / 12 (incluye la prorrata de pagas extra), acotada entre la base
// mínima del grupo y la base máxima; tipos de la Orden de cotización del año; cotización adicional de
// solidaridad sobre la parte del salario que supera la base máxima.
import { r2, clamp, pos } from './base';

export type Contrato = 'indefinido' | 'temporal';

export interface EntradaSS {
  brutoAnual: number;
  contrato?: Contrato;
  grupo?: string; // grupo de cotización 1–11; por defecto 7 (el más habitual sin titulación)
  parcial?: boolean; // tiempo parcial: no se aplica la base mínima de jornada completa
}

export interface Linea { concepto: string; tipo: number; importe: number }

export interface ResultadoSS {
  baseReal: number;
  base: number;
  topada: boolean;
  trabajador: { lineas: Linea[]; tipo: number; mensual: number; anual: number; solidaridadMensual: number };
  empresa: { lineas: Linea[]; tipo: number; mensual: number; anual: number; solidaridadMensual: number };
}

export function baseMinima(L: any, grupo = '7'): number {
  const c = L.cotizacion;
  if (c.bases_min_mensual_por_grupo?.[grupo]) return c.bases_min_mensual_por_grupo[grupo];
  if (c.bases_min_diaria_por_grupo?.[grupo]) return c.bases_min_diaria_por_grupo[grupo] * 30;
  return c.bases_min_mensual_por_grupo?.['7'] ?? L.smi.mensual14 * 14 / 12;
}

/** Cotización de solidaridad mensual sobre el exceso de la base máxima. */
export function solidaridad(baseReal: number, L: any): { total: number; empresa: number; trabajador: number } {
  const max = L.cotizacion.base_max_mensual;
  const tramos: any[] = L.cotizacion.solidaridad ?? [];
  let total = 0, empresa = 0, trabajador = 0;
  for (const t of tramos) {
    const desde = max * t.desde_x_base_max;
    const hasta = t.hasta_x_base_max == null ? Infinity : max * t.hasta_x_base_max;
    const parte = pos(Math.min(baseReal, hasta) - desde);
    if (parte <= 0) continue;
    total += parte * t.tipo_total / 100;
    empresa += parte * t.empresa / 100;
    trabajador += parte * t.trabajador / 100;
  }
  return { total, empresa, trabajador };
}

export function cotizacion(e: EntradaSS, L: any): ResultadoSS {
  const c = L.cotizacion;
  const contrato = e.contrato ?? 'indefinido';
  const baseReal = e.brutoAnual / 12;
  const min = e.parcial ? 0 : baseMinima(L, e.grupo);
  const base = clamp(baseReal, min, c.base_max_mensual);
  const t = c.trabajador;
  const em = c.empresa;
  const desT = contrato === 'temporal' ? t.desempleo_temporal : t.desempleo_indefinido;
  const desE = contrato === 'temporal' ? em.desempleo_temporal : em.desempleo_indefinido;
  const lt: Linea[] = [
    { concepto: 'cc', tipo: t.cc, importe: base * t.cc / 100 },
    { concepto: 'desempleo', tipo: desT, importe: base * desT / 100 },
    { concepto: 'fp', tipo: t.fp, importe: base * t.fp / 100 },
    { concepto: 'mei', tipo: t.mei, importe: base * t.mei / 100 },
  ];
  const le: Linea[] = [
    { concepto: 'cc', tipo: em.cc, importe: base * em.cc / 100 },
    { concepto: 'atep', tipo: em.at_ep_referencia, importe: base * em.at_ep_referencia / 100 },
    { concepto: 'desempleo', tipo: desE, importe: base * desE / 100 },
    { concepto: 'fogasa', tipo: em.fogasa, importe: base * em.fogasa / 100 },
    { concepto: 'fp', tipo: em.fp, importe: base * em.fp / 100 },
    { concepto: 'mei', tipo: em.mei, importe: base * em.mei / 100 },
  ];
  const sol = solidaridad(baseReal, L);
  if (sol.total > 0) {
    lt.push({ concepto: 'solidaridad', tipo: 0, importe: sol.trabajador });
    le.push({ concepto: 'solidaridad', tipo: 0, importe: sol.empresa });
  }
  const sum = (l: Linea[]) => l.reduce((a, b) => a + b.importe, 0);
  const tipo = (l: Linea[]) => l.reduce((a, b) => a + b.tipo, 0);
  const mt = sum(lt), me = sum(le);
  return {
    baseReal: r2(baseReal),
    base: r2(base),
    topada: baseReal > c.base_max_mensual,
    trabajador: { lineas: lt.map((x) => ({ ...x, importe: r2(x.importe) })), tipo: r2(tipo(lt)), mensual: r2(mt), anual: r2(mt * 12), solidaridadMensual: r2(sol.trabajador) },
    empresa: { lineas: le.map((x) => ({ ...x, importe: r2(x.importe) })), tipo: r2(tipo(le)), mensual: r2(me), anual: r2(me * 12), solidaridadMensual: r2(sol.empresa) },
  };
}
