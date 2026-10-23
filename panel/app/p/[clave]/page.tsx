import Link from 'next/link';
import { notFound } from 'next/navigation';
import Copiar from '@/components/Copiar';
import { proyecto, proyectos, promptDe, euros, fecha } from '@/lib/data';

export function generateStaticParams() {
  return proyectos().map((p) => ({ clave: p.clave }));
}

export default async function Ficha({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  const p = proyecto(clave);
  if (!p) notFound();
  const prompt = promptDe(clave);
  const acciones = [...p.acciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const clientesParaObjetivo = p.margenCliente > 0 ? Math.ceil(p.objetivoMes12 / p.margenCliente) : null;
  const resultado = p.ingresosMes - p.costesMes;

  return (
    <article className="ficha">
      <p className="volver"><Link href="/">Todos los proyectos</Link></p>
      <header className="ficha-cab">
        <span className="letra grande">{p.letra}</span>
        <div>
          <h1>{p.nombre}</h1>
          <p className="resumen">{p.resumen}</p>
          <p className="meta">
            <span className="pastilla">{p.estado}</span> {p.marca}
            {p.fechaLimite && <> · fecha límite {fecha(p.fechaLimite)}</>}
          </p>
        </div>
      </header>

      <section className="rentabilidad">
        <div><b>{euros(p.ingresosMes)}</b><span>ingresos al mes</span></div>
        <div><b>{euros(p.costesMes)}</b><span>costes al mes</span></div>
        <div className={resultado < 0 ? 'rojo' : ''}><b>{euros(resultado)}</b><span>resultado</span></div>
        <div><b>{p.clientes}</b><span>clientes</span></div>
        <div><b>{euros(p.objetivoMes12)}</b><span>objetivo mes 12</span></div>
        <div><b>{clientesParaObjetivo ?? '—'}</b><span>{clientesParaObjetivo ? 'clientes para llegar' : 'depende de la plataforma'}</span></div>
      </section>
      <p className="modelo"><b>Cómo cobra:</b> {p.modelo}. <b>Cómo llegan:</b> {p.canal}.</p>

      {Object.keys(p.enlaces).length > 0 && (
        <p className="enlaces">
          {Object.entries(p.enlaces).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener">{k}</a>)}
        </p>
      )}

      <div className="dos">
        <div>
          <section>
            <h2>Últimas acciones</h2>
            <ol className="linea">
              {acciones.map((a, i) => (
                <li key={i}><time>{fecha(a.fecha)}</time> {a.enlace ? <a href={a.enlace}>{a.texto}</a> : a.texto}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2>Próximos pasos</h2>
            <ul>{p.proximos.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <section>
            <h2>Lo que te toca a ti</h2>
            {p.paraMoises.length ? <ol className="tareas">{p.paraMoises.map((x) => <li key={x}>{x}</li>)}</ol> : <p className="vacio">Nada.</p>}
          </section>
        </div>
        <div>
          <section>
            <h2>Mejoras posibles</h2>
            {p.mejoras.length ? <ul>{p.mejoras.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="vacio">Se rellenan con la investigación y con cada sesión.</p>}
          </section>
          <section>
            <h2>Hallazgos</h2>
            {p.hallazgos.length ? <ul>{p.hallazgos.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="vacio">Pendiente de investigación.</p>}
          </section>
        </div>
      </div>

      <section>
        <h2>Competencia</h2>
        {p.competidores.length ? (
          <table className="tabla">
            <thead><tr><th>Quién</th><th>Precio</th><th>Dónde flaquea</th></tr></thead>
            <tbody>
              {p.competidores.map((c) => (
                <tr key={c.nombre}>
                  <td>{c.url ? <a href={c.url} target="_blank" rel="noopener">{c.nombre}</a> : c.nombre}</td>
                  <td>{c.precio ?? '—'}</td>
                  <td>{c.debilidad ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="vacio">Pendiente de investigación.</p>}
      </section>

      <section>
        <h2>Código abierto reutilizable</h2>
        {p.repos.length ? (
          <table className="tabla">
            <thead><tr><th>Repositorio</th><th>Licencia</th><th>Para qué</th></tr></thead>
            <tbody>
              {p.repos.map((r) => (
                <tr key={r.nombre}>
                  <td>{r.url ? <a href={r.url} target="_blank" rel="noopener">{r.nombre}</a> : r.nombre}{r.estrellas && <small> {r.estrellas}</small>}</td>
                  <td>{r.licencia ?? '—'}</td>
                  <td>{r.uso ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="vacio">Pendiente de investigación.</p>}
      </section>

      <section>
        <h2>Prompt de la sesión</h2>
        {prompt ? (
          <>
            <Copiar texto={prompt} />
            <pre className="prompt">{prompt}</pre>
          </>
        ) : <p className="vacio">Este proyecto no tiene prompt en PROMPTS-SESIONES.md.</p>}
      </section>
    </article>
  );
}
