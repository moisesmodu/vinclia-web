import Link from 'next/link';
import { ArrowSquareOut, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Aviso, Caja, Chispa, Estado, euros, haceCuanto, IconoMarca, numero } from '@/components/mando/Piezas';
import { contenido } from '@/lib/mando/contenido';
import { enlaces, WEBS, WEBS_VISTA } from '@/lib/mando/entidades';
import { metricasWeb, tablero } from '@/lib/mando/metricas';
import { salud } from '@/lib/mando/salud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Proyectos' };

const NIVEL = { bien: 'Bien', atencion: 'Atención', mal: 'Caída' } as const;

export default async function Proyectos() {
  const [t, estado] = await Promise.all([tablero(), salud()]);
  const enWeb = new Set(WEBS.map((w) => w.repo));
  const enCola = contenido.proyectos.filter((p) => !enWeb.has(p.clave)).sort((a, b) => a.orden - b.orden);

  return (
    <>
      <header className="cab entra">
        <div><h1>Proyectos</h1><p>Las {WEBS.length} webs en producción: dinero, usuarios, visitas y estado de cada una. Toca una tarjeta para ver su ficha.</p></div>
      </header>
      {!t.stripe.ok && <Aviso titulo="Stripe no respondió">{t.stripe.error}</Aviso>}

      <div className="rejilla r-md-2 r-lg-3">
        {WEBS_VISTA.map((w, i) => {
          const m = metricasWeb(t, w);
          const s = estado.find((x) => x.web.slug === w.slug)!;
          const repo = contenido.proyectos.find((p) => p.clave === w.repo);
          const marca = contenido.marcas[w.repo];
          const e = enlaces(w);
          const vis = t.visitas30.find((x) => x.clave === (w.visitasEn ?? w.slug))?.valores ?? [];
          return (
            <Caja key={w.slug} className={`proy-borde entra entra-${Math.min(4, i + 1)}`} estilo={{ ['--acento' as string]: marca?.acento }}>
              <Link href={`/proyectos/${w.slug}/`} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="proy-cab">
                  <IconoMarca svg={marca?.svg} nombre={w.nombre} grande />
                  <div className="crece">
                    <h2 style={{ fontSize: '1.15rem' }}>{w.nombre}</h2>
                    <small>{[w.dominio, ...(w.otros ?? []).map((o) => o.dominio)].join(' · ')}</small>
                  </div>
                  <Estado nivel={s.nivel}>{NIVEL[s.nivel]}</Estado>
                </div>
                <div className="metricas m-4">
                  <div><span>Ingresos</span><b>{m.ingresosMes == null ? (w.stripe ? '—' : 'n/a') : euros(m.ingresosMes)}</b></div>
                  <div><span>Usuarios</span><b>{m.usuarios == null ? 'n/a' : numero(m.usuarios)}</b></div>
                  <div><span>Visitas 30 d</span><b>{w.visitasEn ? <small className="t3">en {WEBS.find((x) => x.slug === w.visitasEn)?.nombre}</small> : m.visitantes30 == null ? '—' : numero(m.visitantes30)}</b></div>
                  <div><span>Conversión</span><b>{m.conversion}</b></div>
                </div>
                <Chispa valores={vis} color={w.serie} alto={40} etiqueta={`Visitantes diarios de ${w.visitasEn ? WEBS.find((x) => x.slug === w.visitasEn)?.nombre : w.nombre}`} />
                <p className="t3" style={{ fontSize: '0.76rem', marginTop: 8 }}>
                  {repo?.estado ? `${repo.estado.charAt(0).toUpperCase()}${repo.estado.slice(1)} · ` : ''}{w.modelo} · desplegado {haceCuanto(s.despliegue?.creado)}
                </p>
              </Link>
              <div className="enlaces" style={{ marginTop: 12 }}>
                <a className="enlace-p" href={e.web} target="_blank" rel="noopener noreferrer">Web<ArrowSquareOut aria-hidden="true" /></a>
                {e.stripe && <a className="enlace-p" href={e.stripe} target="_blank" rel="noopener noreferrer">Stripe<ArrowSquareOut aria-hidden="true" /></a>}
                <a className="enlace-p" href={e.vercel} target="_blank" rel="noopener noreferrer">Vercel<ArrowSquareOut aria-hidden="true" /></a>
                <a className="enlace-p" href={e.searchConsole} target="_blank" rel="noopener noreferrer">Search Console<ArrowSquareOut aria-hidden="true" /></a>
                <a className="enlace-p" href={e.analytics} target="_blank" rel="noopener noreferrer">Analytics<ArrowSquareOut aria-hidden="true" /></a>
              </div>
            </Caja>
          );
        })}
      </div>

      {enCola.length > 0 && (
        <section className="seccion">
          <Caja>
            <div className="caja-cab"><h2>Sin web todavía</h2><small>{enCola.length} proyectos</small></div>
            <ul className="lista">
              {enCola.map((p) => (
                <li key={p.clave}>
                  <a className="fila-l" href={`/p/${p.clave}/`} style={{ textDecoration: 'none' }}>
                    <IconoMarca svg={contenido.marcas[p.clave]?.svg} nombre={p.nombre} />
                    <span className="crece"><b>{p.nombre}</b><small>{p.resumen}</small></span>
                    <span className="chip">{p.estado}</span>
                    <ArrowRight aria-hidden="true" className="t3" />
                  </a>
                </li>
              ))}
            </ul>
          </Caja>
        </section>
      )}
    </>
  );
}
