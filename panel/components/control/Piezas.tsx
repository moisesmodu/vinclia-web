import type { EstadoUsuario } from '@/lib/control/usuarios';

export function Aviso({ titulo, error }: { titulo: string; error: string }) {
  return <p className="ctl-aviso" role="status"><b>{titulo}:</b> no se pudo leer. <small>{error}</small></p>;
}

const TEXTO: Record<string, string> = {
  active: 'activa', trialing: 'en prueba', past_due: 'pago atrasado', canceled: 'cancelada', unpaid: 'impagada',
  incomplete: 'incompleta', incomplete_expired: 'caducada', paused: 'pausada', succeeded: 'hecho', pending: 'pendiente',
  failed: 'fallido', requires_action: 'requiere acción', needs_response: 'requiere respuesta', under_review: 'en revisión',
  warning_needs_response: 'aviso: responder', warning_under_review: 'aviso en revisión', warning_closed: 'aviso cerrado',
  won: 'ganada', lost: 'perdida', prevented: 'evitada',
};

export function Estado({ estado }: { estado: EstadoUsuario | string }) {
  return <span className={`ctl-estado ctl-estado-${estado.replace(/[^a-z]/gi, '-')}`}>{TEXTO[estado] ?? estado}</span>;
}

export function Proyecto({ nombre, letra }: { nombre: string; letra?: string | null }) {
  return <span className="ctl-proy">{letra ? <span className="ctl-letra">{letra}</span> : null}{nombre}</span>;
}

/** Paginación con enlaces GET (sin JavaScript en el cliente). */
export function Paginacion({ pagina, total, porPagina, base, params }: { pagina: number; total: number; porPagina: number; base: string; params: Record<string, string> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  const href = (n: number) => { const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), pagina: String(n) }); return `${base}?${q}`; };
  return (
    <nav className="ctl-pag" aria-label="Paginación">
      {pagina > 1 ? <a href={href(pagina - 1)}>← Anterior</a> : <span />}
      <span>Página {pagina} de {paginas}</span>
      {pagina < paginas ? <a href={href(pagina + 1)}>Siguiente →</a> : <span />}
    </nav>
  );
}
