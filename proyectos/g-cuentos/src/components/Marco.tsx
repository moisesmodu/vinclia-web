import Link from "next/link";
import { configPais } from "@/lib/config";
import type { Idioma } from "@/lib/catalogo";
import { pref, t } from "@/i18n/textos";
import { BannerAfiliado } from "./BannerAfiliado";

export function Cabecera({ idioma, alternativa }: { idioma: Idioma; alternativa?: string }) {
  const x = t(idioma);
  const p = pref(idioma);
  const otro = alternativa ?? (idioma === "ca" ? "/" : "/ca");
  return (
    <header className="sticky top-0 z-20 bg-crema/90 backdrop-blur border-b border-[#eadfcb]">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
        <Link href={p || "/"} className="flex items-center gap-2" aria-label="Lunilla">
          <Luna className="w-8 h-8" />
          <span className="titulo text-2xl">Lunilla</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-bold">
          <Link href={`${p}/#muestras`} className="hidden sm:inline text-noche">{x.nav.muestras}</Link>
          <Link href={idioma === "ca" ? "/ca/contes" : "/cuentos"} className="hidden md:inline text-noche">{x.nav.ideas}</Link>
          <Link href={otro} className="text-suave" hrefLang={idioma === "ca" ? "es" : "ca"}>{x.nav.otroIdioma}</Link>
          <Link href={`${p}/crear`} className="boton !py-2 !px-4 !min-h-0 text-sm">{x.nav.crear}</Link>
        </nav>
      </div>
    </header>
  );
}

export function Pie({ idioma }: { idioma: Idioma }) {
  const x = t(idioma);
  const p = pref(idioma);
  const c = configPais();
  return (
    <footer className="mt-20 border-t border-[#eadfcb] bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm text-suave">
        <div>
          <div className="flex items-center gap-2 mb-2"><Luna className="w-6 h-6" /><span className="titulo text-lg">Lunilla</span></div>
          <p>{x.lema}.</p>
          <p className="mt-2">{x.pie.ia}</p>
        </div>
        <ul className="space-y-2">
          <li><Link href={`${p}/legal/aviso-legal`}>{x.pie.legal}</Link></li>
          <li><Link href={`${p}/legal/privacidad`}>{x.pie.privacidad}</Link></li>
          <li><Link href={`${p}/legal/cookies`}>{x.pie.cookies}</Link></li>
          <li><Link href={`${p}/legal/condiciones`}>{x.pie.condiciones}</Link></li>
        </ul>
        <ul className="space-y-2">
          <li><Link href={idioma === "ca" ? "/ca/afiliades" : "/afiliados"}>{x.pie.afiliados}</Link></li>
          <li><Link href={idioma === "ca" ? "/ca/contes" : "/cuentos"}>{x.nav.ideas}</Link></li>
          <li><a href={`mailto:${c.legal.email}`}>{c.legal.email}</a></li>
          <li>© 2026 {c.legal.titular} · {c.legal.domicilio}</li>
        </ul>
      </div>
    </footer>
  );
}

export function Luna({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#29395f" />
      <path d="M20.5 7.5a9.5 9.5 0 1 0 4 13.6A8 8 0 0 1 20.5 7.5Z" fill="#f2c96d" />
      <circle cx="9" cy="9" r="1" fill="#fbf6ec" /><circle cx="24" cy="25" r="0.8" fill="#fbf6ec" />
    </svg>
  );
}

export function Pagina({ idioma, alternativa, children }: { idioma: Idioma; alternativa?: string; children: React.ReactNode }) {
  return (
    <div lang={idioma === "ca" ? "ca" : "es"}>
      <Cabecera idioma={idioma} alternativa={alternativa} />
      <main>{children}</main>
      <Pie idioma={idioma} />
      <BannerAfiliado idioma={idioma} />
    </div>
  );
}
