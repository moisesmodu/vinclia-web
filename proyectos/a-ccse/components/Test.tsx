'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { POR_ID, ES_GRATIS } from '@/lib/preguntas';
import { useEstado } from './Estado';
import { useBanco } from './useBanco';
import { TarjetaPregunta } from './TarjetaPregunta';
import { Muro } from './Muro';
import { Oferta, useGratisHechas } from './Oferta';
import { PAIS } from '@/lib/config';

/** Test con corrección inmediata (por tema o repaso). */
export function Test({ ids, titulo, volver }: { ids: number[]; titulo: string; volver: string }) {
  const { t, locale, acceso, listo, responder } = useEstado();
  const visibles = useMemo(() => (acceso ? ids : ids.filter((id) => ES_GRATIS.has(id))), [ids, acceso]);
  const [ronda, setRonda] = useState(0);
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const banco = useBanco(visibles, locale, `${acceso}`);
  const gratisHechas = useGratisHechas();
  const motivo = gratisHechas >= PAIS.gratis.preguntas ? t('oferta.todas') : t('oferta.tema', { g: visibles.length, n: ids.length });
  if (!listo) return <p>{t('comun.cargando')}</p>;
  if (!visibles.length) return <Muro />;
  const fin = i >= visibles.length;
  if (fin)
    return (
      <div className="grid gap-4">
        {!acceso && ids.length > visibles.length && <Oferta motivo={motivo} />}
        <div className="tarjeta p-6 text-center">
          <h2 className="text-2xl font-bold">{t('test.resultado', { a: aciertos, n: visibles.length })}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="boton boton-1" onClick={() => { setI(0); setAciertos(0); setElegida(null); setRonda(ronda + 1); }}>{t('test.repetir')}</button>
            <Link className="boton boton-2" href={volver}>{t('test.volverTemas')}</Link>
          </div>
        </div>
      </div>
    );
  const p = POR_ID.get(visibles[i])!;
  const corregida = elegida !== null;
  return (
    <div className="grid gap-4" key={ronda}>
      <div className="flex items-center justify-between text-sm text-suave">
        <span>{titulo}</span>
        <span>{t('test.pregunta', { i: i + 1, n: visibles.length })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-black/10"><div className="h-full bg-marca" style={{ width: `${(100 * i) / visibles.length}%` }} /></div>
      {!acceso && ids.length > visibles.length && (
        <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-suave">
          <span>{i === 0 ? t('test.soloGratis', { n: visibles.length }) : ''}</span>
          <span className="rounded-full bg-oro/15 px-3 py-1 font-semibold text-tinta">{t('oferta.contador', { x: Math.min(gratisHechas, PAIS.gratis.preguntas), t: PAIS.gratis.preguntas })}</span>
        </p>
      )}
      <TarjetaPregunta
        p={p}
        elegida={elegida}
        corregida={corregida}
        onElegir={(x) => { setElegida(x); responder(p.id, x === p.respuesta); if (x === p.respuesta) setAciertos((a) => a + 1); }}
        es={banco.es[p.id]}
        propia={banco.propia[p.id]}
        lengua={banco.lengua}
        bloqueada={banco.bloqueadas.has(p.id)}
      />
      {corregida && (
        <button className="boton boton-1 justify-self-end" onClick={() => { setElegida(null); setI(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          {i + 1 < visibles.length ? t('test.siguiente') : t('test.terminar')} →
        </button>
      )}
    </div>
  );
}
