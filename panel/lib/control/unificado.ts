import { cache } from 'react';
import { datosStripe, type PagoStripe } from './stripe';
import { usuariosPorProyecto, type EstadoUsuario, type UsuarioControl } from './usuarios';
import type { ClaveProyecto } from './comun';

export type Filtros = { q: string; proyecto: ClaveProyecto | ''; estado: EstadoUsuario | '' };

const COBRADO = new Set<PagoStripe['estado']>(['pagado', 'reembolso parcial', 'en disputa']);

/** Usuarios de los cinco proyectos, con el último pago completado con lo que diga Stripe. */
export const usuariosUnificados = cache(async () => {
  const [porProyecto, stripe] = await Promise.all([usuariosPorProyecto(), datosStripe()]);
  const ultimo = new Map<string, Date>();
  if (stripe.ok) for (const p of stripe.datos.pagos) {
    if (!p.proyecto || !p.email || !COBRADO.has(p.estado)) continue;
    const k = `${p.proyecto}|${p.email}`; const v = ultimo.get(k);
    if (!v || p.creado > v) ultimo.set(k, p.creado);
  }
  const usuarios: UsuarioControl[] = [];
  for (const p of porProyecto) if (p.resultado.ok) for (const u of p.resultado.datos) {
    const s = ultimo.get(`${u.slug}|${u.email}`);
    const ultimoPago = s && (!u.ultimoPago || s > u.ultimoPago) ? s : u.ultimoPago;
    usuarios.push({ ...u, ultimoPago, haPagado: u.haPagado || !!ultimoPago });
  }
  usuarios.sort((a, b) => +b.alta - +a.alta);
  const avisos = porProyecto.filter((p) => !p.resultado.ok).map((p) => ({ clave: p.clave, nombre: p.nombre, error: (p.resultado as { error: string }).error }));
  return { usuarios, avisos, porProyecto, stripe };
});

export function filtrar(usuarios: UsuarioControl[], f: Filtros) {
  const q = f.q.trim().toLowerCase();
  return usuarios.filter((u) => (!f.proyecto || u.proyecto === f.proyecto) && (!f.estado || u.estado === f.estado) && (!q || u.email.includes(q)));
}

export function leerFiltros(sp: Record<string, string | string[] | undefined>): Filtros & { pagina: number } {
  const uno = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ''; };
  const proyecto = uno('proyecto').toUpperCase();
  const estado = uno('estado');
  return {
    q: uno('q').slice(0, 120),
    proyecto: (['A', 'N', 'B', 'G', 'M'].includes(proyecto) ? proyecto : '') as Filtros['proyecto'],
    estado: (['gratis', 'prueba', 'pago', 'cancelado'].includes(estado) ? estado : '') as Filtros['estado'],
    pagina: Math.max(1, parseInt(uno('pagina'), 10) || 1),
  };
}
