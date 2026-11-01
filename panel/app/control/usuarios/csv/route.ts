import { PROYECTOS_CONTROL } from '@/lib/control/comun';
import { filtrar, leerFiltros, usuariosUnificados } from '@/lib/control/unificado';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Evita que Excel interprete celdas como fórmulas.
const celda = (v: string) => { const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const f = leerFiltros(Object.fromEntries(url.searchParams));
  const { usuarios, avisos } = await usuariosUnificados();
  const nombre = (c: string) => PROYECTOS_CONTROL.find((p) => p.clave === c)?.nombre ?? c;
  const filas = [['proyecto', 'email', 'alta', 'estado', 'plan', 'ultimo_pago']];
  for (const u of filtrar(usuarios, f)) filas.push([nombre(u.proyecto), u.email, u.alta.toISOString(), u.estado, u.plan, u.ultimoPago?.toISOString() ?? '']);
  const cuerpo = '﻿' + filas.map((r) => r.map(celda).join(',')).join('\r\n') + '\r\n';
  const hoy = new Date().toISOString().slice(0, 10);
  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="usuarios-${hoy}.csv"`,
      'Cache-Control': 'private, no-store',
      ...(avisos.length ? { 'X-Control-Avisos': avisos.map((a) => a.clave).join(',') } : {}),
    },
  });
}
