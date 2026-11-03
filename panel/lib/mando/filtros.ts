import 'server-only';
import { esDeCartera, type PagoStripe } from '@/lib/control/stripe';
import { inicioDiaMadrid } from '@/lib/control/comun';

export type Busqueda = Record<string, string | string[] | undefined>;
export const uno = (sp: Busqueda, k: string) => { const v = sp[k]; return ((Array.isArray(v) ? v[0] : v) ?? '').slice(0, 120); };

export type FiltroVentas = { proyecto: string; dias: number; q: string; estado: string; pagina: number };
export const ESTADOS_PAGO = ['pagado', 'reembolsado', 'reembolso parcial', 'en disputa', 'pendiente', 'fallido', 'cancelado', 'requiere acción'];

export function leerVentas(sp: Busqueda): FiltroVentas {
  const dias = Number(uno(sp, 'dias'));
  return {
    proyecto: uno(sp, 'proyecto'), dias: [7, 30, 90, 365].includes(dias) ? dias : 30, q: uno(sp, 'q').trim().toLowerCase(),
    estado: ESTADOS_PAGO.includes(uno(sp, 'estado')) ? uno(sp, 'estado') : '', pagina: Math.max(1, parseInt(uno(sp, 'pagina'), 10) || 1),
  };
}

export const pasaProyecto = (proyecto: string, p: { proyecto: string | null }) =>
  !proyecto || (proyecto === 'cartera' ? esDeCartera(p.proyecto) : proyecto === 'otros' ? !esDeCartera(p.proyecto) : p.proyecto === proyecto);

export function filtrarVentas(pagos: PagoStripe[], f: FiltroVentas) {
  const desde = inicioDiaMadrid(f.dias - 1);
  return pagos.filter((p) => p.creado >= desde && pasaProyecto(f.proyecto, p) && (!f.q || (p.email ?? '').includes(f.q)) && (!f.estado || p.estado === f.estado));
}

/** Evita que una hoja de cálculo interprete celdas como fórmulas. */
export const celdaCsv = (v: string) => { const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const csv = (filas: string[][], nombre: string) => new Response('﻿' + filas.map((r) => r.map(celdaCsv).join(',')).join('\r\n') + '\r\n', {
  headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${nombre}-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'private, no-store' },
});
