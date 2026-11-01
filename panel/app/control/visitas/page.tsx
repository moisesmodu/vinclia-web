import { enlaceAnalytics, visitas } from '@/lib/control/visitas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const n = (v: number) => v.toLocaleString('es-ES');

export default async function Visitas() {
  const lista = await visitas();
  const fallos = lista.filter((v) => !v.d7.ok || !v.d30.ok);
  return (
    <section>
      <h2>Visitas por web</h2>
      {fallos.length > 0 && <p className="ctl-aviso">La API de Web Analytics no respondió para {fallos.map((f) => f.nombre).join(', ')}. Usa el enlace de cada fila para ver los datos en Vercel.</p>}
      <div className="ctl-scroll">
        <table className="tabla ctl-tabla">
          <thead><tr><th>Web</th><th className="d">Visitantes 7 d</th><th className="d">Páginas 7 d</th><th className="d">Visitantes 30 d</th><th className="d">Páginas 30 d</th><th>Analytics</th></tr></thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.vercel}>
                <td><b>{v.nombre}</b><br /><small><a href={v.web} target="_blank" rel="noopener noreferrer">{v.web.replace(/^https:\/\//, '')}</a></small></td>
                {v.d7.ok ? <><td className="d">{n(v.d7.datos.visitantes)}</td><td className="d">{n(v.d7.datos.paginas)}</td></> : <td colSpan={2}><small className="ctl-error">sin datos</small></td>}
                {v.d30.ok ? <><td className="d">{n(v.d30.datos.visitantes)}</td><td className="d">{n(v.d30.datos.paginas)}</td></> : <td colSpan={2}><small className="ctl-error">sin datos</small></td>}
                <td><a href={enlaceAnalytics(v.vercel)} target="_blank" rel="noopener noreferrer">abrir en Vercel</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="nota">Datos de Vercel Web Analytics (solo producción). Las cifras se guardan cinco minutos para no gastar cuota de la API.</p>
    </section>
  );
}
