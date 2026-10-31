'use client';
import { useEstado } from './Estado';
import { enlaceN, precioTexto } from '@/lib/config';
import { BotonPagar } from './BotonPagar';

export function Muro({ texto }: { texto?: string }) {
  const { t, locale } = useEstado();
  return (
    <div className="tarjeta border-oro p-5 text-center">
      <h2 className="text-xl font-bold">{t('muro.t')}</h2>
      {texto && <p className="mt-1 font-semibold">{texto}</p>}
      <p className="mt-2 text-suave">{t('muro.d', { p: precioTexto(locale) })}</p>
      <BotonPagar clase="boton boton-1 mt-4" />
    </div>
  );
}

export function SiguientePaso() {
  const { t, locale } = useEstado();
  return (
    <aside className="tarjeta mt-6 border-2 border-oro p-5" data-gancho="proyecto-n">
      <p className="text-sm font-semibold uppercase tracking-wide text-marca">Nuevo en España</p>
      <h2 className="mt-1 text-xl font-bold">{t('sig.t')}</h2>
      <p className="mt-1 text-suave">{t('sig.d')}</p>
      <a href={enlaceN(locale, 'simulacro')} className="boton boton-2 mt-3">{t('sig.cta')} →</a>
    </aside>
  );
}
