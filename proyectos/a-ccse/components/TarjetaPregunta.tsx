'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Pregunta } from '@/lib/preguntas';
import { useEstado } from './Estado';
import { BotonVoz } from './Voz';
import type { Trad } from './useBanco';

const LETRAS = ['a', 'b', 'c'];

export function TarjetaPregunta({
  p, elegida, onElegir, corregida, es, propia, lengua, bloqueada, numero,
}: {
  p: Pregunta; elegida: number | null; onElegir?: (i: number) => void; corregida: boolean;
  es?: Trad; propia?: Trad; lengua: string; bloqueada: boolean; numero?: string;
}) {
  const { t, locale } = useEstado();
  const [verTrad, setVerTrad] = useState(true);
  const trad = lengua !== 'es' && !bloqueada ? propia : undefined;
  const textoVoz = `${p.texto} ${p.opciones.map((o, i) => `${LETRAS[i]}: ${o}`).join('. ')}`;
  const acierto = elegida === p.respuesta;

  return (
    <div className="tarjeta p-4 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-suave">
        <span>{numero} · {t('tarea.n', { n: p.tarea })} · nº {p.id}</span>
        <BotonVoz texto={textoVoz} lengua="es" etiqueta={t('test.escuchar')} />
      </div>
      <h2 className="text-lg font-semibold sm:text-xl" lang="es" dir="ltr">{p.texto}</h2>
      {trad?.texto && verTrad && <p className="mt-1 text-suave">{trad.texto}</p>}
      <ul className="mt-4 grid gap-2">
        {p.opciones.map((o, i) => {
          const correcta = corregida && i === p.respuesta;
          const mal = corregida && i === elegida && !acierto;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={corregida || !onElegir}
                onClick={() => onElegir?.(i)}
                aria-pressed={elegida === i}
                className={`w-full rounded-xl border-2 p-3 text-start transition ${
                  correcta ? 'border-ok bg-green-50' : mal ? 'border-mal bg-orange-50' : elegida === i ? 'border-marca bg-red-50' : 'border-[#e7e2da] bg-white hover:border-suave'
                }`}
              >
                <span lang="es" dir="ltr" className="block text-left"><span className="me-2 font-bold uppercase text-suave">{LETRAS[i]})</span>{o}</span>
                {trad?.opciones?.[i] && verTrad && <span className="mt-0.5 block text-sm text-suave">{trad.opciones[i]}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {lengua !== 'es' && trad && (
        <button type="button" className="mt-2 text-sm text-suave underline" onClick={() => setVerTrad(!verTrad)}>
          {verTrad ? t('test.verEnEspanol') : t('test.verTraduccion')}
        </button>
      )}
      {corregida && (
        <div className="mt-4 rounded-xl bg-[#f6f3ee] p-4" aria-live="polite">
          <p className={`font-bold ${acierto ? 'text-ok' : 'text-mal'}`}>
            {acierto ? t('test.correcta') : elegida === null ? t('sim.sinRespuesta') : t('test.incorrecta')}{' '}
            {!acierto && <span lang="es">{LETRAS[p.respuesta]}) {p.opciones[p.respuesta]}</span>}
          </p>
          {bloqueada ? (
            <div className="mt-2">
              <p className="text-suave">{t('test.bloqueada')}</p>
              <Link href={`/${locale}/precio`} className="boton boton-1 mt-2 text-sm">{t('muro.cta')}</Link>
            </div>
          ) : (
            <Explicacion propia={propia} es={es} lengua={lengua} />
          )}
          {p.pagina && <p className="mt-2 text-xs text-suave">{t('test.manual', { p: p.pagina })}</p>}
        </div>
      )}
    </div>
  );
}

function Explicacion({ propia, es, lengua }: { propia?: Trad; es?: Trad; lengua: string }) {
  const { t } = useEstado();
  const [enEs, setEnEs] = useState(false);
  const x = enEs || lengua === 'es' ? es : propia ?? es;
  if (!x?.explicacion) return null;
  const l = enEs || lengua === 'es' || !propia ? 'es' : lengua;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t('test.explicacion')}</span>
        <BotonVoz texto={x.explicacion} lengua={l} etiqueta={t('test.escuchar')} />
      </div>
      <p className="mt-1 leading-relaxed" lang={l}>{x.explicacion}</p>
      {x.nota && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm"><b>{t('test.nota')}:</b> {x.nota}</p>}
      {lengua !== 'es' && es?.explicacion && (
        <button type="button" className="mt-1 text-sm text-suave underline" onClick={() => setEnEs(!enEs)}>
          {enEs ? t('test.verTraduccion') : t('test.verEnEspanol')}
        </button>
      )}
    </div>
  );
}
