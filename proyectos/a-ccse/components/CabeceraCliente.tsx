'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LOCALES, NOMBRE_LOCALE, type Locale } from '@/lib/config';
import { useEstado } from './Estado';

export function SelectorIdioma({ locale, etiqueta }: { locale: Locale; etiqueta: string }) {
  const ruta = usePathname();
  const router = useRouter();
  return (
    <label className="text-sm">
      <span className="sr-only">{etiqueta}</span>
      <select
        className="rounded-lg border border-[#d6d0c6] bg-white px-2 py-2"
        value={locale}
        onChange={(e) => router.push(ruta.replace(/^\/[a-z]{2}(?=\/|$)/, `/${e.target.value}`))}
      >
        {LOCALES.map((l) => <option key={l} value={l}>{NOMBRE_LOCALE[l]}</option>)}
      </select>
    </label>
  );
}

export function EnlaceCuenta() {
  const { t, locale, usuario, acceso } = useEstado();
  return (
    <Link href={`/${locale}/${acceso ? 'cuenta' : usuario ? 'precio' : 'cuenta'}`} className={`boton ${acceso ? 'boton-2' : 'boton-1'} px-3 py-2 text-sm`}>
      {acceso ? '★ ' + t('nav.cuenta') : usuario ? t('nav.precio') : t('cuenta.entrar')}
    </Link>
  );
}
