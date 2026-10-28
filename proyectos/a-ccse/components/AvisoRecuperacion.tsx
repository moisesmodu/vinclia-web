'use client';
import { useEffect, useState } from 'react';
import { useEstado } from './Estado';
import { BotonPagar } from './BotonPagar';

/** Aviso en la app para quien abrió el pago y no lo terminó (se puede cerrar; vuelve al día siguiente como máximo una vez). */
export function AvisoRecuperacion() {
  const { t, usuario } = useEstado();
  const [cerrado, setCerrado] = useState(true);
  useEffect(() => {
    try { setCerrado(localStorage.getItem('ccse.aviso.recuperacion') === '1'); } catch { setCerrado(false); }
  }, []);
  if (!usuario?.pagoPendiente || usuario.acceso || cerrado) return null;
  return (
    <div className="border-b border-terracota/30 bg-terracota/10">
      <div className="contenedor flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
        <p><b>{t('rec.t')}.</b> {t('rec.d')}</p>
        <div className="flex items-center gap-2">
          <BotonPagar etiqueta={t('rec.cta')} clase="boton boton-1 min-h-10 px-3 py-1.5 text-sm" />
          <button aria-label={t('comun.cerrar')} className="px-2 text-lg" onClick={() => { setCerrado(true); try { localStorage.setItem('ccse.aviso.recuperacion', '1'); } catch {} }}>×</button>
        </div>
      </div>
    </div>
  );
}
