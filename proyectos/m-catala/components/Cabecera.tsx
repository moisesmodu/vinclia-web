import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca } from '@/lib/datos';
import EnlaceCuenta from './EnlaceCuenta';
import Logo from './Logo';
import CambioIdioma from './CambioIdioma';
import BarraMovil from './BarraMovil';

export default function Cabecera({ idioma }: { idioma: Idioma }) {
  const d = t(idioma);
  const l = (s: string) => `/${idioma}${s}`;
  return (
    <>
      <a href="#contingut" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[6px] focus:bg-paper focus:px-3 focus:py-2">{idioma === 'ca' ? 'Anar al contingut' : 'Ir al contenido'}</a>
      <header className="sticky top-0 z-20 border-b border-linia bg-paper/95 backdrop-blur-sm">
        <div className="contenedor flex h-14 items-center gap-1">
          <Link href={l('')} className="mr-auto no-underline" aria-label={marca.nombre}><Logo alto={28} /></Link>
          <nav className="flex items-center gap-0.5 text-[15px] font-semibold" aria-label={idioma === 'ca' ? 'Principal' : 'Principal'}>
            <Link href={l('/avui')} className="hidden rounded-[6px] px-2.5 py-2 text-tinta no-underline hover:bg-boli-tenue sm:inline">{d.nav.avui}</Link>
            <Link href={l('/practica')} className="hidden rounded-[6px] px-2.5 py-2 text-tinta no-underline hover:bg-boli-tenue sm:inline">{d.nav.practica}</Link>
            <Link href={l('/simulacre')} className="hidden rounded-[6px] px-2.5 py-2 text-tinta no-underline hover:bg-boli-tenue sm:inline">{d.nav.simulacre}</Link>
            <Link href={l('/preus')} className="rounded-[6px] px-2.5 py-2 text-tinta no-underline hover:bg-boli-tenue">{d.nav.preus}</Link>
            <EnlaceCuenta idioma={idioma} entrar={d.nav.entrar} cuenta={d.nav.compte} />
            <CambioIdioma idioma={idioma} />
          </nav>
        </div>
      </header>
      <BarraMovil idioma={idioma} etiquetas={{ avui: d.nav.avui, practica: d.nav.practica, escriure: d.nav.escriure, simulacre: d.nav.simulacre, oral: d.nav.oral }} />
    </>
  );
}
