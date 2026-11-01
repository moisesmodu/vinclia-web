import { Aviso, Estado, Paginacion, Proyecto } from '@/components/control/Piezas';
import { fechaCorta, fechaHora, PROYECTOS_CONTROL } from '@/lib/control/comun';
import { ESTADOS } from '@/lib/control/usuarios';
import { filtrar, leerFiltros, usuariosUnificados } from '@/lib/control/unificado';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const POR_PAGINA = 50;

export default async function Usuarios({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = leerFiltros(await searchParams);
  const { usuarios, avisos, stripe } = await usuariosUnificados();
  const lista = filtrar(usuarios, f);
  const pagina = Math.min(f.pagina, Math.max(1, Math.ceil(lista.length / POR_PAGINA)));
  const trozo = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const params = { q: f.q, proyecto: f.proyecto, estado: f.estado };
  const csv = `/control/usuarios/csv/?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)))}`;
  const nombre = (c: string) => PROYECTOS_CONTROL.find((p) => p.clave === c)?.nombre ?? c;

  return (
    <section>
      <h2>Usuarios de los cinco proyectos</h2>
      {avisos.map((a) => <Aviso key={a.clave} titulo={`Base de datos de ${a.nombre}`} error={a.error} />)}
      {!stripe.ok && <Aviso titulo="Stripe (último pago)" error={stripe.error} />}
      <form className="ctl-filtros" method="get" action="/control/usuarios/">
        <label>Email<input type="search" name="q" defaultValue={f.q} placeholder="buscar por email" autoComplete="off" /></label>
        <label>Proyecto
          <select name="proyecto" defaultValue={f.proyecto}>
            <option value="">Todos</option>
            {PROYECTOS_CONTROL.map((p) => <option key={p.clave} value={p.clave}>{p.nombre}</option>)}
          </select>
        </label>
        <label>Estado
          <select name="estado" defaultValue={f.estado}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <button className="boton" type="submit">Filtrar</button>
        <a className="ctl-csv" href={csv}>Exportar CSV</a>
      </form>
      <p className="nota">{lista.length} usuarios{lista.length !== usuarios.length ? ` de ${usuarios.length}` : ''}.</p>
      {trozo.length === 0 ? <p className="vacio">Ningún usuario con estos filtros.</p> : (
        <div className="ctl-scroll">
          <table className="tabla ctl-tabla">
            <thead><tr><th>Proyecto</th><th>Email</th><th>Alta</th><th>Estado</th><th>Plan</th><th>Último pago</th></tr></thead>
            <tbody>
              {trozo.map((u) => (
                <tr key={u.proyecto + u.email}>
                  <td><Proyecto letra={u.proyecto} nombre={nombre(u.proyecto)} /></td>
                  <td className="ctl-email">{u.email}</td>
                  <td title={fechaHora(u.alta)}>{fechaCorta(u.alta)}</td>
                  <td><Estado estado={u.estado} /></td>
                  <td><small>{u.plan}</small></td>
                  <td>{u.ultimoPago ? fechaCorta(u.ultimoPago) : <small>—</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion pagina={pagina} total={lista.length} porPagina={POR_PAGINA} base="/control/usuarios/" params={params} />
    </section>
  );
}
