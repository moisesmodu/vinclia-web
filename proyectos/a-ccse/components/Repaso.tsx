'use client';
import { useMemo, useState } from 'react';
import { pendientes, proximoRepaso } from '@/lib/repaso';
import { fechaLarga } from '@/lib/i18n';
import { useEstado } from './Estado';
import { Test } from './Test';

export function Repaso() {
  const { t, locale, progreso, listo } = useEstado();
  const [ids, setIds] = useState<number[] | null>(null);
  const due = useMemo(() => pendientes(progreso), [progreso]);
  const prox = proximoRepaso(progreso);
  if (!listo) return <p>{t('comun.cargando')}</p>;
  if (ids) return <Test ids={ids} titulo={t('rep.h1')} volver={`/${locale}/repaso`} />;
  return (
    <div className="tarjeta p-6">
      {due.length ? (
        <>
          <p className="text-lg font-semibold">{t('rep.pendientes', { n: due.length })}</p>
          <button className="boton boton-1 mt-4" onClick={() => setIds(due.slice(0, 30))}>{t('rep.empezar')}</button>
        </>
      ) : (
        <>
          <p>{t('rep.nada')}</p>
          {prox && <p className="mt-2 text-suave">{t('rep.proximo', { f: fechaLarga(prox, locale) })}</p>}
        </>
      )}
    </div>
  );
}
