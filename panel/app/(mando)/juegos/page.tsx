import { ArrowSquareOut, CheckCircle, Circle, Warning } from '@phosphor-icons/react/dist/ssr';
import { Caja, fechaHora } from '@/components/mando/Piezas';
import { estadoJuegos, PORTALES, type Celda } from '@/lib/mando/juegos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'Juegos y portales' };

const TXT = { publicado: 'publicado', 'no publicado': 'no publicado', 'sin respuesta': 'sin respuesta' } as const;

function Icono({ c, portal, juego }: { c: Celda; portal: string; juego: string }) {
  const clase = c.estado === 'publicado' ? 'publicado' : c.estado === 'no publicado' ? 'no-publicado' : 'sin-respuesta';
  const I = c.estado === 'publicado' ? CheckCircle : c.estado === 'no publicado' ? Circle : Warning;
  const href = c.estado === 'publicado' ? c.publica : c.ficha ?? c.publica;
  return (
    <a className={`portal-ico ${clase}`} href={href} target="_blank" rel="noopener noreferrer" title={`${juego} en ${portal}: ${TXT[c.estado]}`} aria-label={`${juego} en ${portal}: ${TXT[c.estado]}. Abrir.`}>
      <I weight={c.estado === 'publicado' ? 'fill' : 'bold'} aria-hidden="true" />
    </a>
  );
}

export default async function Juegos() {
  const { comprobado, juegos } = await estadoJuegos();
  const cuenta = (p: string) => juegos.filter((j) => j.portales[p as keyof typeof j.portales].estado === 'publicado').length;

  return (
    <>
      <header className="cab entra">
        <div><h1>Juegos y portales</h1><p>Los {juegos.length} juegos de Nuvolet Games en los cinco portales. Comprobado por HTTP en las páginas públicas el {fechaHora(comprobado)} (se repite cada 15 min).</p></div>
      </header>

      <section className="rejilla r-2 r-md-4 r-lg-4 entra entra-2" style={{ gridTemplateColumns: undefined }}>
        {PORTALES.map((p) => (
          <a key={p.clave} className="caja" href={p.panel} target="_blank" rel="noopener noreferrer">
            <div className="nucleo apretado kpi">
              <span className="kpi-tit">{p.nombre}</span>
              <span className="kpi-valor">{cuenta(p.clave)}<small className="t3" style={{ fontSize: '0.9rem' }}> / {juegos.length}</small></span>
              <span className="kpi-pie">públicos · abrir panel<ArrowSquareOut aria-hidden="true" /></span>
            </div>
          </a>
        ))}
      </section>

      <Caja className="seccion solo-escritorio">
        <table className="tabla tabla-juegos">
          <thead><tr><th>Juego</th>{PORTALES.map((p) => <th key={p.clave}>{p.nombre}</th>)}<th>Pruebas</th></tr></thead>
          <tbody>
            {juegos.map(({ juego, portales }) => (
              <tr key={juego.slug}>
                <td><b>{juego.titulo}</b><br /><small className="t3">{juego.estado}</small></td>
                {PORTALES.map((p) => <td key={p.clave}><Icono c={portales[p.clave]} portal={p.nombre} juego={juego.titulo} /></td>)}
                <td>
                  <span className="enlaces" style={{ justifyContent: 'center' }}>
                    {portales.gamedistribution.prueba && <a className="enlace-p" href={portales.gamedistribution.prueba} target="_blank" rel="noopener noreferrer">GD</a>}
                    {portales.gamemonetize.prueba && <a className="enlace-p" href={portales.gamemonetize.prueba} target="_blank" rel="noopener noreferrer">GM</a>}
                    {portales.gamedistribution.ficha && <a className="enlace-p" href={portales.gamedistribution.ficha} target="_blank" rel="noopener noreferrer">Ficha GD</a>}
                    {portales.gamemonetize.ficha && <a className="enlace-p" href={portales.gamemonetize.ficha} target="_blank" rel="noopener noreferrer">Ficha GM</a>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Caja>

      <div className="seccion solo-movil" style={{ display: 'grid', gap: 10 }}>
        {juegos.map(({ juego, portales }) => (
          <Caja key={juego.slug} apretado>
            <div className="juego-movil">
              <div><b>{juego.titulo}</b> <small className="t3">{juego.estado}</small></div>
              <div className="portales">
                {PORTALES.map((p) => (
                  <span key={p.clave} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: 'var(--t2)' }}>
                    <Icono c={portales[p.clave]} portal={p.nombre} juego={juego.titulo} />{p.nombre.replace('Game', 'G.')}
                  </span>
                ))}
              </div>
              <div className="enlaces">
                {portales.gamedistribution.ficha && <a className="enlace-p" href={portales.gamedistribution.ficha} target="_blank" rel="noopener noreferrer">Ficha GD</a>}
                {portales.gamemonetize.ficha && <a className="enlace-p" href={portales.gamemonetize.ficha} target="_blank" rel="noopener noreferrer">Ficha GM</a>}
              </div>
            </div>
          </Caja>
        ))}
      </div>

      <p className="t3" style={{ fontSize: '0.76rem', marginTop: 12 }}>
        Verde: la página pública existe y es nuestra (lleva el id del juego o «Nuvolet»). Gris: todavía no es pública (en GameDistribution y GameMonetize puede estar subido pero sin activar). Ámbar: el portal no respondió. Cada icono abre la ficha pública o, si no es pública, el panel del desarrollador.
      </p>
    </>
  );
}
