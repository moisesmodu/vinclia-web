import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca } from '@/lib/datos';
import EnlaceCuenta from './EnlaceCuenta';
import Logo from './Logo';
import CambioIdioma from './CambioIdioma';

export default function Cabecera({ idioma }: { idioma: Idioma }) {
  const d = t(idioma);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="contenedor flex h-14 items-center gap-3">
        <Link href={`/${idioma}`} className="no-underline" aria-label={marca.nombre}>
          <Logo alto={30} />
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href={`/${idioma}/convocatorias`} className="hidden rounded-lg px-2 py-2 text-slate-700 no-underline hover:text-marca sm:inline">{d.convocatorias}</Link>
          <Link href={`/${idioma}/blog`} className="hidden rounded-lg px-2 py-2 text-slate-700 no-underline hover:text-marca sm:inline">Blog</Link>
          <Link href={`/${idioma}/precios`} className="rounded-lg px-2 py-2 text-slate-700 no-underline hover:text-marca">{d.precios}</Link>
          <EnlaceCuenta idioma={idioma} entrar={d.entrar} cuenta={d.cuenta} />
          <CambioIdioma idioma={idioma} />
        </nav>
      </div>
    </header>
  );
}
