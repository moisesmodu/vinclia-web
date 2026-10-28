import Link from 'next/link';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { SelectorIdioma, EnlaceCuenta } from './CabeceraCliente';

export function Cabecera({ locale }: { locale: Locale }) {
  const t = traductor(locale);
  const enlaces: [string, string][] = [
    [`/${locale}/temas`, t('nav.temas')],
    [`/${locale}/simulacro`, t('nav.simulacro')],
    [`/${locale}/repaso`, t('nav.repaso')],
    [`/${locale}/progreso`, t('nav.progreso')],
    [`/${locale}/examen`, t('nav.examen')],
  ];
  return (
    <header className="border-b border-[#e7e2da] bg-white">
      <div className="contenedor flex flex-wrap items-center justify-between gap-2 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-extrabold">
          <img src="/icons/icon.svg" alt="" width={32} height={32} />
          <span>{t('marca')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <SelectorIdioma locale={locale} etiqueta={t('pie.idioma')} />
          <EnlaceCuenta />
        </div>
      </div>
      <nav className="contenedor -mt-1 flex gap-1 overflow-x-auto pb-2 text-sm" aria-label="Principal">
        {enlaces.map(([h, l]) => (
          <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-black/5">{l}</Link>
        ))}
      </nav>
    </header>
  );
}
