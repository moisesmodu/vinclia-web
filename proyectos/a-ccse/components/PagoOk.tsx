'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fechaLarga } from '@/lib/i18n';
import { useEstado } from './Estado';

export function PagoOk() {
  const { t, locale, recargarUsuario } = useEstado();
  const id = useSearchParams().get('session_id');
  const [estado, setEstado] = useState<'comprobando' | 'ok' | 'pendiente'>('comprobando');
  const [hasta, setHasta] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return setEstado('pendiente');
    fetch(`/api/stripe/verificar?session_id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d.ok) {
          setHasta(d.accesoHasta);
          setEstado('ok');
          await recargarUsuario();
        } else setEstado('pendiente');
      })
      .catch(() => setEstado('pendiente'));
  }, [id, recargarUsuario]);
  return (
    <div className="tarjeta p-6 text-center">
      {estado === 'comprobando' && <p>{t('pago.comprobando')}</p>}
      {estado === 'pendiente' && <p>{t('pago.pendiente')}</p>}
      {estado === 'ok' && (
        <>
          <p className="text-3xl font-black text-ok">{t('pago.ok')}</p>
          {hasta && <p className="mt-2">{t('pago.okD', { f: fechaLarga(new Date(hasta), locale) })}</p>}
          <Link className="boton boton-1 mt-4" href={`/${locale}/temas`}>{t('pago.empezar')}</Link>
        </>
      )}
    </div>
  );
}
