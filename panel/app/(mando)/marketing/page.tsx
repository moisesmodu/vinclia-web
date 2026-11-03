import { ArrowSquareOut, CaretRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr';
import { BotonPublicado, Copiar, EnviarCorreos } from '@/components/mando/Interacciones';
import { Aviso, Caja, Estado, fechaHora } from '@/components/mando/Piezas';
import { contenido, type Pieza } from '@/lib/mando/contenido';
import { modoCorreo } from '@/lib/mando/correo';
import { envios, piezasPublicadas } from '@/lib/mando/db';
import { uno, type Busqueda } from '@/lib/mando/filtros';
import { diaMadrid } from '@/lib/mando/metricas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketing' };

type Situacion = 'publicada' | 'aprobada' | 'pendiente';
const TEXTO_SIT = { publicada: 'Publicada', aprobada: 'Aprobada', pendiente: 'Por aprobar' } as const;
const NIVEL_SIT = { publicada: 'bien', aprobada: 'neutro', pendiente: 'atencion' } as const;

export default async function Marketing({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const sp = await searchParams;
  const vista = (['calendario', 'piezas', 'correos'] as const).find((v) => v === uno(sp, 'v')) ?? 'calendario';
  const filtroProyecto = uno(sp, 'p');
  const [pub, env] = await Promise.all([piezasPublicadas(), envios()]);
  const hoy = diaMadrid(new Date());
  const piezaPorId = new Map(contenido.piezas.map((p) => [p.id, p]));
  const situacion = (id: string, estadoTexto = ''): Situacion => {
    const e = pub.datos.get(id);
    if (e) return e.publicado ? 'publicada' : (piezaPorId.get(id)?.estado ?? estadoTexto).includes('✅') ? 'aprobada' : 'pendiente';
    const t = piezaPorId.get(id)?.estado || estadoTexto;
    return t.includes('📣') ? 'publicada' : t.includes('✅') ? 'aprobada' : 'pendiente';
  };
  const totalPub = contenido.piezas.filter((p) => situacion(p.id) === 'publicada').length;
  const deHoy = contenido.calendario.flatMap((s) => s.filas).filter((f) => f.fecha === hoy && f.ids.length);
  const modo = modoCorreo();
  const correos = contenido.correos.map((c) => ({ ...c, envio: env.datos.get(c.clave) ?? null }));
  const porEnviar = correos.filter((c) => !c.envio || c.envio.estado === 'error' || c.envio.estado === 'simulado');
  const proyectos = [...new Map(contenido.piezas.map((p) => [p.clave, p.proyecto])).entries()];
  const piezas = contenido.piezas.filter((p) => !filtroProyecto || p.clave === filtroProyecto);

  return (
    <>
      <header className="cab entra">
        <div><h1>Marketing</h1><p>Calendario de noviembre, textos listos para copiar y los correos a entidades. {totalPub} de {contenido.piezas.length} piezas publicadas.</p></div>
        <nav className="segmentos" aria-label="Vista">
          <a href="/marketing/" aria-current={vista === 'calendario' ? 'true' : undefined}>Calendario</a>
          <a href="/marketing/?v=piezas" aria-current={vista === 'piezas' ? 'true' : undefined}>Piezas</a>
          <a href="/marketing/?v=correos" aria-current={vista === 'correos' ? 'true' : undefined}>Correos {porEnviar.length ? `· ${porEnviar.length}` : ''}</a>
        </nav>
      </header>
      {(pub.aviso || env.aviso) && <Aviso titulo="La base de datos del panel no respondió">{pub.aviso ?? env.aviso}</Aviso>}

      {vista === 'calendario' && (
        <>
          <Caja className="entra entra-2">
            <div className="caja-cab"><h2>Hoy toca</h2><small>{new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</small></div>
            {deHoy.length === 0 ? <p className="vacio">Hoy no hay piezas en el calendario.</p> : deHoy.flatMap((f) => f.ids.map((id) => ({ id, f }))).map(({ id, f }) => {
              const p = piezaPorId.get(id);
              const s = situacion(id, f.estado);
              return (
                <div key={id} className="pieza-fila">
                  <a className="id-pieza" href={`/marketing/?v=piezas&p=${p?.clave ?? ''}#${id}`}>{id}</a>
                  <span className="crece"><b style={{ fontSize: '0.9rem' }}>{p?.titulo ?? f.texto}</b><small>{f.proyecto} · {f.canal}</small></span>
                  {p ? <BotonPublicado id={id} publicado={s === 'publicada'} /> : <Estado nivel={NIVEL_SIT[s]}>{TEXTO_SIT[s]}</Estado>}
                </div>
              );
            })}
          </Caja>
          {contenido.calendario.map((sem) => {
            const fechas = [...new Set(sem.filas.map((f) => f.fecha ?? f.dia))];
            return (
              <Caja key={sem.numero} className="seccion">
                <div className="caja-cab"><div><h2>Semana {sem.numero} · {sem.rango}</h2><small>{sem.lema}</small></div></div>
                {fechas.map((fe) => {
                  const filas = sem.filas.filter((f) => (f.fecha ?? f.dia) === fe);
                  const clase = filas[0].fecha === hoy ? ' hoy' : filas[0].fecha && filas[0].fecha < hoy ? ' pasado' : '';
                  return (
                    <div key={fe} className={`dia${clase}`} id={filas[0].fecha ? `d-${filas[0].fecha}` : undefined}>
                      <div className="dia-cab">{filas[0].dia}</div>
                      {filas.map((f, i) => {
                        const s = f.ids.length ? (f.ids.every((id) => situacion(id, f.estado) === 'publicada') ? 'publicada' : situacion(f.ids[0], f.estado)) : null;
                        return (
                          <div key={i} className="pieza-fila">
                            {f.ids.length ? <a className="id-pieza" href={`/marketing/?v=piezas&p=${piezaPorId.get(f.ids[0])?.clave ?? ''}#${f.ids[0]}`}>{f.ids.join(' · ')}</a> : <span className="id-pieza">{f.hito ? 'Hito' : 'Web'}</span>}
                            <span className="crece"><span style={{ fontSize: '0.88rem' }}>{f.ids.length ? piezaPorId.get(f.ids[0])?.titulo ?? f.canal : f.texto}</span><small>{f.proyecto} · {f.canal}</small></span>
                            {s ? <Estado nivel={NIVEL_SIT[s]}>{TEXTO_SIT[s]}</Estado> : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </Caja>
            );
          })}
        </>
      )}

      {vista === 'piezas' && (
        <>
          <nav className="segmentos" aria-label="Proyecto" style={{ marginBottom: 14 }}>
            <a href="/marketing/?v=piezas" aria-current={!filtroProyecto ? 'true' : undefined}>Todas</a>
            {proyectos.map(([clave, nombre]) => <a key={clave} href={`/marketing/?v=piezas&p=${clave}`} aria-current={filtroProyecto === clave ? 'true' : undefined}>{nombre}</a>)}
          </nav>
          <div style={{ display: 'grid', gap: 12 }}>
            {piezas.map((p) => <TarjetaPieza key={p.id} p={p} publicada={situacion(p.id) === 'publicada'} aprobada={situacion(p.id) !== 'pendiente'} />)}
          </div>
        </>
      )}

      {vista === 'correos' && (
        <>
          <Aviso tipo="info" titulo={modo === 'real' ? 'Envío real por Resend' : 'Modo simulación'}>
            {modo === 'real' ? 'Al confirmar, el correo sale desde el remitente de la marca con respuesta a hola@numimates.com. Cada correo solo se puede enviar una vez.' : 'En esta copia del panel no sale ningún correo: el botón comprueba el flujo y lo anota como simulado.'}
          </Aviso>
          <Caja>
            <div className="caja-cab">
              <div><h2>Correos a entidades · semana 1</h2><small>{correos.length - porEnviar.length} enviados · {porEnviar.length} por enviar</small></div>
              <EnviarCorreos primario modo={modo} etiqueta={`Enviar todos (${porEnviar.length})`} correos={porEnviar.map((c) => ({ clave: c.clave, para: c.para, asunto: c.asunto }))} />
            </div>
            <ul className="lista">
              {correos.map((c) => {
                const enviado = c.envio?.estado === 'enviado' || c.envio?.estado === 'enviando';
                return (
                  <li key={c.clave} className="fila-l" style={{ display: 'block' }}>
                    <details className="plegable">
                      <summary style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="flecha t3"><CaretRight aria-hidden="true" /></span>
                        <span className="id-pieza">{c.pieza}</span>
                        <span className="crece" style={{ minWidth: 0 }}><b style={{ fontSize: '0.9rem', display: 'block', overflowWrap: 'anywhere' }}>{c.para}</b><small style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.asunto}</small></span>
                        {c.envio?.estado === 'enviado' ? <Estado nivel="bien">Enviado</Estado>
                          : c.envio?.estado === 'enviando' ? <Estado nivel="atencion">En curso</Estado>
                          : c.envio?.estado === 'error' ? <Estado nivel="mal">Error</Estado>
                          : c.envio?.estado === 'simulado' ? <Estado nivel="neutro">Simulado</Estado>
                          : <Estado nivel="neutro">Pendiente</Estado>}
                      </summary>
                      <dl className="correo-prev">
                        <dt>De</dt><dd>{c.de}</dd>
                        <dt>Para</dt><dd>{c.para}</dd>
                        <dt>Responder a</dt><dd>{c.responderA}</dd>
                        <dt>Asunto</dt><dd>{c.asunto}</dd>
                      </dl>
                      <div className="bloque"><div className="bloque-cab"><span><EnvelopeSimple aria-hidden="true" /> Texto</span><Copiar objetivo={`txt-${c.clave}`} /></div><pre id={`txt-${c.clave}`}>{c.texto}</pre></div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                        {enviado ? <small>{c.envio?.estado === 'enviado' ? `Enviado el ${fechaHora(c.envio.actualizado)} · id ${c.envio.resend_id}` : 'Envío en curso o interrumpido: revisa Resend antes de repetir.'}</small>
                          : <EnviarCorreos modo={modo} etiqueta="Enviar" correos={[{ clave: c.clave, para: c.para, asunto: c.asunto }]} />}
                        {c.envio?.estado === 'error' && <small style={{ color: 'var(--baja)' }}>{c.envio.error}</small>}
                        <a className="enlace-p" href="https://resend.com/emails" target="_blank" rel="noopener noreferrer">Resend<ArrowSquareOut aria-hidden="true" /></a>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </Caja>
        </>
      )}
    </>
  );
}

function TarjetaPieza({ p, publicada, aprobada }: { p: Pieza; publicada: boolean; aprobada: boolean }) {
  return (
    <Caja>
      <article id={p.id} style={{ scrollMarginTop: 80 }}>
        <div className="caja-cab" style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            <span className="id-pieza">{p.id}</span>
            <h2 style={{ fontSize: '0.98rem' }}>{p.titulo}</h2>
          </div>
          <BotonPublicado id={p.id} publicado={publicada} />
        </div>
        <p className="t2" style={{ fontSize: '0.82rem' }}>{p.proyecto} · {p.dia || 'sin día'}{p.idioma ? ` · ${p.idioma}` : ''} · {aprobada ? 'aprobada' : 'por aprobar'}</p>
        {p.canal && <p className="t3" style={{ fontSize: '0.8rem', marginTop: 4 }}>{p.canal}</p>}
        {p.quien && <p className="t3" style={{ fontSize: '0.8rem', marginTop: 2 }}>Publica: {p.quien}</p>}
        <div className="enlaces" style={{ marginTop: 8 }}>
          {p.enlace && <a className="enlace-p" href={p.enlace} target="_blank" rel="noopener noreferrer">Enlace con medición<ArrowSquareOut aria-hidden="true" /></a>}
          <a className="enlace-p" href={p.fuente} target="_blank" rel="noopener noreferrer">Ver en GitHub<ArrowSquareOut aria-hidden="true" /></a>
        </div>
        {p.bloques.map((b, i) => (
          <div key={i} className="bloque">
            <div className="bloque-cab"><span>{b.etiqueta}</span><Copiar objetivo={`txt-${p.id}-${i}`} /></div>
            <pre id={`txt-${p.id}-${i}`}>{b.texto}</pre>
          </div>
        ))}
        {p.bloques.length === 0 && <p className="t3" style={{ fontSize: '0.82rem', marginTop: 8 }}>Esta pieza no tiene texto para copiar (lista o preparación): ábrela en GitHub.</p>}
      </article>
    </Caja>
  );
}
