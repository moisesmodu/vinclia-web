import Link from "next/link";
import type { Dicc } from "@/lib/i18n";
import SelectorIdioma from "./SelectorIdioma";

export default function Cabecera({ idioma, d }: { idioma: string; d: Dicc }) {
  return (
    <header className="border-b border-linea bg-white/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2">
        <Link href={`/${idioma}`} className="flex items-center gap-2 font-bold text-marca-oscuro min-w-0">
          <img src="/iconos/icono.svg" alt="" width={28} height={28} />
          <span dir="ltr" className="truncate text-[15px] sm:text-base">{d.marca}</span>
        </Link>
        <nav className="ms-auto flex items-center gap-0.5 text-sm shrink-0">
          <Link href={`/${idioma}#guias`} className="px-2 py-2 hidden sm:inline">{d.nav.guias}</Link>
          <Link href={`/${idioma}/precios`} className="px-1.5 py-2 hidden sm:inline">{d.nav.precios}</Link>
          <Link href={`/${idioma}/cuenta`} className="px-1.5 py-2" aria-label={d.nav.cuenta}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
          </Link>
          <SelectorIdioma idioma={idioma} etiqueta={d.nav.idioma} />
        </nav>
      </div>
    </header>
  );
}
