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
      <header className="sticky top-0 z-20 border-b border-[#EADFCF] bg-crema/95 backdrop-blur">
        <div className="contenedor flex h-14 items-center gap-2">
          <Link href={l('')} className="no-underline" aria-label={marca.nombre}><Logo alto={30} /></Link>
          <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
            <Link href={l('/avui')} className="hidden rounded-lg px-2 py-2 text-nit no-underline hover:text-marca sm:inline">{d.nav.avui}</Link>
            <Link href={l('/practica')} className="hidden rounded-lg px-2 py-2 text-nit no-underline hover:text-marca sm:inline">{d.nav.practica}</Link>
            <Link href={l('/simulacre')} className="hidden rounded-lg px-2 py-2 text-nit no-underline hover:text-marca sm:inline">{d.nav.simulacre}</Link>
            <Link href={l('/preus')} className="rounded-lg px-2 py-2 text-nit no-underline hover:text-marca">{d.nav.preus}</Link>
            <EnlaceCuenta idioma={idioma} entrar={d.nav.entrar} cuenta={d.nav.compte} />
            <CambioIdioma idioma={idioma} />
          </nav>
        </div>
      </header>
      <BarraMovil idioma={idioma} etiquetas={{ avui: d.nav.avui, practica: d.nav.practica, escriure: d.nav.escriure, simulacre: d.nav.simulacre, oral: d.nav.oral }} />
    </>
  );
}
