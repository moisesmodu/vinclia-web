import Link from 'next/link';
import Camino from '@/components/Camino';
import { cartera, proyectos, ultimaAccion, euros, fecha } from '@/lib/data';

export default function Inicio() {
  const c = cartera();
  const lista = proyectos();
  const actual = lista.reduce((s, p) => s + p.ingresosMes, 0);
  const costes = lista.reduce((s, p) => s + p.costesMes, 0) + c.costesFijosMes;
  const previsto = lista.reduce((s, p) => s + p.objetivoMes12, 0);
  const enMarcha = lista.filter((p) => p.estado !== 'pendiente' && p.estado !== 'descartado').length;
  const urgentes = lista.filter((p) => p.fechaLimite);

  return (
    <>
      <Camino actual={actual} previsto={previsto} hitos={c.objetivos} />

      <section className="cifras">
        <div><b>{euros(costes)}</b><span>costes al mes</span></div>
        <div><b>{euros(actual - costes)}</b><span>resultado al mes</span></div>
        <div><b>{euros(c.inversionAcumulada)}</b><span>invertido hasta hoy</span></div>
        <div><b>{enMarcha} de {lista.length}</b><span>proyectos en marcha</span></div>
      </section>

      <div className="dos">
        <section>
          <h2>Lo que te toca a ti</h2>
          {c.decisionesPendientes.length === 0 ? (
            <p className="vacio">Nada pendiente. Todo lo demás lo hace Claude.</p>
          ) : (
            <ol className="tareas">
              {c.decisionesPendientes.map((d) => (
                <li key={d.texto}>
                  {d.texto}
                  {d.donde && (d.donde.startsWith('http')
                    ? <> <a href={d.donde} target="_blank" rel="noopener">abrir</a></>
                    : <> <span className="donde">{d.donde}</span></>)}
                </li>
              ))}
            </ol>
          )}
          {urgentes.length > 0 && (
            <p className="aviso">
              {urgentes.map((p) => <span key={p.clave}><b>{p.nombre}</b> tiene fecha límite el {fecha(p.fechaLimite!)}. </span>)}
            </p>
          )}
        </section>
        <section>
          <h2>Cómo funciona</h2>
          <ul className="reglas">
            {c.reglas.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="nota">Escenario de marketing: {c.escenario}. Actualizado el {fecha(c.actualizado)}.</p>
        </section>
      </div>

      <section>
        <h2>Los proyectos</h2>
        <div className="libro">
          <div className="fila fila-cab">
            <span>Proyecto</span><span>Estado</span><span>Ingresos</span><span>Objetivo mes 12</span><span>Última acción</span>
          </div>
          {lista.map((p) => {
            const u = ultimaAccion(p);
            return (
              <Link href={`/p/${p.clave}/`} key={p.clave} className={`fila estado-${p.estado.replace(' ', '-')}`}>
                <span className="fila-nombre">
                  <span className="letra">{p.letra}</span>
                  <span><b>{p.nombre}</b><small>{p.marca}</small></span>
                </span>
                <span><span className="pastilla">{p.estado}</span></span>
                <span className="num" data-etiqueta="Ingresos">{euros(p.ingresosMes)}<small>/mes</small></span>
                <span className="num" data-etiqueta="Objetivo mes 12">{euros(p.objetivoMes12)}<small>/mes</small></span>
                <span className="accion">{u ? <>{u.texto}<small>{fecha(u.fecha)}</small></> : <small>sin acciones</small>}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
