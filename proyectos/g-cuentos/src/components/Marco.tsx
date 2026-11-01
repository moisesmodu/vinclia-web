import Link from "next/link";
import { configPais } from "@/lib/config";
import type { Idioma } from "@/lib/catalogo";
import { pref, t } from "@/i18n/textos";
import { BannerAfiliado } from "./BannerAfiliado";
import { Revelar } from "./Revelar";

export function Cabecera({ idioma, alternativa }: { idioma: Idioma; alternativa?: string }) {
  const x = t(idioma);
  const p = pref(idioma);
  const otro = alternativa ?? (idioma === "ca" ? "/" : "/ca");
  return (
    <header className="cabecera">
      <div className="cabecera-isla">
        <Link href={p || "/"} className="flex items-center" aria-label="Lunilla">
          <Logotipo idioma={idioma} className="h-8 min-[400px]:h-9 sm:h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 text-sm font-bold">
          <Link href={`${p}/#muestras`} className="hidden sm:inline cabecera-enlace">{x.nav.muestras}</Link>
          <Link href={idioma === "ca" ? "/ca/contes" : "/cuentos"} className="hidden md:inline cabecera-enlace">{x.nav.ideas}</Link>
          <Link href={otro} className="text-suave py-2" hrefLang={idioma === "ca" ? "es" : "ca"} lang={idioma === "ca" ? "es" : "ca"} aria-label={x.nav.otroIdioma}><span aria-hidden className="min-[400px]:hidden">{idioma === "ca" ? "ES" : "CA"}</span><span className="hidden min-[400px]:inline">{x.nav.otroIdioma}</span></Link>
          <Link href={`${p}/crear`} className="boton !py-2 !pl-4 !pr-2 !min-h-[44px] text-sm whitespace-nowrap">
            {x.nav.crear}
            <span className="hidden min-[400px]:grid w-7 h-7 rounded-full bg-[#F5C84C] place-items-center" aria-hidden><Luna className="w-4 h-4" /></span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Pie({ idioma }: { idioma: Idioma }) {
  const x = t(idioma);
  const p = pref(idioma);
  const c = configPais();
  const ca = idioma === "ca";
  return (
    <footer className="pie-noche envoltura">
      <div className="estrellas" aria-hidden>
        {ESTRELLAS_PIE.map(([l, tp, tam, d], i) => <i key={i} style={{ left: `${l}%`, top: `${tp}%`, ["--t" as string]: `${tam}px`, ["--d" as string]: `${d}s`, ["--r" as string]: `${i * 0.4}s` }} />)}
      </div>
      <div className="relative z-[2] mx-auto max-w-6xl pt-24 pb-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] text-sm">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <Luna className="w-12 h-12 flota" />
              <p className="titulo text-2xl !text-crema">Lunilla</p>
            </div>
            <p className="text-base text-crema">{x.promesa}</p>
            <p className="mt-3">{x.pie.ia}</p>
            <Link href={`${p}/crear`} className="boton-luna mt-6 !min-h-[48px] !py-3 text-base">{x.hero.cta}</Link>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-texto)] font-bold text-base mb-3">{ca ? "La botiga" : "La tienda"}</h2>
            <ul className="space-y-2.5">
              <li><Link href={`${p}/#muestras`}>{x.nav.muestras}</Link></li>
              <li><Link href={ca ? "/ca/contes" : "/cuentos"}>{x.nav.ideas}</Link></li>
              <li><Link href={ca ? "/ca/afiliades" : "/afiliados"}>{x.pie.afiliados}</Link></li>
              <li><a href={`mailto:${c.legal.email}`}>{c.legal.email}</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-texto)] font-bold text-base mb-3">{ca ? "Avisos legals" : "Avisos legales"}</h2>
            <ul className="space-y-2.5">
              <li><Link href={`${p}/legal/aviso-legal`}>{x.pie.legal}</Link></li>
              <li><Link href={`${p}/legal/privacidad`}>{x.pie.privacidad}</Link></li>
              <li><Link href={`${p}/legal/cookies`}>{x.pie.cookies}</Link></li>
              <li><Link href={`${p}/legal/condiciones`}>{x.pie.condiciones}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[rgba(255,248,236,.12)] flex flex-col sm:flex-row gap-3 sm:justify-between text-xs">
          <p>© 2026 {c.legal.titular} · {c.legal.domicilio}</p>
          <p className="font-bold text-[#F5C84C]">{x.sello}</p>
        </div>
      </div>
    </footer>
  );
}

const ESTRELLAS_PIE: [number, number, number, number][] = [[6, 30, 2, 3.2], [18, 62, 3, 4.1], [31, 22, 2, 3.6], [47, 48, 2, 5], [58, 18, 3, 3.3], [71, 40, 2, 4.4], [84, 26, 3, 3.9], [93, 58, 2, 4.8], [39, 80, 2, 3.5], [77, 78, 2, 4.2]];

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

/** Marco común. `noche`: la página empieza con cielo nocturno y la cabecera flota sobre él. */
export function Pagina({ idioma, alternativa, noche, children }: { idioma: Idioma; alternativa?: string; noche?: boolean; children: React.ReactNode }) {
  return (
    <div lang={idioma === "ca" ? "ca" : "es"}>
      <Cabecera idioma={idioma} alternativa={alternativa} />
      <div aria-hidden className={`h-[70px] ${noche ? "bg-[#141B36]" : ""}`} />
      <main>{children}</main>
      <Revelar />
      <Pie idioma={idioma} />
      <BannerAfiliado idioma={idioma} />
    </div>
  );
}
