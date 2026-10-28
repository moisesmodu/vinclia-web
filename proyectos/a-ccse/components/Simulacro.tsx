'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PAIS } from '@/lib/config';
import { POR_ID, generarSimulacro } from '@/lib/preguntas';
import { useEstado } from './Estado';
import { useBanco } from './useBanco';
import { TarjetaPregunta } from './TarjetaPregunta';
import { Muro, SiguientePaso } from './Muro';

type Fase = 'inicio' | 'examen' | 'resultado' | 'bloqueado';
const { preguntas: N, minutos: MIN, aprobado: APROBADO } = PAIS.simulacro;

export function Simulacro() {
  const { t, locale, acceso, listo, usuario, simulacrosLocales, responder, guardarSimulacro } = useEstado();
  const [fase, setFase] = useState<Fase>('inicio');
  const [ids, setIds] = useState<number[]>([]);
  const [resp, setResp] = useState<(number | null)[]>([]);
  const [i, setI] = useState(0);
  const [inicio, setInicio] = useState(0);
  const [ahora, setAhora] = useState(0);
  const entregado = useRef(false);

  const restante = Math.max(0, MIN * 60 - Math.floor((ahora - inicio) / 1000));
  const gratisAgotado = !acceso && simulacrosLocales >= PAIS.gratis.simulacros;

  const empezar = async () => {
    if (!acceso) {
      if (simulacrosLocales >= PAIS.gratis.simulacros) return setFase('bloqueado');
      if (usuario) {
        const r = await fetch('/api/simulacro', { method: 'POST' }).then((x) => x.json()).catch(() => ({}));
        if (r.permitido === false) return setFase('bloqueado');
      }
    }
    const nuevos = generarSimulacro();
    setIds(nuevos);
    setResp(Array(nuevos.length).fill(null));
    setI(0);
    entregado.current = false;
    const t0 = Date.now();
    setInicio(t0);
    setAhora(t0);
    setFase('examen');
  };

  const entregar = useCallback(() => {
    if (entregado.current) return;
    entregado.current = true;
    let aciertos = 0;
    const fallos: number[] = [];
    ids.forEach((id, k) => {
      const ok = resp[k] === POR_ID.get(id)!.respuesta;
      if (ok) aciertos++; else fallos.push(id);
      responder(id, ok);
    });
    guardarSimulacro({ fecha: Date.now(), aciertos, total: ids.length, segundos: Math.round((Date.now() - inicio) / 1000), ids, fallos });
    setFase('resultado');
    window.scrollTo({ top: 0 });
  }, [ids, resp, inicio, responder, guardarSimulacro]);

  useEffect(() => {
    if (fase !== 'examen') return;
    const h = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(h);
  }, [fase]);
  useEffect(() => {
    if (fase === 'examen' && restante === 0) entregar();
  }, [fase, restante, entregar]);

  const banco = useBanco(fase === 'resultado' ? ids : [], locale, `${acceso}`);
  const aciertos = useMemo(() => ids.filter((id, k) => resp[k] === POR_ID.get(id)?.respuesta).length, [ids, resp]);

  if (!listo) return <p>{t('comun.cargando')}</p>;

  if (fase === 'inicio' || fase === 'bloqueado')
    return (
      <div className="grid gap-4">
        <div className="tarjeta p-6">
          <p className="leading-relaxed">{t('sim.intro')}</p>
          <button className="boton boton-1 mt-4" onClick={empezar}>{t('sim.empezar')}</button>
        </div>
        {(fase === 'bloqueado' || gratisAgotado) && <Muro texto={t('sim.gastado')} />}
      </div>
    );

  if (fase === 'examen') {
    const p = POR_ID.get(ids[i])!;
    const mm = String(Math.floor(restante / 60)).padStart(2, '0');
    const ss = String(restante % 60).padStart(2, '0');
    const respondidas = resp.filter((r) => r !== null).length;
    return (
      <div className="grid gap-4">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-fondo/95 px-4 py-2 backdrop-blur">
          <span className="text-sm">{t('test.pregunta', { i: i + 1, n: ids.length })} · {respondidas}/{ids.length}</span>
          <span className={`font-mono text-lg font-bold ${restante < 300 ? 'text-mal' : ''}`} role="timer" aria-label={t('sim.tiempo')}>{mm}:{ss}</span>
        </div>
        <TarjetaPregunta
          p={p}
          elegida={resp[i]}
          corregida={false}
          onElegir={(x) => setResp((r) => r.map((v, k) => (k === i ? x : v)))}
          lengua="es"
          bloqueada
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button className="boton boton-2" disabled={i === 0} onClick={() => setI(i - 1)}>← {t('test.anterior')}</button>
          {i + 1 < ids.length ? (
            <button className="boton boton-1" onClick={() => setI(i + 1)}>{t('test.siguiente')} →</button>
          ) : (
            <button className="boton boton-1" onClick={() => (respondidas < ids.length && !confirm(t('sim.confirmarEntregar')) ? null : entregar())}>{t('sim.entregar')}</button>
          )}
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Preguntas">
          {ids.map((_, k) => (
            <button key={k} onClick={() => setI(k)} className={`h-9 w-9 rounded-lg text-sm ${k === i ? 'bg-marca text-white' : resp[k] !== null ? 'bg-tinta/80 text-white' : 'bg-white border border-[#DCCDB6]'}`}>{k + 1}</button>
          ))}
        </nav>
        <button className="boton boton-2" onClick={() => (respondidas < ids.length && !confirm(t('sim.confirmarEntregar')) ? null : entregar())}>{t('sim.entregar')}</button>
      </div>
    );
  }

  const apto = aciertos >= APROBADO;
  return (
    <div className="grid gap-4">
      <div className={`tarjeta p-6 text-center ${apto ? 'border-ok' : 'border-mal'} border-2`}>
        {restante === 0 && <p className="text-sm text-suave">{t('sim.agotado')}</p>}
        <p className={`text-4xl font-black ${apto ? 'text-ok' : 'text-mal'}`}>{apto ? t('sim.apto') : t('sim.noApto')}</p>
        <p className="mt-2 text-xl font-semibold">{t('sim.nota', { a: aciertos, n: N })}</p>
        <p className="text-suave">{t('sim.minimo', { m: APROBADO })}</p>
        <button className="boton boton-1 mt-4" onClick={empezar}>{t('sim.otro')}</button>
      </div>
      <SiguientePaso />
      {!acceso && <Muro />}
      <h2 className="mt-4 text-xl font-bold">{t('sim.repasar')}</h2>
      {ids.map((id, k) => (
        <TarjetaPregunta
          key={id}
          numero={`${k + 1}/${ids.length}`}
          p={POR_ID.get(id)!}
          elegida={resp[k]}
          corregida
          es={banco.es[id]}
          propia={banco.propia[id]}
          lengua={banco.lengua}
          bloqueada={banco.bloqueadas.has(id)}
        />
      ))}
    </div>
  );
}
