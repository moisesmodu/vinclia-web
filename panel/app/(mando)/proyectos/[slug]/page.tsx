import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import Barras from '@/components/mando/Barras';
import { Aviso, Caja, Estado, euros, fechaCorta, fechaHora, haceCuanto, IconoMarca, numero } from '@/components/mando/Piezas';
import { contenido } from '@/lib/mando/contenido';
import { enlaces, webPorSlug } from '@/lib/mando/entidades';
import { metricasWeb, tablero } from '@/lib/mando/metricas';
import { salud } from '@/lib/mando/salud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NIVEL = { bien: 'Bien', atencion: 'Atención', mal: 'Caída' } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const w = webPorSlug((await params).slug);
  return { title: w?.nombre ?? 'Proyecto' };
}

export default async function Ficha({ params }: { params: Promise<{ slug: string }> }) {
  const w = webPorSlug((await params).slug);
  if (!w) notFound();
  const [t, estado] = await Promise.all([tablero(), salud()]);
  const m = metricasWeb(t, w);
  const s = estado.find((x) => x.web.slug === w.slug)!;
  const repo = contenido.proyectos.find((p) => p.clave === w.repo);
  const marca = contenido.marcas[w.repo];
  const e = enlaces(w);
  const una = (series: typeof t.ingresos30) => series.filter((x) => x.clave === w.slug);
  const pagos = w.stripe ? t.pagos.filter((p) => p.proyecto === w.stripe && p.estado !== 'fallido').slice(0, 8) : [];
  const altas = w.control ? t.usuarios.filter((u) => u.proyecto === w.control).slice(0, 8) : [];

  return (
    <>
      <p style={{ marginBottom: 10 }}><Link className="enlace-p" href="/proyectos/"><ArrowLeft aria-hidden="true" />Proyectos</Link></p>
      <header className="cab entra">
        <div className="proy-cab" style={{ gap: 16 }}>
          <IconoMarca svg={marca?.svg} nombre={w.nombre} grande />
          <div>
            <h1>{w.nombre}</h1>
            <p style={{ marginTop: 4 }}>{w.dominio} · {w.modelo}{repo ? ` · ${repo.estado}` : ''}</p>
          </div>
        </div>
        <div className="enlaces">
          <a className="enlace-p" href={e.web} target="_blank" rel="noopener noreferrer">Web<ArrowSquareOut aria-hidden="true" /></a>
          {e.stripe && <a className="enlace-p" href={e.stripe} target="_blank" rel="noopener noreferrer">Stripe<ArrowSquareOut aria-hidden="true" /></a>}
          <a className="enlace-p" href={e.vercel} target="_blank" rel="noopener noreferrer">Vercel<ArrowSquareOut aria-hidden="true" /></a>
          <a className="enlace-p" href={e.logs} target="_blank" rel="noopener noreferrer">Errores<ArrowSquareOut aria-hidden="true" /></a>
          <a className="enlace-p" href={e.searchConsole} target="_blank" rel="noopener noreferrer">Search Console<ArrowSquareOut aria-hidden="true" /></a>
          <a className="enlace-p" href={e.analytics} target="_blank" rel="noopener noreferrer">Analytics<ArrowSquareOut aria-hidden="true" /></a>
          <a className="enlace-p" href={`/p/${w.repo}/`}>Plan y estrategia</a>
        </div>
      </header>

      <Caja className="entra entra-2">
        <div className="metricas m-4" style={{ margin: 0 }}>
          <div><span>Ingresos este mes</span><b>{m.ingresosMes == null ? 'n/a' : euros(m.ingresosMes)}</b></div>
          <div><span>MRR</span><b>{m.mrr == null ? 'n/a' : euros(m.mrr)}</b></div>
          <div><span>Usuarios · altas 30 d</span><b>{m.usuarios == null ? 'n/a' : `${numero(m.usuarios)} · ${numero(m.altas30 ?? 0)}`}</b></div>
          <div><span>Conversión a pago</span><b>{m.conversion}</b></div>
          <div><span>Visitantes 30 d</span><b>{m.visitantes30 == null ? '—' : numero(m.visitantes30)}</b></div>
          <div><span>Estado</span><b><Estado nivel={s.nivel}>{NIVEL[s.nivel]}</Estado></b></div>
          <div><span>HTTP ahora</span><b>{s.http.estado ?? '—'}{s.http.ms != null ? ` · ${s.http.ms} ms` : ''}</b></div>
          <div><span>Errores 5xx 24 h</span><b>{s.errores ?? '—'}</b></div>
        </div>
      </Caja>

      <div className="rejilla r-md-2 seccion">
        {w.stripe && (
          <Caja>
            <div className="caja-cab"><h2>Ingresos netos · 30 días</h2></div>
            <Barras titulo={`Ingresos netos de ${w.nombre}, 30 días`} dias={t.dias30} series={una(t.ingresos30)} formato="euros" alto={180} vacio="Todavía sin ingresos" />
          </Caja>
        )}
        {w.control && (
          <Caja>
            <div className="caja-cab"><h2>Altas · 30 días</h2></div>
            <Barras titulo={`Altas de ${w.nombre}, 30 días`} dias={t.dias30} series={una(t.altas30)} formato="numero" alto={180} vacio="Sin altas" />
          </Caja>
        )}
        <Caja>
          <div className="caja-cab"><h2>Visitantes · 30 días</h2></div>
          <Barras titulo={`Visitantes de ${w.nombre}, 30 días`} dias={t.dias30} series={una(t.visitas30)} formato="numero" alto={180} vacio="Sin visitas registradas" />
        </Caja>
        <Caja>
          <div className="caja-cab"><h2>Último despliegue</h2></div>
          {s.despliegue ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <span><Estado nivel={s.despliegue.estado === 'READY' ? 'bien' : s.despliegue.estado === 'ERROR' ? 'mal' : 'atencion'}>{s.despliegue.estado === 'READY' ? 'Publicado' : s.despliegue.estado}</Estado> <small>{fechaHora(s.despliegue.creado)} · {haceCuanto(s.despliegue.creado)}</small></span>
              <p className="t2" style={{ fontSize: '0.88rem' }}>{s.despliegue.mensaje || 'Sin mensaje de commit'}</p>
              {s.despliegue.inspector && <a className="enlace-p" style={{ width: 'max-content' }} href={s.despliegue.inspector} target="_blank" rel="noopener noreferrer">Ver en Vercel<ArrowSquareOut aria-hidden="true" /></a>}
            </div>
          ) : <Aviso titulo="Sin datos del despliegue">{s.despliegueError ?? ''}</Aviso>}
        </Caja>
      </div>

      <div className="rejilla r-md-2 seccion">
        {repo && repo.paraMoises.length > 0 && (
          <Caja>
            <div className="caja-cab"><h2>Lo que te toca en este proyecto</h2></div>
            <ul className="lista">{repo.paraMoises.map((x) => <li key={x} className="fila-l"><span className="crece" style={{ fontSize: '0.88rem' }}>{x}</span></li>)}</ul>
          </Caja>
        )}
        {repo && repo.acciones.length > 0 && (
          <Caja>
            <div className="caja-cab"><h2>Últimas acciones</h2></div>
            <ul className="lista">{repo.acciones.map((a, i) => <li key={i} className="fila-l"><span className="crece" style={{ fontSize: '0.86rem' }}>{a.texto}</span><small>{fechaCorta(a.fecha)}</small></li>)}</ul>
          </Caja>
        )}
        {w.stripe && (
          <Caja>
            <div className="caja-cab"><h2>Últimas ventas</h2><Link className="enlace-p" href={`/ventas/?proyecto=${w.stripe}`}>Todas</Link></div>
            {pagos.length === 0 ? <p className="vacio">Todavía no hay ventas.</p> : (
              <ul className="lista">{pagos.map((p) => <li key={p.id} className="fila-l"><span className="crece"><b className="num">{euros(p.importe)}</b><small>{p.email ?? 'sin email'} · {p.estado}</small></span><small>{fechaHora(p.creado)}</small></li>)}</ul>
            )}
          </Caja>
        )}
        {w.control && (
          <Caja>
            <div className="caja-cab"><h2>Últimas altas</h2><Link className="enlace-p" href={`/usuarios/?proyecto=${w.control}`}>Todas</Link></div>
            {altas.length === 0 ? <p className="vacio">Todavía no hay usuarios.</p> : (
              <ul className="lista">{altas.map((u) => <li key={u.email} className="fila-l"><span className="crece"><b style={{ fontSize: '0.86rem' }}>{u.email}</b><small>{u.estado}{u.plan !== '—' ? ` · ${u.plan}` : ''}</small></span><small>{fechaCorta(u.alta)}</small></li>)}</ul>
            )}
          </Caja>
        )}
      </div>
    </>
  );
}
