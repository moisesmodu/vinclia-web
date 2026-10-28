'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Idioma, Oposicion, Pregunta } from '@/lib/tipos';
import { t, otro } from '@/lib/i18n';
import {
  type Progreso, vacio, registrar, pendientes, falladas, racha, fusionar, notaSimulacro, barajar, elegirSimulacro,
} from '@/lib/progreso';

type Modo = 'tema' | 'simulacro' | 'repaso' | 'falladas';
type Sesion = {
  modo: Modo;
  ids: string[];
  reserva: Set<string>;
  i: number;
  marcadas: Record<string, number | null>;
  corregidas: Record<string, boolean>;
  inicio: number;
  limite?: number; // segundos
};
type Resultado = { modo: Modo; aciertos: number; fallos: number; blancos: number; nota?: number; segundos: number; n: number; percentil?: number | null; ids: string[]; marcadas: Record<string, number | null> };

const CLAVE = (slug: string) => `aprova:progreso:${slug}`;
const fraccion = (x: number, idioma: Idioma) => (x === 0.25 ? '1/4' : Math.abs(x - 1 / 3) < 1e-6 ? '1/3' : x.toLocaleString(idioma));

function cargarLocal(slug: string): Progreso {
  try {
    const j = localStorage.getItem(CLAVE(slug));
    return j ? { ...vacio(), ...JSON.parse(j) } : vacio();
  } catch { return vacio(); }
}

export default function Practica({ idioma, op, inicial }: { idioma: Idioma; op: Oposicion; inicial: { tema?: number; modo?: string } }) {
  const d = t(idioma);
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [total, setTotal] = useState(0);
  const [suscrito, setSuscrito] = useState(false);
  const [logueado, setLogueado] = useState(false);
  const [progreso, setProgreso] = useState<Progreso>(vacio());
  const [vista, setVista] = useState<'inicio' | 'test' | 'resultado' | 'stats'>('inicio');
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [temaSel, setTemaSel] = useState<number>(inicial.tema ?? 0);
  const [num, setNum] = useState(10);
  const [ahora, setAhora] = useState(Date.now());
  const sincro = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoInicio = useRef(false);

  const mapa = useMemo(() => new Map((preguntas ?? []).map((p) => [p.id, p])), [preguntas]);
  const idsDisp = useMemo(() => new Set(mapa.keys()), [mapa]);

  // Carga: progreso local, preguntas accesibles y, con sesión, progreso del servidor.
  useEffect(() => {
    const local = cargarLocal(op.slug);
    setProgreso(local);
    fetch(`/api/preguntas?op=${encodeURIComponent(op.slug)}`)
      .then((r) => r.json())
      .then((j) => {
        setPreguntas(j.preguntas ?? []);
        setTotal(j.total ?? 0);
        setSuscrito(!!j.suscrito);
        setLogueado(!!j.logueado);
        if (j.logueado)
          fetch(`/api/progreso?op=${encodeURIComponent(op.slug)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((s) => { if (s?.datos) setProgreso((p) => fusionar(p, { ...vacio(), ...s.datos })); })
            .catch(() => {});
      })
      .catch(() => setPreguntas([]));
  }, [op.slug]);

  // Guardado local y sincronización (con retardo) con el servidor.
  useEffect(() => {
    if (!progreso.actualizado) return;
    try { localStorage.setItem(CLAVE(op.slug), JSON.stringify(progreso)); } catch {}
    if (!logueado) return;
    if (sincro.current) clearTimeout(sincro.current);
    sincro.current = setTimeout(() => {
      fetch(`/api/progreso?op=${encodeURIComponent(op.slug)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(progreso) }).catch(() => {});
    }, 1500);
  }, [progreso, logueado, op.slug]);

  // Reloj del simulacro.
  useEffect(() => {
    if (vista !== 'test' || sesion?.modo !== 'simulacro') return;
    const h = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(h);
  }, [vista, sesion?.modo]);

  const empezar = useCallback((modo: Modo, opciones?: { tema?: number; n?: number; ids?: string[] }) => {
    if (!preguntas?.length) return;
    let ids: string[] = [];
    let reserva = new Set<string>();
    let limite: number | undefined;
    if (opciones?.ids) ids = opciones.ids;
    else if (modo === 'tema') {
      const base = opciones?.tema ? preguntas.filter((p) => p.tema === opciones.tema) : preguntas;
      // primero las no vistas, luego el resto
      const nuevas = barajar(base.filter((p) => !progreso.respuestas[p.id]));
      const vistas = barajar(base.filter((p) => progreso.respuestas[p.id]));
      ids = [...nuevas, ...vistas].slice(0, opciones?.n ?? 10).map((p) => p.id);
    } else if (modo === 'simulacro') {
      const n = op.examen.preguntas + (op.examen.reserva ?? 0);
      const sel = elegirSimulacro(preguntas, op.temas, n);
      ids = sel.map((p) => p.id);
      const contadas = Math.min(op.examen.preguntas, ids.length);
      reserva = new Set(ids.slice(contadas));
      limite = Math.round(op.examen.minutos * 60 * (ids.length / n));
    } else if (modo === 'repaso') ids = pendientes(progreso, idsDisp).slice(0, 50);
    else if (modo === 'falladas') ids = barajar(falladas(progreso, idsDisp)).slice(0, 30);
    if (!ids.length) return;
    setSesion({ modo, ids, reserva, i: 0, marcadas: {}, corregidas: {}, inicio: Date.now(), limite });
    setResultado(null);
    setVista('test');
    setAhora(Date.now());
    window.scrollTo({ top: 0 });
  }, [preguntas, progreso, idsDisp, op]);

  // Arranque directo desde la página del tema (?tema=N) o del simulacro (?modo=simulacro).
  useEffect(() => {
    if (autoInicio.current || !preguntas?.length) return;
    autoInicio.current = true;
    if (inicial.modo === 'simulacro') empezar('simulacro');
    else if (inicial.tema && preguntas.some((p) => p.tema === inicial.tema)) empezar('tema', { tema: inicial.tema, n: 10 });
  }, [preguntas, inicial, empezar]);

  const terminar = useCallback(async (s: Sesion) => {
    const segundos = Math.round((Date.now() - s.inicio) / 1000);
    let aciertos = 0, fallos = 0, blancos = 0;
    let p = progreso;
    const contadas = s.ids.filter((id) => !s.reserva.has(id));
    for (const id of s.ids) {
      const m = s.marcadas[id];
      const q = mapa.get(id)!;
      const ok = m === q.correcta;
      if (!s.reserva.has(id)) { if (m == null) blancos++; else if (ok) aciertos++; else fallos++; }
      if (s.modo === 'simulacro' && m != null) p = registrar(p, id, ok);
    }
    let nota: number | undefined;
    let percentil: number | null = null;
    if (s.modo === 'simulacro') {
      nota = notaSimulacro(aciertos, fallos, contadas.length, op.examen.penalizacion, op.examen.notaMaxima ?? 10);
      p = { ...p, simulacros: [...p.simulacros, { fecha: Date.now(), nota, aciertos, fallos, blancos, segundos, n: contadas.length }].slice(-200), actualizado: Date.now() };
      if (logueado) {
        try {
          const r = await fetch('/api/simulacro', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: op.slug, nota, aciertos, fallos, blancos }) });
          percentil = (await r.json()).percentil ?? null;
        } catch {}
      }
    }
    setProgreso(p);
    setResultado({ modo: s.modo, aciertos, fallos, blancos, nota, segundos, n: contadas.length, percentil, ids: s.ids, marcadas: s.marcadas });
    setVista('resultado');
    window.scrollTo({ top: 0 });
  }, [progreso, mapa, op, logueado]);

  // Fin automático por tiempo.
  useEffect(() => {
    if (vista === 'test' && sesion?.modo === 'simulacro' && sesion.limite && ahora - sesion.inicio >= sesion.limite * 1000) terminar(sesion);
  }, [ahora, vista, sesion, terminar]);

  if (preguntas === null) return <div className="contenedor py-16 text-center text-slate-500">…</div>;

  if (vista === 'test' && sesion) return <Test {...{ idioma, op, sesion, setSesion, mapa, terminar, ahora, salir: () => setVista('inicio') }} onRespuesta={(id, ok) => setProgreso((p) => registrar(p, id, ok))} />;

  if (vista === 'resultado' && resultado) return <VistaResultado {...{ idioma, op, resultado, mapa }} volver={() => setVista('inicio')} repetir={(ids) => empezar('falladas', { ids })} suscrito={suscrito} />;

  const nPend = pendientes(progreso, idsDisp).length;
  const nFall = falladas(progreso, idsDisp).length;
  const respondidas = Object.values(progreso.respuestas);
  const pctAcierto = respondidas.length ? Math.round((respondidas.reduce((s, r) => s + r.a, 0) / respondidas.reduce((s, r) => s + r.a + r.f, 0)) * 100) : 0;
  const disponiblesTema = (n: number) => preguntas.filter((p) => !n || p.tema === n).length;

  if (vista === 'stats') return <Estadisticas {...{ idioma, op, progreso, preguntas }} volver={() => setVista('inicio')} />;

  return (
    <div className="contenedor py-6">
      <nav className="text-xs text-slate-500"><Link href={`/${idioma}/${op.slug}`}>{op.nombreCorto[idioma]}</Link></nav>
      <h1 className="mt-1 text-2xl font-extrabold">{op.nombre[idioma]}</h1>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Dato n={respondidas.length} t={d.app.respondidas} />
        <Dato n={`${pctAcierto}%`} t={d.app.acierto} />
        <Dato n={`${racha(progreso)} ${d.app.dias}`} t={d.app.racha} />
      </div>
      {!suscrito ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
          <p>{d.app.bloqueado} ({preguntas.length}/{total})</p>
          <Link href={`/${idioma}/precios`} className="boton mt-3">{d.app.desbloquear}</Link>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="tarjeta">
          <h2 className="font-bold">{d.app.porTema}</h2>
          <label className="mt-3 block text-sm text-slate-600">{d.tema}
            <select value={temaSel} onChange={(e) => setTemaSel(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm">
              <option value={0}>{d.app.todasLosTemas} ({preguntas.length})</option>
              {op.temas.map((x) => <option key={x.n} value={x.n} disabled={!disponiblesTema(x.n)}>{x.n}. {x.titulo[idioma].slice(0, 70)} ({disponiblesTema(x.n)})</option>)}
            </select>
          </label>
          <div className="mt-3 flex gap-2" role="group" aria-label={d.app.numPreguntas}>
            {[10, 20, 30].map((k) => <button key={k} onClick={() => setNum(k)} className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${num === k ? 'border-marca bg-marca-claro text-marca-oscuro' : 'border-slate-300'}`}>{k}</button>)}
          </div>
          <button className="boton mt-3 w-full" disabled={!disponiblesTema(temaSel)} onClick={() => empezar('tema', { tema: temaSel || undefined, n: num })}>{d.app.empezar}</button>
        </div>
        <div className="tarjeta">
          <h2 className="font-bold">{d.app.simulacro}</h2>
          <p className="mt-2 text-sm text-slate-600">{op.examen.preguntas} {d.preguntas}{op.examen.reserva ? ` + ${op.examen.reserva} reserva` : ''} · {op.examen.minutos} {d.minutos} · {op.examen.penalizacion ? `${d.penaliza} ${fraccion(op.examen.penalizacion, idioma)}` : d.sinPenalizacion}</p>
          {preguntas.length < op.examen.preguntas ? <p className="mt-1 text-xs text-amber-700">{idioma === 'ca' ? `Simulacre reduït a ${preguntas.length} preguntes (pla gratuït).` : `Simulacro reducido a ${preguntas.length} preguntas (plan gratuito).`}</p> : null}
          <button className="boton mt-4 w-full" onClick={() => empezar('simulacro')}>{d.app.empezar}</button>
        </div>
        <div className="tarjeta">
          <h2 className="font-bold">{d.app.repaso} <span className="etiqueta ml-1">{nPend}</span></h2>
          <p className="mt-2 text-sm text-slate-600">{nPend ? d.app.repasoTexto : d.app.nadaPendiente}</p>
          <button className="boton mt-4 w-full" disabled={!nPend} onClick={() => empezar('repaso')}>{d.app.empezar}</button>
        </div>
        <div className="tarjeta">
          <h2 className="font-bold">{d.app.falladas} <span className="etiqueta ml-1">{nFall}</span></h2>
          <button className="boton mt-4 w-full" disabled={!nFall} onClick={() => empezar('falladas')}>{d.app.empezar}</button>
          <button className="boton-sec mt-2 w-full" onClick={() => setVista('stats')}>{d.app.estadisticas}</button>
        </div>
      </section>
    </div>
  );
}

function Dato({ n, t }: { n: number | string; t: string }) {
  return <div className="tarjeta p-3"><p className="text-xl font-extrabold text-marca">{n}</p><p className="text-xs text-slate-500">{t}</p></div>;
}

function reloj(seg: number) {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Test({ idioma, op, sesion, setSesion, mapa, terminar, ahora, salir, onRespuesta }: {
  idioma: Idioma; op: Oposicion; sesion: Sesion; setSesion: (s: Sesion) => void; mapa: Map<string, Pregunta>;
  terminar: (s: Sesion) => void; ahora: number; salir: () => void; onRespuesta: (id: string, ok: boolean) => void;
}) {
  const d = t(idioma);
  const [verIdioma, setVerIdioma] = useState<Idioma>(idioma);
  const id = sesion.ids[sesion.i];
  const q = mapa.get(id)!;
  const x = q[verIdioma];
  const simulacro = sesion.modo === 'simulacro';
  const marcada = sesion.marcadas[id];
  const corregida = !simulacro && sesion.corregidas[id];
  const restante = sesion.limite ? sesion.limite - (ahora - sesion.inicio) / 1000 : 0;
  const ultimo = sesion.i === sesion.ids.length - 1;

  useEffect(() => setVerIdioma(idioma), [id, idioma]);

  const marcar = (k: number) => {
    if (corregida) return;
    const marcadas = { ...sesion.marcadas, [id]: simulacro && marcada === k ? null : k };
    if (simulacro) return setSesion({ ...sesion, marcadas });
    setSesion({ ...sesion, marcadas, corregidas: { ...sesion.corregidas, [id]: true } });
    onRespuesta(id, k === q.correcta);
  };
  const ir = (i: number) => { setSesion({ ...sesion, i }); window.scrollTo({ top: 0 }); };

  return (
    <div className="contenedor max-w-2xl py-4">
      <div className="flex items-center gap-3 text-sm">
        <button onClick={() => { if (confirm(d.app.salirSeguro)) salir(); }} className="rounded-lg px-2 py-1 text-slate-500 hover:text-tinta" aria-label={d.app.volver}>✕</button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-marca transition-all" style={{ width: `${((sesion.i + 1) / sesion.ids.length) * 100}%` }} /></div>
        <span className="tabular-nums text-slate-600">{sesion.i + 1}/{sesion.ids.length}</span>
        {simulacro ? <span className={`tabular-nums font-bold ${restante < 300 ? 'text-mal' : 'text-tinta'}`}>{reloj(restante)}</span> : null}
      </div>

      <div className="tarjeta mt-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{d.tema} {q.tema}{sesion.reserva.has(id) ? ' · reserva' : ''}{q.origen === 'examen-oficial' && q.examen ? ` · ${idioma === 'ca' ? 'examen oficial' : 'examen oficial'} ${q.examen.anio}` : ''}</span>
          <button onClick={() => setVerIdioma(otro(verIdioma))} className="rounded border border-slate-300 px-2 py-0.5 font-semibold uppercase hover:border-marca">{otro(verIdioma)}</button>
        </div>
        <p className="mt-2 text-lg font-semibold leading-snug">{x.enunciado}</p>
        <div className="mt-4 grid gap-2">
          {x.opciones.map((o, k) => {
            let cls = 'border-slate-300 hover:border-marca';
            if (simulacro && marcada === k) cls = 'border-marca bg-marca-claro';
            if (corregida) cls = k === q.correcta ? 'border-ok bg-green-50' : k === marcada ? 'border-mal bg-red-50' : 'border-slate-200 opacity-70';
            return (
              <button key={k} onClick={() => marcar(k)} className={`flex min-h-12 items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-[15px] transition ${cls}`}>
                <span className="mt-0.5 font-bold text-slate-500">{'abcdef'[k]})</span><span>{o}</span>
              </button>
            );
          })}
        </div>
        {corregida ? <Explicacion q={q} idioma={verIdioma} acierto={marcada === q.correcta} slug={op.slug} /> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {sesion.i > 0 ? <button className="boton-sec" onClick={() => ir(sesion.i - 1)}>←</button> : null}
        {simulacro && marcada != null ? <button className="boton-sec" onClick={() => setSesion({ ...sesion, marcadas: { ...sesion.marcadas, [id]: null } })}>{d.app.enBlanco}</button> : null}
        <div className="flex-1" />
        {!ultimo ? <button className="boton" disabled={!simulacro && !corregida} onClick={() => ir(sesion.i + 1)}>{d.app.siguiente} →</button> : null}
        {ultimo || simulacro ? <button className={ultimo ? 'boton' : 'boton-sec'} disabled={!simulacro && !corregida} onClick={() => terminar(sesion)}>{d.app.terminar}</button> : null}
      </div>
      {simulacro ? (
        <div className="mt-6 grid grid-cols-10 gap-1">
          {sesion.ids.map((qid, k) => (
            <button key={qid} onClick={() => ir(k)} className={`aspect-square rounded text-xs font-semibold ${k === sesion.i ? 'ring-2 ring-marca' : ''} ${sesion.marcadas[qid] != null ? 'bg-marca text-white' : sesion.reserva.has(qid) ? 'bg-amber-100' : 'bg-slate-200'}`}>{k + 1}</button>
          ))}
          {sesion.reserva.size ? <p className="col-span-10 mt-1 text-xs text-slate-500">{d.app.reservaNota}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function Explicacion({ q, idioma, acierto, slug }: { q: Pregunta; idioma: Idioma; acierto: boolean; slug: string }) {
  const d = t(idioma);
  const [errata, setErrata] = useState<'cerrado' | 'abierto' | 'enviado'>('cerrado');
  const [texto, setTexto] = useState('');
  return (
    <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
      <p className={`font-bold ${acierto ? 'text-ok' : 'text-mal'}`}>{acierto ? `✓ ${d.app.correcta}` : `✗ ${d.app.incorrecta}`}</p>
      <p className="mt-2 text-slate-700">{q[idioma].explicacion}</p>
      <p className="mt-2 text-xs text-slate-600">
        <strong>{d.app.articulo}:</strong>{' '}
        {q.fuente.url ? <a href={q.fuente.url} target="_blank" rel="noopener" className="text-marca underline">{q.fuente.norma}{q.fuente.articulo ? `, art. ${q.fuente.articulo}` : ''}</a> : <>{q.fuente.norma}{q.fuente.articulo ? `, ${q.fuente.articulo}` : ''}</>}
      </p>
      {q.cita ? <blockquote className="mt-2 border-l-4 border-marca-claro bg-slate-50 px-3 py-2 text-xs italic text-slate-600"><span className="not-italic font-semibold">{d.app.textoFuente}:</span> «{q.cita}»</blockquote> : null}
      {errata === 'cerrado' ? <button onClick={() => setErrata('abierto')} className="mt-3 text-xs text-slate-500 underline">{d.app.reportar}</button> : null}
      {errata === 'abierto' ? (
        <form className="mt-3" onSubmit={async (e) => {
          e.preventDefault();
          await fetch('/api/errata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: slug, id: q.id, texto }) }).catch(() => {});
          setErrata('enviado');
        }}>
          <textarea required minLength={5} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={d.app.reportarTexto} className="w-full rounded-lg border border-slate-300 p-2 text-sm" rows={3} />
          <button className="boton-sec mt-2">{d.app.enviar}</button>
        </form>
      ) : null}
      {errata === 'enviado' ? <p className="mt-3 text-xs text-ok">{d.app.gracias}</p> : null}
    </div>
  );
}

function VistaResultado({ idioma, op, resultado: r, mapa, volver, repetir, suscrito }: {
  idioma: Idioma; op: Oposicion; resultado: Resultado; mapa: Map<string, Pregunta>; volver: () => void; repetir: (ids: string[]) => void; suscrito: boolean;
}) {
  const d = t(idioma);
  const malas = r.ids.filter((id) => r.marcadas[id] != null && r.marcadas[id] !== mapa.get(id)?.correcta);
  const aprobado = r.nota != null && r.nota >= (op.examen.notaCorte ?? 5);
  return (
    <div className="contenedor max-w-2xl py-6">
      <h1 className="text-2xl font-extrabold">{d.app.resultado}</h1>
      {r.nota != null ? (
        <div className={`tarjeta mt-4 text-center ${aprobado ? 'border-ok' : 'border-mal'}`}>
          <p className="text-sm text-slate-500">{d.app.nota}</p>
          <p className={`text-5xl font-extrabold ${aprobado ? 'text-ok' : 'text-mal'}`}>{r.nota.toLocaleString(idioma)}</p>
          <p className="text-xs text-slate-500">/ {op.examen.notaMaxima ?? 10} · {op.examen.penalizacion ? `${d.penaliza} ${fraccion(op.examen.penalizacion, idioma)}` : d.sinPenalizacion}</p>
          {r.percentil != null ? <p className="mt-2 text-sm font-semibold text-marca">{d.app.percentil(r.percentil)}</p> : null}
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Dato n={r.aciertos} t={d.app.aciertos} />
        <Dato n={r.fallos} t={d.app.fallos} />
        <Dato n={r.blancos} t={d.app.blancos} />
        <Dato n={reloj(r.segundos)} t={d.app.tiempo} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {malas.length ? <button className="boton" onClick={() => repetir(malas)}>{d.app.repetirFalladas} ({malas.length})</button> : null}
        <button className="boton-sec" onClick={volver}>{d.app.volver}</button>
        {!suscrito ? <Link className="boton-sec" href={`/${idioma}/precios`}>{d.app.desbloquear}</Link> : null}
      </div>
      {r.modo === 'simulacro' ? (
        <ol className="mt-6 space-y-3">
          {r.ids.map((id, k) => {
            const q = mapa.get(id)!;
            const m = r.marcadas[id];
            const ok = m === q.correcta;
            return (
              <li key={id} className="tarjeta p-4 text-sm">
                <p className="font-semibold">{k + 1}. {q[idioma].enunciado}</p>
                <p className={`mt-1 ${m == null ? 'text-slate-500' : ok ? 'text-ok' : 'text-mal'}`}>
                  {m == null ? d.app.blancos : `${ok ? '✓' : '✗'} ${q[idioma].opciones[m]}`}
                </p>
                {!ok ? <p className="mt-1 text-ok">✓ {q[idioma].opciones[q.correcta]}</p> : null}
                <p className="mt-1 text-xs text-slate-600">{q[idioma].explicacion} <span className="text-slate-500">({q.fuente.norma}{q.fuente.articulo ? `, art. ${q.fuente.articulo}` : ''})</span></p>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

function Estadisticas({ idioma, op, progreso, preguntas, volver }: { idioma: Idioma; op: Oposicion; progreso: Progreso; preguntas: Pregunta[]; volver: () => void }) {
  const d = t(idioma);
  const porTema = op.temas.map((x) => {
    const ids = preguntas.filter((p) => p.tema === x.n).map((p) => p.id);
    let a = 0, f = 0, vistas = 0;
    for (const id of ids) { const r = progreso.respuestas[id]; if (r) { vistas++; a += r.a; f += r.f; } }
    return { x, total: ids.length, vistas, pct: a + f ? Math.round((a / (a + f)) * 100) : null };
  });
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ oposicion: op.slug, exportado: new Date().toISOString(), progreso }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aprova-${op.slug}.json`;
    a.click();
  };
  return (
    <div className="contenedor max-w-2xl py-6">
      <button onClick={volver} className="text-sm text-slate-500">← {d.app.volver}</button>
      <h1 className="mt-2 text-2xl font-extrabold">{d.app.estadisticas}</h1>
      <ul className="mt-4 space-y-2">
        {porTema.map(({ x, total, vistas, pct }) => (
          <li key={x.n} className="tarjeta p-3 text-sm">
            <div className="flex justify-between gap-2"><span className="font-medium">{x.n}. {x.titulo[idioma]}</span><span className="shrink-0 text-slate-500">{vistas}/{total}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full ${pct == null ? '' : pct >= 70 ? 'bg-ok' : pct >= 50 ? 'bg-amber-500' : 'bg-mal'}`} style={{ width: `${pct ?? 0}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{pct == null ? '—' : `${pct}% ${d.app.acierto.toLowerCase()}`}</p>
          </li>
        ))}
      </ul>
      {progreso.simulacros.length ? (
        <>
          <h2 className="mt-6 text-lg font-bold">{d.app.simulacro}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {[...progreso.simulacros].reverse().slice(0, 20).map((s) => (
              <li key={s.fecha} className="flex justify-between rounded-lg bg-white px-3 py-2"><span>{new Date(s.fecha).toLocaleDateString(idioma)}</span><span className="font-bold">{s.nota}</span><span className="text-slate-500">{s.aciertos}✓ {s.fallos}✗ {s.blancos}○</span></li>
            ))}
          </ul>
        </>
      ) : null}
      <button className="boton-sec mt-6" onClick={exportar}>{d.app.exportar}</button>
    </div>
  );
}
