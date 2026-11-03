import { DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import Barras from '@/components/mando/Barras';
import Paginacion from '@/components/mando/Paginacion';
import { Aviso, Caja, fechaCorta, numero, pct } from '@/components/mando/Piezas';
import { Estado as EstadoUsuario } from '@/components/control/Piezas';
import { inicioDiaMadrid, PROYECTOS_CONTROL } from '@/lib/control/comun';
import { filtrar, leerFiltros, usuariosUnificados } from '@/lib/control/unificado';
import { ESTADOS } from '@/lib/control/usuarios';
import { WEBS_PAGO } from '@/lib/mando/entidades';
import type { Busqueda } from '@/lib/mando/filtros';
import { altasPorDia, ultimosDias } from '@/lib/mando/metricas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Usuarios' };

const POR_PAGINA = 50;

export default async function Usuarios({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const f = leerFiltros(await searchParams);
  const { usuarios, avisos, stripe, porProyecto } = await usuariosUnificados();
  const pendientes = porProyecto.filter((p) => p.pendiente);
  const lista = filtrar(usuarios, f);
  const base = filtrar(usuarios, { ...f, estado: '' });
  const pagina = Math.min(f.pagina, Math.max(1, Math.ceil(lista.length / POR_PAGINA)));
  const params = { q: f.q, proyecto: f.proyecto, estado: f.estado };
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
  const nombre = (c: string) => PROYECTOS_CONTROL.find((p) => p.clave === c)?.nombre ?? c;
  const dias = ultimosDias(30);
  const webs = f.proyecto ? WEBS_PAGO.filter((w) => w.control === f.proyecto) : WEBS_PAGO;
  const pagan = base.filter((u) => u.haPagado).length;
  const de = (e: string) => base.filter((u) => u.estado === e).length;
  const enlaceEstado = (e: string) => `/usuarios/?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params, estado: e }).filter(([, v]) => v)))}`;

  return (
    <>
      <header className="cab entra">
        <div><h1>Usuarios</h1><p>Los proyectos con cuentas, unificados. Lunilla cuenta cada email con pedido; en Numi Mates y Numitech se muestra el código del alumno (no hay email).</p></div>
        <a className="boton" href={`/usuarios/csv/?${qs}`}><DownloadSimple aria-hidden="true" />CSV</a>
      </header>
      {avisos.map((a) => <Aviso key={a.clave} titulo={`Base de datos de ${a.nombre} sin datos`}>{a.error}</Aviso>)}
      {!stripe.ok && <Aviso titulo="Stripe (último pago) no respondió">{stripe.error}</Aviso>}
      {pendientes.length > 0 && <p className="t3" style={{ fontSize: '0.78rem', marginBottom: 8 }}>Sin base conectada todavía: {pendientes.map((p) => p.nombre).join(', ')}. Sus ventas y suscripciones sí salen (Stripe).</p>}

      <section className="rejilla r-2 r-md-4 entra entra-2" aria-label="Resumen">
        <Caja apretado><div className="kpi"><span className="kpi-tit">Usuarios</span><span className="kpi-valor">{numero(base.length)}</span><span className="kpi-pie">{f.proyecto ? nombre(f.proyecto) : 'todos los proyectos'}</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Altas 30 días</span><span className="kpi-valor">{numero(base.filter((u) => u.alta >= inicioDiaMadrid(29)).length)}</span><span className="kpi-pie">{numero(base.filter((u) => u.alta >= inicioDiaMadrid(6)).length)} en 7 días</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Han pagado</span><span className="kpi-valor">{numero(pagan)}</span><span className="kpi-pie">alguna vez</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Conversión</span><span className="kpi-valor">{pct(pagan, base.length)}</span><span className="kpi-pie">a pago</span></div></Caja>
      </section>

      <Caja className="seccion">
        <div className="caja-cab"><h2>Altas por día · 30 días</h2></div>
        <Barras titulo="Altas por día y proyecto" dias={dias} series={altasPorDia(f.q ? lista : usuarios, dias, webs)} formato="numero" vacio="Sin altas en 30 días" />
      </Caja>

      <Caja className="seccion">
        <form className="filtros" method="get" action="/usuarios/">
          <label>Email<input type="search" name="q" defaultValue={f.q} placeholder="buscar por email" autoComplete="off" /></label>
          <label>Proyecto
            <select name="proyecto" defaultValue={f.proyecto}><option value="">Todos</option>{PROYECTOS_CONTROL.map((p) => <option key={p.clave} value={p.clave}>{p.nombre}</option>)}</select>
          </label>
          <input type="hidden" name="estado" value={f.estado} />
          <button className="boton" type="submit">Buscar</button>
        </form>
        <nav className="segmentos" aria-label="Estado" style={{ marginBottom: 12 }}>
          <a href={enlaceEstado('')} aria-current={!f.estado ? 'true' : undefined}>Todos {numero(base.length)}</a>
          {ESTADOS.map((e) => <a key={e} href={enlaceEstado(e)} aria-current={f.estado === e ? 'true' : undefined} style={{ textTransform: 'capitalize' }}>{e} {numero(de(e))}</a>)}
        </nav>
        {lista.length === 0 ? <p className="vacio">Ningún usuario con estos filtros.</p> : (
          <table className="tabla tabla-m">
            <thead><tr><th>Email</th><th>Proyecto</th><th>Estado</th><th>Plan</th><th>Alta</th><th>Último pago</th></tr></thead>
            <tbody>
              {lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((u) => (
                <tr key={u.proyecto + u.email}>
                  <td className="email ancho"><b style={{ fontWeight: 500 }}>{u.email}</b></td>
                  <td><small>{nombre(u.proyecto)}</small></td>
                  <td className="d" style={{ textAlign: 'left' }}><EstadoUsuario estado={u.estado} /></td>
                  <td className="ocultar-m"><small>{u.plan}</small></td>
                  <td><small>alta {fechaCorta(u.alta)}</small></td>
                  <td className="d" style={{ textAlign: 'left' }}><small>{u.ultimoPago ? `pagó ${fechaCorta(u.ultimoPago)}` : ''}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paginacion pagina={pagina} total={lista.length} porPagina={POR_PAGINA} base="/usuarios/" params={params} />
      </Caja>
    </>
  );
}
