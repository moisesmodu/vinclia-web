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
    <header className="border-b border-[#EADFCD] bg-white">
      <div className="contenedor flex items-center justify-between gap-2 py-2.5">
        <Link href={`/${locale}`} className="flex items-center" aria-label={`${t('marca')} · ${t('marcaPor')}`}>
          <img src="/marca/logo.svg" alt={`${t('marca')} · ${t('marcaPor')}`} width={219} height={34} className="h-7 w-auto sm:h-9" dir="ltr" />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
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
