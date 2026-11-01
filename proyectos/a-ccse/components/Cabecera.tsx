import Link from 'next/link';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { SelectorIdioma, EnlaceCuenta, NavPrincipal } from './CabeceraCliente';
import { Logo } from './Logo';

export function Cabecera({ locale }: { locale: Locale }) {
  const t = traductor(locale);
  const enlaces: [string, string][] = [
    [`/${locale}/temas`, t('nav.temas')],
    [`/${locale}/simulacro`, t('nav.simulacro')],
    [`/${locale}/repaso`, t('nav.repaso')],
    [`/${locale}/progreso`, t('nav.progreso')],
    [`/${locale}/examen`, t('nav.examen')],
    [`/${locale}/precio`, t('nav.precioCorto')],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[#EADFCD] bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="contenedor flex items-center justify-between gap-2 py-2.5">
        <Link href={`/${locale}`} className="flex items-center rounded-lg" aria-label={`${t('marca')} · ${t('marcaPor')}`}>
          <Logo por={t('marcaPor')} />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <SelectorIdioma locale={locale} etiqueta={t('pie.idioma')} />
          <EnlaceCuenta />
        </div>
      </div>
      <NavPrincipal enlaces={enlaces} />
    </header>
  );
}
