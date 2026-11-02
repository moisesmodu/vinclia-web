import { ArrowSquareOut, DownloadSimple } from '@phosphor-icons/react/dist/ssr';
import { Aviso, Caja, euros, fechaCorta, numero } from '@/components/mando/Piezas';
import { Estado as EstadoStripe } from '@/components/control/Piezas';
import { nombreProyecto } from '@/lib/control/comun';
import { datosStripe, esDeCartera, ESTADOS_SUSCRIPCION_MRR, type SuscripcionStripe } from '@/lib/control/stripe';
import { WEBS_PAGO } from '@/lib/mando/entidades';
import { uno, type Busqueda } from '@/lib/mando/filtros';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Suscripciones' };

const VISTAS = [
  { clave: 'activas', texto: 'Activas' },
  { clave: 'renuevan', texto: 'Renuevan en 30 d' },
  { clave: 'prueba', texto: 'En prueba' },
  { clave: 'atrasadas', texto: 'Pago atrasado' },
  { clave: 'canceladas', texto: 'Canceladas' },
] as const;

export default async function Suscripciones({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const sp = await searchParams;
  const todas = uno(sp, 'todas') === '1';
  const vista = VISTAS.find((v) => v.clave === uno(sp, 'v'))?.clave ?? 'activas';
  const r = await datosStripe();
  if (!r.ok) return <><header className="cab"><h1>Suscripciones</h1></header><Aviso titulo="Stripe no respondió">{r.error}</Aviso></>;
  const subs = r.datos.suscripciones.filter((s) => todas || esDeCartera(s.proyecto));
  const en30 = Date.now() + 30 * 864e5;
  const grupos: Record<string, SuscripcionStripe[]> = {
    activas: subs.filter((s) => s.estado === 'active'),
    renuevan: subs.filter((s) => (s.estado === 'active' || s.estado === 'trialing') && !s.cancelaAlFinal && s.finPeriodo && +s.finPeriodo <= en30).sort((a, b) => +a.finPeriodo! - +b.finPeriodo!),
    prueba: subs.filter((s) => s.estado === 'trialing'),
    atrasadas: subs.filter((s) => s.estado === 'past_due' || s.estado === 'unpaid'),
    canceladas: subs.filter((s) => s.estado === 'canceled').sort((a, b) => +(b.canceladaEl ?? 0) - +(a.canceladaEl ?? 0)).slice(0, 100),
  };
  const mrrDe = (f: (s: SuscripcionStripe) => boolean) => subs.filter((s) => ESTADOS_SUSCRIPCION_MRR.has(s.estado) && s.moneda === 'eur' && f(s)).reduce((t, s) => t + s.mensual, 0);
  const mrr = mrrDe(() => true);
  const porWeb = WEBS_PAGO.map((w) => ({ w, v: mrrDe((s) => s.proyecto === w.stripe) }));
  const maxWeb = Math.max(1, ...porWeb.map((x) => x.v));
  const fuera = r.datos.suscripciones.filter((s) => !esDeCartera(s.proyecto)).length;
  const lista = grupos[vista];
  const fecha = (s: SuscripcionStripe) => vista === 'prueba' ? ['fin de la prueba', s.finPrueba] as const : vista === 'canceladas' ? ['cancelada', s.canceladaEl] as const : ['renueva', s.finPeriodo] as const;
  const enlace = (v: string) => `/suscripciones/?${new URLSearchParams({ v, ...(todas ? { todas: '1' } : {}) })}`;

  return (
    <>
      <header className="cab entra">
        <div><h1>Suscripciones</h1><p>{todas ? `Incluye las ${fuera} suscripciones de la cuenta que no son de la cartera.` : 'Solo las de la cartera.'} {fuera > 0 && <a href={todas ? '/suscripciones/' : '/suscripciones/?todas=1'}>{todas ? 'Ver solo la cartera' : `Ver también las ${fuera} de fuera`}</a>}</p></div>
        <a className="boton" href={`/suscripciones/csv/${todas ? '?todas=1' : ''}`}><DownloadSimple aria-hidden="true" />CSV</a>
      </header>

      <section className="rejilla r-2 r-md-4 entra entra-2">
        <Caja apretado><div className="kpi"><span className="kpi-tit">MRR</span><span className="kpi-valor">{euros(mrr)}</span><span className="kpi-pie">activas y con pago atrasado</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Activas</span><span className="kpi-valor">{numero(grupos.activas.length)}</span><span className="kpi-pie">{numero(grupos.renuevan.length)} renuevan en 30 días</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">En prueba</span><span className="kpi-valor">{numero(grupos.prueba.length)}</span><span className="kpi-pie">pueden convertir</span></div></Caja>
        <Caja apretado><div className="kpi"><span className="kpi-tit">Pago atrasado</span><span className="kpi-valor">{numero(grupos.atrasadas.length)}</span><span className="kpi-pie">{numero(subs.filter((s) => s.estado === 'canceled').length)} canceladas en total</span></div></Caja>
      </section>

      <Caja className="seccion">
        <div className="caja-cab"><h2>MRR por proyecto</h2></div>
        <ul className="lista" aria-label="MRR por proyecto">
          {porWeb.map(({ w, v }) => (
            <li key={w.slug} className="fila-l" style={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 140px) 1fr auto', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem' }}><span className="punto-serie" style={{ background: w.serie }} />{w.nombre}</span>
              <span aria-hidden="true" style={{ height: 10, display: 'block' }}><span style={{ display: 'block', height: '100%', width: `${Math.max(v > 0 ? 2 : 0, (v / maxWeb) * 100)}%`, background: w.serie, borderRadius: 4 }} /></span>
              <b className="num" style={{ fontSize: '0.88rem' }}>{euros(v)}</b>
            </li>
          ))}
        </ul>
      </Caja>

      <Caja className="seccion">
        <nav className="segmentos" aria-label="Vista" style={{ marginBottom: 12 }}>
          {VISTAS.map((v) => <a key={v.clave} href={enlace(v.clave)} aria-current={vista === v.clave ? 'true' : undefined}>{v.texto} {grupos[v.clave].length}</a>)}
        </nav>
        {lista.length === 0 ? <p className="vacio">Ninguna suscripción en esta vista.</p> : (
          <table className="tabla tabla-m">
            <thead><tr><th>Email</th><th>Proyecto</th><th>Producto</th><th>Estado</th><th className="d">Al mes</th><th>Fecha</th><th /></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.id}>
                  <td className="email ancho"><b style={{ fontWeight: 500 }}>{s.email ?? '—'}</b></td>
                  <td><small>{nombreProyecto(s.proyecto)}</small></td>
                  <td className="ocultar-m"><small>{s.producto}{s.intervalo ? ` · cada ${s.intervalo}` : ''}</small></td>
                  <td className="d" style={{ textAlign: 'left' }}><EstadoStripe estado={s.estado} />{s.cancelaAlFinal && s.estado !== 'canceled' ? <small> · cancela al final</small> : null}</td>
                  <td className="d"><b>{euros(s.mensual)}</b></td>
                  <td><small>{fecha(s)[0]} {fechaCorta(fecha(s)[1])}</small></td>
                  <td className="d"><a className="enlace-p" href={s.url} target="_blank" rel="noopener noreferrer">Stripe<ArrowSquareOut aria-hidden="true" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Caja>
    </>
  );
}
