import { Aviso, Estado, Paginacion } from '@/components/control/Piezas';
import { dinero, fechaHora, nombreProyecto, PROYECTOS_CONTROL } from '@/lib/control/comun';
import { datosStripe, esDeCartera } from '@/lib/control/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const POR_PAGINA = 50;

export default async function Pagos({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const uno = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ''; };
  const proyecto = uno('proyecto');
  const q = uno('q').trim().toLowerCase().slice(0, 120);
  const r = await datosStripe();
  if (!r.ok) return <section><h2>Pagos</h2><Aviso titulo="Stripe" error={r.error} /></section>;
  const { pagos, disputas, disputasAviso, desde } = r.datos;
  const pasa = (p: { proyecto: string | null; email: string | null }) =>
    (!proyecto || (proyecto === 'cartera' ? esDeCartera(p.proyecto) : proyecto === 'otros' ? !esDeCartera(p.proyecto) : p.proyecto === proyecto)) && (!q || (p.email ?? '').includes(q));
  const cobros = pagos.filter(pasa);
  const reembolsos = pagos.filter(pasa).flatMap((p) => p.reembolsos.map((x) => ({ ...x, pago: p })) ).sort((a, b) => +b.creado - +a.creado);
  const disp = disputas.filter(pasa);
  const pagina = Math.min(Math.max(1, parseInt(uno('pagina'), 10) || 1), Math.max(1, Math.ceil(cobros.length / POR_PAGINA)));

  return (
    <>
      <form className="ctl-filtros" method="get" action="/control/pagos/">
        <label>Email<input type="search" name="q" defaultValue={q} placeholder="buscar por email" autoComplete="off" /></label>
        <label>Proyecto
          <select name="proyecto" defaultValue={proyecto}>
            <option value="">Todos</option>
            <option value="cartera">Solo la cartera</option>
            {PROYECTOS_CONTROL.map((p) => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
            <option value="otros">Fuera de la cartera</option>
          </select>
        </label>
        <button className="boton" type="submit">Filtrar</button>
      </form>

      <section>
        <h2>Cobros</h2>
        <p className="nota">{cobros.length} intentos de cobro desde el {desde.toLocaleDateString('es-ES')}. Cada fila abre el pago en el dashboard de Stripe.</p>
        {cobros.length === 0 ? <p className="vacio">No hay cobros.</p> : (
          <div className="ctl-scroll">
            <table className="tabla ctl-tabla">
              <thead><tr><th>Fecha</th><th>Proyecto</th><th className="d">Importe</th><th>Email</th><th>Estado</th><th>Stripe</th></tr></thead>
              <tbody>
                {cobros.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((p) => (
                  <tr key={p.id}>
                    <td>{fechaHora(p.creado)}</td>
                    <td>{nombreProyecto(p.proyecto)}{p.descripcion && !esDeCartera(p.proyecto) ? <small> · {p.descripcion}</small> : null}</td>
                    <td className="d">{dinero(p.importe, p.moneda)}{p.reembolsado ? <small><br />−{dinero(p.reembolsado, p.moneda)}</small> : null}</td>
                    <td className="ctl-email">{p.email ?? <small>—</small>}</td>
                    <td><Estado estado={p.estado} /></td>
                    <td><a href={p.url} target="_blank" rel="noopener noreferrer">abrir</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion pagina={pagina} total={cobros.length} porPagina={POR_PAGINA} base="/control/pagos/" params={{ proyecto, q }} />
      </section>

      <section>
        <h2>Reembolsos</h2>
        {reembolsos.length === 0 ? <p className="vacio">No hay reembolsos.</p> : (
          <div className="ctl-scroll">
            <table className="tabla ctl-tabla">
              <thead><tr><th>Fecha</th><th>Proyecto</th><th className="d">Importe</th><th>Email</th><th>Estado</th><th>Stripe</th></tr></thead>
              <tbody>
                {reembolsos.map((x) => (
                  <tr key={x.id}>
                    <td>{fechaHora(x.creado)}</td><td>{nombreProyecto(x.pago.proyecto)}</td><td className="d">−{dinero(x.importe, x.pago.moneda)}</td>
                    <td className="ctl-email">{x.pago.email ?? <small>—</small>}</td><td><Estado estado={x.estado} /></td>
                    <td><a href={x.pago.url} target="_blank" rel="noopener noreferrer">abrir</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2>Disputas</h2>
        {disputasAviso && <p className="ctl-aviso">{disputasAviso}</p>}
        {disp.length === 0 ? <p className="vacio">No hay disputas.</p> : (
          <div className="ctl-scroll">
            <table className="tabla ctl-tabla">
              <thead><tr><th>Fecha</th><th>Proyecto</th><th className="d">Importe</th><th>Email</th><th>Estado</th><th>Motivo</th><th>Stripe</th></tr></thead>
              <tbody>
                {disp.map((d) => (
                  <tr key={d.id || d.cargo}>
                    <td>{fechaHora(d.creado)}</td><td>{nombreProyecto(d.proyecto)}</td><td className="d">{dinero(d.importe, d.moneda)}</td>
                    <td className="ctl-email">{d.email ?? <small>—</small>}</td><td><Estado estado={d.estado} /></td><td><small>{d.motivo}</small></td>
                    <td><a href={d.url} target="_blank" rel="noopener noreferrer">abrir</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="nota">La clave de Stripe es restringida y no puede leer la lista de disputas: salen de los eventos de los últimos 30 días y de los cobros marcados como disputados.</p>
      </section>
    </>
  );
}
