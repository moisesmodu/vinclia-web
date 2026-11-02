import { ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr';

export default function Paginacion({ pagina, total, porPagina, base, params }: { pagina: number; total: number; porPagina: number; base: string; params: Record<string, string | number> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  const href = (n: number) => `${base}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)])), pagina: String(n) })}`;
  return (
    <nav className="paginacion" aria-label="Paginación">
      {pagina > 1 ? <a className="enlace-p" href={href(pagina - 1)}><ArrowLeft aria-hidden="true" />Anterior</a> : <span />}
      <span>Página {pagina} de {paginas}</span>
      {pagina < paginas ? <a className="enlace-p" href={href(pagina + 1)}>Siguiente<ArrowRight aria-hidden="true" /></a> : <span />}
    </nav>
  );
}
