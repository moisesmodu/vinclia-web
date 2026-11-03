import Link from 'next/link';
import { ArrowRight, ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import Barras from '@/components/mando/Barras';
import { Aviso, Caja, euros, fechaHora, TarjetaKpi } from '@/components/mando/Piezas';
import SaludTarjeta, { ResumenSalud } from '@/components/mando/SaludTarjeta';
import TareaFila from '@/components/mando/TareaFila';
import { ultimasAcciones } from '@/lib/mando/db';
import { tablero } from '@/lib/mando/metricas';
import { salud } from '@/lib/mando/salud';
import { tareasConEstado } from '@/lib/mando/tareas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hoy' };

function saludo() {
  const h = Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

export default async function Hoy() {
  const [t, estado, tareas, acciones] = await Promise.all([tablero(), salud(), tareasConEstado(), ultimasAcciones(6)]);
  const k = Object.fromEntries(t.kpis.map((x) => [x.clave, x]));
  const pendientes = tareas.lista.filter((x) => !x.hecho);
  const siguientes = pendientes.slice(0, 3);
  const minutos = pendientes.reduce((a, x) => a + (x.minutos ?? 0), 0);
  const f0 = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const fecha = f0.charAt(0).toUpperCase() + f0.slice(1);
  const ingresosTotales = t.dias30.map((_, i) => t.ingresos30.reduce((s, x) => s + x.valores[i], 0));
  const visitasTotales = t.dias30.map((_, i) => t.visitas30.reduce((s, x) => s + x.valores[i], 0));
  const altasTotales = t.dias30.map((_, i) => t.altas30.reduce((s, x) => s + x.valores[i], 0));

  return (
    <>
      <header className="cab entra">
        <div>
          <h1>{saludo()}, Moisés</h1>
          <p>{fecha}. {pendientes.length ? `Tienes ${pendientes.length} tareas pendientes${minutos ? `, unos ${minutos} min` : ''}.` : 'No tienes nada pendiente.'}</p>
        </div>
        <div className="acciones-cab"><a className="boton peque" href="/"><ArrowsClockwise aria-hidden="true" />Actualizar</a></div>
      </header>

      {!t.stripe.ok && <Aviso titulo="Stripe no respondió">{t.stripe.error}</Aviso>}
      {t.avisos.map((a) => <Aviso key={a.clave} titulo={`Base de datos de ${a.nombre} sin datos`}>{a.error}</Aviso>)}

      <section className="bento entra entra-2" aria-label="Cifras clave">
        <TarjetaKpi k={k.mes} heroe chispa={{ valores: ingresosTotales, color: '#3987e5' }}>
          <div className="heroe-sub">
            <span>Hoy <b className="num">{k.hoy.valor == null ? '—' : euros(k.hoy.valor)}</b> {k.hoy.detalle ? <small>({k.hoy.detalle})</small> : null}</span>
            <span>Ventas <b className="num">{k.ventas.valor ?? '—'}</b></span>
          </div>
        </TarjetaKpi>
        <TarjetaKpi k={k.mrr} />
        <TarjetaKpi k={k.ventas} />
        <TarjetaKpi k={k.usuarios} chispa={{ valores: altasTotales, color: '#199e70' }} />
        <TarjetaKpi k={k.visitas} chispa={{ valores: visitasTotales, color: '#9085e9' }} />
      </section>

      <div className="dividido seccion">
        <div style={{ display: 'grid', gap: 12 }}>
          <Caja className="entra entra-3">
            <div className="caja-cab"><h2>Ingresos netos · 30 días</h2><Link className="enlace-p" href="/ventas/">Ventas<ArrowRight aria-hidden="true" /></Link></div>
            <Barras titulo="Ingresos netos por día y proyecto, últimos 30 días" dias={t.dias30} series={t.ingresos30} formato="euros" vacio="Todavía no hay ingresos en 30 días" />
          </Caja>
          <Caja className="entra entra-3">
            <div className="caja-cab"><h2>Visitantes · 30 días</h2><small>Vercel Web Analytics</small></div>
            <Barras titulo="Visitantes por día y web, últimos 30 días" dias={t.dias30} series={t.visitas30} formato="numero" vacio="Sin visitas registradas" />
          </Caja>
        </div>
        <div className="lado-primero" style={{ display: 'grid', gap: 12 }}>
          <Caja className="entra entra-4">
            <div className="caja-cab"><h2>Tu siguiente paso</h2><Link className="enlace-p" href="/tareas/">Todas<ArrowRight aria-hidden="true" /></Link></div>
            {tareas.aviso && <Aviso titulo="No se pudo leer el estado de las tareas">{tareas.aviso}</Aviso>}
            {siguientes.length === 0 ? <p className="vacio">Todo hecho. Las sesiones se encargan del resto.</p> : (
              <ol className="lista" style={{ listStyle: 'none' }}>{siguientes.map((x) => <TareaFila key={x.id} t={x} compacta />)}</ol>
            )}
          </Caja>
          <Caja className="entra entra-4">
            <div className="caja-cab"><h2>Últimas acciones</h2><small>registro del panel</small></div>
            {acciones.datos.length === 0 ? <p className="vacio">Todavía no hay acciones registradas.</p> : (
              <ul className="lista">
                {acciones.datos.map((a, i) => (
                  <li key={i} className="fila-l"><span className="crece"><b style={{ fontSize: '0.86rem' }}>{a.accion}</b><small>{a.detalle?.titulo ?? a.detalle?.para ?? a.detalle?.id ?? ''}</small></span><small>{fechaHora(a.en)}</small></li>
                ))}
              </ul>
            )}
          </Caja>
        </div>
      </div>

      <section className="seccion">
        <div className="caja-cab"><h2>Salud de las webs</h2><ResumenSalud lista={estado} /></div>
        <div className="rejilla r-md-2 r-lg-4">{estado.map((s) => <SaludTarjeta key={s.web.slug} s={s} />)}</div>
        <p className="t3" style={{ fontSize: '0.76rem', marginTop: 10 }}>Estado HTTP comprobado ahora desde el servidor; despliegue de producción y respuestas 5xx de las últimas 24 h según Vercel. Toca una web para ver su ficha.</p>
      </section>
    </>
  );
}
