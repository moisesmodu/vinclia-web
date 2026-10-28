'use client';
import { useState } from 'react';
import Link from 'next/link';
import { POR_ID, IDS_GRATIS, deTarea } from '@/lib/preguntas';
import { useEstado } from '../Estado';
import { useBanco } from '../useBanco';
import { TarjetaPregunta } from '../TarjetaPregunta';

/** Gancho principal: 5 preguntas reales (una por tarea, todas del plan gratis) con explicación en el idioma del visitante. */
const IDS = [1, 2, 3, 4, 5].map((t) => IDS_GRATIS.find((id) => deTarea(t).some((p) => p.id === id))!);

export function MiniTest() {
  const { t, locale, responder } = useEstado();
  const [i, setI] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const banco = useBanco(IDS, locale);
  if (i >= IDS.length) {
    const bien = aciertos >= 4;
    return (
      <div className="tarjeta p-6 text-center">
        <p className="titulos text-4xl font-bold text-marca">{t('home.miniRes', { a: aciertos })}</p>
        <div className="mx-auto mt-3 flex max-w-xs justify-center gap-1.5" aria-hidden>
          {IDS.map((_, k) => <span key={k} className={`h-2.5 flex-1 rounded-full ${k < aciertos ? 'bg-ok' : 'bg-black/15'}`} />)}
        </div>
        <p className="mx-auto mt-4 max-w-md">{bien ? t('home.miniBien') : t('home.miniMal')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/${locale}/simulacro`} className="boton boton-1">{t('home.miniSim')}</Link>
          <Link href={`/${locale}/precio`} className="boton boton-2">{t('home.miniPagar')} →</Link>
        </div>
      </div>
    );
  }
  const p = POR_ID.get(IDS[i])!;
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-1.5" aria-label={t('test.pregunta', { i: i + 1, n: IDS.length })}>
        {IDS.map((_, k) => (
          <span key={k} className={`h-2 flex-1 rounded-full ${k < i ? 'bg-terracota' : k === i ? 'bg-terracota/50' : 'bg-black/10'}`} />
        ))}
      </div>
      <TarjetaPregunta
        p={p}
        numero={t('test.pregunta', { i: i + 1, n: IDS.length })}
        elegida={elegida}
        corregida={elegida !== null}
        onElegir={(x) => {
          setElegida(x);
          responder(p.id, x === p.respuesta);
          if (x === p.respuesta) setAciertos((a) => a + 1);
        }}
        es={banco.es[p.id]}
        propia={banco.propia[p.id]}
        lengua={banco.lengua}
        bloqueada={false}
      />
      {elegida !== null && (
        <button className="boton boton-1 justify-self-end" onClick={() => { setElegida(null); setI(i + 1); }}>
          {i + 1 < IDS.length ? t('test.siguiente') : t('test.terminar')} →
        </button>
      )}
    </div>
  );
}
