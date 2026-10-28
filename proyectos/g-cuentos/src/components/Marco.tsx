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
    <header className="sticky top-0 z-20 bg-crema/90 backdrop-blur border-b border-[#efe4cf]">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
        <Link href={p || "/"} className="flex items-center" aria-label="Lunilla">
          <Logotipo idioma={idioma} className="h-11 w-auto" />
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
    <footer className="mt-20 border-t border-[#efe4cf] bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm text-suave">
        <div>
          <Logotipo idioma={idioma} className="h-10 w-auto mb-2" />
          <p>{x.promesa}</p>
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
      <p className="text-center text-sm font-bold text-noche pb-8 px-4">{x.sello}</p>
    </footer>
  );
}

// Lunilla según marcas/logos/g-cuentos-icono.svg (sin redibujar: mismas formas y colores).
export function Luna({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden>
      <path d="M34.2 5.9A23 23 0 1 0 41 47A21 21 0 0 1 34.2 5.9Z" fill="#F5C84C" />
      <circle cx="13.5" cy="24" r="2.4" fill="#1B2444" /><circle cx="10.5" cy="31" r="2.6" fill="#F7D6E0" />
      <path d="M13 35q4 3 8 0" stroke="#1B2444" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M9 40q8 6 17 3" stroke="#2B3A67" strokeWidth="5.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Logotipo horizontal de marcas/logos/g-cuentos.svg, en línea para que use Baloo 2 y Nunito de la página.
export function Logotipo({ idioma, className = "" }: { idioma: Idioma; className?: string }) {
  return (
    <svg viewBox="0 0 260 56" className={className} role="img" aria-label="Lunilla">
      <path d="M34.2 5.9A23 23 0 1 0 41 47A21 21 0 0 1 34.2 5.9Z" fill="#F5C84C" />
      <circle cx="13.5" cy="24" r="2.4" fill="#1B2444" /><circle cx="10.5" cy="31" r="2.6" fill="#F7D6E0" />
      <path d="M13 35q4 3 8 0" stroke="#1B2444" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M9 40q8 6 17 3" stroke="#2B3A67" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <text x="68" y="30" fontFamily="var(--font-baloo), Baloo 2, sans-serif" fontWeight="700" fontSize="28" fill="currentColor" className="text-noche">Lunilla</text>
      <text x="68" y="48" fontFamily="var(--font-nunito), Nunito, sans-serif" fontSize="12" fill="currentColor" opacity="0.7" className="text-noche">{idioma === "ca" ? "contes personalitzats" : "cuentos personalizados"}</text>
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
