import { DownloadSimple, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import Barras from '@/components/mando/Barras';
import Paginacion from '@/components/mando/Paginacion';
import { Aviso, Caja, euros, fechaHora, numero } from '@/components/mando/Piezas';
import { Estado as EstadoStripe } from '@/components/control/Piezas';
import { nombreProyecto } from '@/lib/control/comun';
import { datosStripe, esDeCartera, netoEntre } from '@/lib/control/stripe';
import { inicioDiaMadrid } from '@/lib/control/comun';
import { WEBS, WEBS_PAGO } from '@/lib/mando/entidades';
import { ESTADOS_PAGO, filtrarVentas, leerVentas, pasaProyecto, type Busqueda } from '@/lib/mando/filtros';
import { ingresosPorDia, ultimosDias } from '@/lib/mando/metricas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ventas' };

const POR_PAGINA = 40;

export default async function Ventas({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const f = leerVentas(await searchParams);
  const r = await datosStripe();
  const params = { proyecto: f.proyecto, dias: f.dias, q: f.q, estado: f.estado };
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '').map(([k, v]) => [k, String(v)])));
  const enlaceDias = (d: number) => `/ventas/?${new URLSearchParams({ ...Object.fromEntries(qs), dias: String(d) })}`;

  if (!r.ok) return <><header className="cab"><h1>Ventas</h1></header><Aviso titulo="Stripe no respondió">{r.error}</Aviso></>;
  const { pagos, disputas, disputasAviso, desde: desdeStripe } = r.datos;
  const lista = filtrarVentas(pagos, f);
  const desde = inicioDiaMadrid(f.dias - 1);
  const filtro = (p: { proyecto: string | null; email: string | null }) => pasaProyecto(f.proyecto || 'cartera', p) && (!f.q || (p.email ?? '').includes(f.q));
  const n = netoEntre(pagos, desde, new Date(), filtro);
  const dias = ultimosDias(Math.min(f.dias, 90));
  const websGrafico = f.proyecto && f.proyecto !== 'cartera' && f.proyecto !== 'otros' ? WEBS_PAGO.filter((w) => w.stripe === f.proyecto) : WEBS_PAGO;
  const series = ingresosPorDia(pagos.filter((p) => !f.q || (p.email ?? '').includes(f.q)), dias, websGrafico);
  const pagina = Math.min(f.pagina, Math.max(1, Math.ceil(lista.length / POR_PAGINA)));
  const reembolsos = pagos.filter((p) => filtro(p)).flatMap((p) => p.reembolsos.filter((x) => x.creado >= desde).map((x) => ({ ...x, pago: p }))).sort((a, b) => +b.creado - +a.creado);
  const disp = disputas.filter((d) => pasaProyecto(f.proyecto, d));
  const fuera = netoEntre(pagos, desde, new Date(), (p) => !esDeCartera(p.proyecto));

  return (
    <>
      <header className="cab entra">
        <div><h1>Ventas</h1><p>Cobros, reembolsos y disputas de Stripe. Neto = cobrado menos reembolsado en el periodo.</p></div>
        <div className="acciones-cab">
          <nav className="segmentos" aria-label="Periodo">{[7, 30, 90, 365].map((d) => <a key={d} href={enlaceDias(d)} aria-current={f.dias === d ? 'true' : undefined}>{d === 365 ? '1 año' : `${d} días`}</a>)}</nav>
        </div>
      </header>

      <form className="filtros" method="get" action="/ventas/">
        <input type="hidden" name="dias" value={f.dias} />
        <label>Proyecto
          <select name="proyecto" defaultValue={f.proyecto}>
            <option value="">Todos</option><option value="cartera">Solo la cartera</option>
            {WEBS.filter((w) => w.stripe).map((w) => <option key={w.slug} value={w.stripe!}>{w.nombre}</option>)}
            <option value="otros">Fuera de la cartera</option>
          </select>
        </label>
        <label>Estado
          <select name="estado" defaultValue={f.estado}><option value="">Todos</option>{ESTADOS_PAGO.map((e) => <option key={e} value={e}>{e}</option>)}</select>
        </label>
        <label>Email<input type="search" name="q" defaultValue={f.q} placeholder="buscar por email" autoComplete="off" /></label>
        <button className="boton" type="submit">Filtrar</button>
        <a className="boton" href={`/ventas/csv/?${qs}`}><DownloadSimple aria-hidden="true" />CSV</a>
      </form>

      <section className="rejilla r-2 r-md-4 entra entra-2" aria-label="Totales del periodo">
        <Caja apretado><div className="kpi"><span className="kpi-tit">Neto</span><span className="kpi-valor">{euros(n.neto)}</span><span className="kpi-pie">{f.proyecto ? 'con el filtro' : 'de la cartera'}</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Cobrado</span><span className="kpi-valor">{euros(n.cobrado)}</span><span className="kpi-pie">{numero(n.cobros)} ventas</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Reembolsado</span><span className="kpi-valor">{euros(n.reembolsado)}</span><span className="kpi-pie">{reembolsos.length} reembolsos</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Ticket medio</span><span className="kpi-valor">{n.cobros ? euros(Math.round(n.cobrado / n.cobros)) : '—'}</span><span className="kpi-pie">por venta</span></div></Caja>
      </section>
      {!f.proyecto && fuera.cobrado > 0 && <p className="t3" style={{ fontSize: '0.78rem', marginTop: 8 }}>Fuera de la cartera (misma cuenta de Stripe, sin metadata.proyecto): {euros(fuera.neto)} en el periodo. No se suman arriba.</p>}

      <Caja className="seccion">
        <div className="caja-cab"><h2>Ingresos netos por día</h2><small>{f.dias > 90 ? 'últimos 90 días' : `últimos ${f.dias} días`}</small></div>
        <Barras titulo="Ingresos netos por día" dias={dias} series={series} formato="euros" vacio="Sin ingresos en este periodo" />
      </Caja>

      <Caja className="seccion">
        <div className="caja-cab"><h2>Cobros</h2><small>{numero(lista.length)} en el periodo · Stripe guarda aquí desde el {desdeStripe.toLocaleDateString('es-ES')}</small></div>
        {lista.length === 0 ? <p className="vacio">No hay cobros con estos filtros.</p> : (
          <table className="tabla tabla-m">
            <thead><tr><th>Fecha</th><th>Proyecto</th><th>Email</th><th>Estado</th><th className="d">Importe</th><th /></tr></thead>
            <tbody>
              {lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((p) => (
                <tr key={p.id}>
                  <td><small>{fechaHora(p.creado)}</small></td>
                  <td className="d" style={{ textAlign: 'left' }}>{nombreProyecto(p.proyecto)}</td>
                  <td className="email ancho"><small>{p.email ?? '—'}</small></td>
                  <td><EstadoStripe estado={p.estado} /></td>
                  <td className="d"><b>{euros(p.importe)}</b>{p.reembolsado ? <small><br />−{euros(p.reembolsado)}</small> : null}</td>
                  <td className="d"><a className="enlace-p" href={p.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir en Stripe">Stripe<ArrowSquareOut aria-hidden="true" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paginacion pagina={pagina} total={lista.length} porPagina={POR_PAGINA} base="/ventas/" params={params} />
      </Caja>

      <div className="rejilla r-md-2 seccion">
        <Caja>
          <div className="caja-cab"><h2>Reembolsos</h2><small>{reembolsos.length}</small></div>
          {reembolsos.length === 0 ? <p className="vacio">Ningún reembolso en el periodo.</p> : (
            <ul className="lista">{reembolsos.slice(0, 20).map((x) => <li key={x.id} className="fila-l"><span className="crece"><b className="num">−{euros(x.importe)}</b><small>{nombreProyecto(x.pago.proyecto)} · {x.pago.email ?? 'sin email'}</small></span><a className="enlace-p" href={x.pago.url} target="_blank" rel="noopener noreferrer">{fechaHora(x.creado)}</a></li>)}</ul>
          )}
        </Caja>
        <Caja>
          <div className="caja-cab"><h2>Disputas</h2><small>{disp.length}</small></div>
          {disputasAviso && <Aviso titulo={disputasAviso} />}
          {disp.length === 0 ? <p className="vacio">Ninguna disputa.</p> : (
            <ul className="lista">{disp.map((d) => <li key={d.id || d.cargo} className="fila-l"><span className="crece"><b className="num">{euros(d.importe)}</b><small>{nombreProyecto(d.proyecto)} · {d.motivo} · <EstadoStripe estado={d.estado} /></small></span><a className="enlace-p" href={d.url} target="_blank" rel="noopener noreferrer">{fechaHora(d.creado)}</a></li>)}</ul>
          )}
        </Caja>
      </div>
    </>
  );
}
