'use client';
import { PAIS } from '@/lib/config';
import { ES_GRATIS } from '@/lib/preguntas';
import { useEstado } from './Estado';
import { BotonPagar } from './BotonPagar';

export function useGratisHechas() {
  const { progreso } = useEstado();
  return Object.keys(progreso.preguntas).filter((id) => ES_GRATIS.has(Number(id))).length;
}

/** Oferta justo al acabar lo gratis, con el motivo concreto y el pago a un clic. */
export function Oferta({ motivo }: { motivo: string }) {
  const { t } = useEstado();
  return (
    <div className="tarjeta border-2 border-terracota p-5 text-center sm:p-6">
      <p className="text-lg font-semibold">{motivo}</p>
      <BotonPagar clase="boton boton-1 mt-4 w-full text-lg sm:w-auto" />
      <p className="mt-2 text-sm text-suave">{t('oferta.letra', { d: PAIS.accesoDias })}</p>
    </div>
  );
}
