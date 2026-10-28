'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { precioTexto } from '@/lib/config';
import { useEstado } from '../Estado';

/** Barra fija en móvil cuando el botón principal ya no se ve. */
export function BarraFija() {
  const { t, locale, acceso } = useEstado();
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const f = () => setVer(window.scrollY > 700);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  if (acceso) return null;
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-[#EADFCD] bg-white/95 p-3 backdrop-blur transition-transform sm:hidden ${ver ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="flex gap-2">
        <a href="#test" className="boton boton-1 flex-1 px-3 text-sm">{t('home.fijo')}</a>
        <Link href={`/${locale}/precio`} className="boton boton-2 flex-1 px-3 text-sm">{t('home.fijoPrecio', { p: precioTexto(locale) })}</Link>
      </div>
    </div>
  );
}
