import Link from 'next/link';
import Camino from '@/components/Camino';
import { Probabilidad, Veredicto } from '@/components/Juicio';
import { webs, cartera, proyectos, ultimaAccion, euros, fecha } from '@/lib/data';

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

      {c.juicioCartera && (
        <section className="juicio-cartera">
          <h2>Probabilidad de éxito</h2>
          <p className="nota">Simulación de la cartera con los supuestos de <Link href="/docs/juicio/">JUICIO.md</Link>, del {fecha(c.juicioCartera.fecha)}.</p>
          <div className="cifras">
            <div><b>{c.juicioCartera.p1000a6} %</b><span>de llegar a 1.000 €/mes en 6 meses</span></div>
            <div><b>{c.juicioCartera.p1000a12} %</b><span>de llegar a 1.000 €/mes en 12 meses</span></div>
            <div><b>{c.juicioCartera.p350a6} %</b><span>de cubrir cuota y costes en 6 meses</span></div>
            <div><b>{euros(c.juicioCartera.mediana12)}</b><span>ingreso mediano al mes 12</span></div>
          </div>
          <p className="nota">Núcleo de arranque: {c.juicioCartera.nucleo.join(', ')}. El resto, por orden, cuando el núcleo tenga datos.</p>
          <div className="libro">
            <div className="fila fila-juicio fila-cab"><span>Proyecto</span><span>Probabilidad a 6 meses</span><span>Veredicto</span></div>
            {[...lista].sort((a, b) => (b.juicio?.probabilidad ?? 0) - (a.juicio?.probabilidad ?? 0)).map((p) => p.juicio && (
              <Link href={`/p/${p.clave}/`} key={p.clave} className="fila fila-juicio">
                <span className="fila-nombre"><span className="letra">{p.letra}</span><span><b>{p.nombre}</b><small>{p.juicio.exito}</small></span></span>
                <span><Probabilidad valor={p.juicio.probabilidad} /></span>
                <span><Veredicto texto={p.juicio.veredicto} /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="donde-ver">
        <h2>Dónde ver cada proyecto</h2>
        <p className="nota">Las webs en producción se abren desde cualquier sitio; las vistas previas son páginas privadas tuyas en claude.ai.</p>
        <div className="libro">
          <div className="fila fila-ver fila-cab"><span>Proyecto</span><span>Web en producción</span><span>Vista previa</span><span>Código</span></div>
          {lista.map((p) => {
            const w = webs(p); const prod = w.filter((x) => x.tipo === 'web'); const prev = w.filter((x) => x.tipo === 'vista previa');
            const pr = Object.entries(p.enlaces).find(([k]) => k.startsWith('PR'));
            return (
              <div className={`fila fila-ver estado-${p.estado.replace(' ', '-')}`} key={p.clave}>
                <span className="fila-nombre"><span className="letra">{p.letra}</span><span><b><Link href={`/p/${p.clave}/`}>{p.nombre}</Link></b><small>{p.estado}</small></span></span>
                <span data-etiqueta="Web">{prod.length ? prod.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noopener" className="boton-web">{x.nombre}</a>) : <small>todavía no</small>}</span>
                <span data-etiqueta="Vista previa">{prev.length ? prev.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noopener">{x.nombre}</a>) : <small>—</small>}</span>
                <span data-etiqueta="Código">{pr ? <a href={pr[1]} target="_blank" rel="noopener">{pr[0]}</a> : <small>sin PR</small>}</span>
              </div>
            );
          })}
        </div>
      </section>

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
