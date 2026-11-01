import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais, euros, URL_BASE } from "@/lib/config";
import { rutaSeo, seo } from "@/lib/contenido";
import { CUENTOS_MUESTRA } from "@/lib/muestras-contenido";
import { pref, t } from "@/i18n/textos";
import { Icono } from "./inicio/Iconos";
import { AvisoCampana, BarraMovil } from "./inicio/Pequenos";
import { Luna, Pagina } from "./Marco";

const IMAGEN: Record<string, string> = {
  dormir: "/muestras/leo-y-la-luz-de-la-luna/03.webp",
  ciudad: "/muestras/la-martina-i-els-secrets-de-lleida/04.webp",
  valores: "/muestras/la-martina-i-els-secrets-de-lleida/06.webp",
  hermanito: "/muestras/leo-y-la-luz-de-la-luna/11.webp",
};

const L = {
  es: {
    inicio: "Inicio", ideas: "Ideas de regalo",
    confianza: ["Vista previa gratis", "Sin fotos del niño", "PDF en menos de 2 horas"],
    muestraOjo: "Así es por dentro", muestraTitulo: "Lee un cuento entero antes de decidir",
    muestraSub: "Página a página, con las mismas plantillas, protagonistas e imprenta que tendrá el suyo.", muestraCta: "Leer el cuento de muestra",
    regaloTitulo: "Su cuento, listo para regalar",
    regaloSub: "Escribe su nombre y mira la portada, la dedicatoria y 3 páginas. Solo pagas si te gusta.",
    fechas: (n: string, r: string) => `Tapa dura: pídelo hasta el ${n} para Navidad y hasta el ${r} para Reyes. PDF: siempre a tiempo.`,
    garantia: "Si algo no te gusta, te lo rehacemos gratis una vez.",
    mas: "Más ideas", indiceTitulo: "Ideas de regalo y cuentos para cada momento",
    indiceSub: "Navidad, Reyes, cumpleaños, un hermanito que llega o un miedo que cuesta: cada página explica qué cuento encaja y por qué.",
  },
  ca: {
    inicio: "Inici", ideas: "Idees de regal",
    confianza: ["Vista prèvia gratis", "Sense fotos de l'infant", "PDF en menys de 2 hores"],
    muestraOjo: "Així és per dins", muestraTitulo: "Llegeix un conte sencer abans de decidir",
    muestraSub: "Pàgina a pàgina, amb les mateixes plantilles, protagonistes i impremta que tindrà el seu.", muestraCta: "Llegir el conte de mostra",
    regaloTitulo: "El seu conte, a punt per regalar",
    regaloSub: "Escriu el seu nom i mira la portada, la dedicatòria i 3 pàgines. Només pagues si t'agrada.",
    fechas: (n: string, r: string) => `Tapa dura: demana'l fins al ${n} per Nadal i fins al ${r} per Reis. PDF: sempre a temps.`,
    garantia: "Si alguna cosa no t'agrada, te'l refem gratis una vegada.",
    mas: "Més idees", indiceTitulo: "Idees de regal i contes per a cada moment",
    indiceSub: "Nadal, el tió, Reis, aniversaris, un germanet que arriba o una por que costa: cada pàgina explica quin conte hi encaixa i per què.",
  },
};

function fecha(iso: string, idioma: Idioma) {
  return new Intl.DateTimeFormat(idioma === "ca" ? "ca-ES" : "es-ES", { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));
}

function Migas({ idioma, actual }: { idioma: Idioma; actual?: string }) {
  const k = L[idioma];
  return (
    <nav aria-label={idioma === "ca" ? "Ruta" : "Ruta de navegación"} className="text-sm mb-5 opacity-85">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li><Link href={pref(idioma) || "/"} className="underline decoration-1">{k.inicio}</Link></li>
        <li aria-hidden>›</li>
        {actual ? (
          <>
            <li><Link href={rutaSeo(idioma)} className="underline decoration-1">{k.ideas}</Link></li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="truncate max-w-[16rem] sm:max-w-none">{actual}</li>
          </>
        ) : <li aria-current="page">{k.ideas}</li>}
      </ol>
    </nav>
  );
}

export function PaginaSeoVista({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const pagina = seo(idioma).find((p) => p.slug === slug);
  if (!pagina) notFound();
  const x = t(idioma);
  const k = L[idioma];
  const c = configPais();
  const b = URL_BASE();
  const url = `${b}${rutaSeo(idioma)}/${pagina.slug}`;
  const alt = pagina.alternativa ? `${rutaSeo(idioma === "ca" ? "es" : "ca")}/${pagina.alternativa}` : undefined;
  const crear = `${pref(idioma)}/crear${pagina.coleccion ? `?coleccion=${pagina.coleccion}` : ""}`;
  const imagen = IMAGEN[pagina.coleccion ?? "dormir"];
  const muestra = CUENTOS_MUESTRA[pagina.coleccion === "ciudad" || pagina.coleccion === "valores" ? "la-martina-i-els-secrets-de-lleida" : "leo-y-la-luz-de-la-luna"];
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pagina.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  // Mismo Product que la portada (precio y moneda visibles para Google en cada página SEO).
  const productLd = {
    "@context": "https://schema.org", "@type": "Product",
    name: idioma === "ca" ? "Conte infantil personalitzat Lunilla" : "Cuento infantil personalizado Lunilla",
    description: pagina.descripcion, image: [`${b}${imagen}`],
    brand: { "@type": "Brand", name: "Lunilla" }, url,
    offers: [
      { "@type": "Offer", price: (c.precios.pdf / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.pdf },
      { "@type": "Offer", price: (c.precios.tapaDura / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.tapaDura, shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" } } },
    ],
  };
  const migasLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: k.inicio, item: `${b}${pref(idioma) || "/"}` },
      { "@type": "ListItem", position: 2, name: k.ideas, item: `${b}${rutaSeo(idioma)}` },
      { "@type": "ListItem", position: 3, name: pagina.h1, item: url },
    ],
  };
  const otras = seo(idioma).filter((p) => p.slug !== slug).slice(0, 4);
  return (
    <Pagina idioma={idioma} alternativa={alt}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqLd, productLd, migasLd]) }} />
      <AvisoCampana idioma={idioma} navidad={c.fechasLimite.navidadTapaDura} reyes={c.fechasLimite.reyesTapaDura} />

      <header className="cielo envoltura">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.25fr_1fr] items-center pt-8 pb-20 lg:pt-12 lg:pb-24 relative z-[1]">
          <div className="min-w-0">
            <Migas idioma={idioma} actual={pagina.h1} />
            <h1 className="text-[2rem] sm:text-5xl leading-[1.06] mb-4">{pagina.h1}</h1>
            <p className="text-lg opacity-90 mb-6 max-w-[38rem]">{pagina.intro}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={crear} className="boton-luna">{x.hero.cta}</Link>
              <p className="text-sm opacity-85">PDF <b className="acento">{euros(c.precios.pdf, idioma)}</b> · {x.precios.tapaDura.toLowerCase()} <b className="acento">{euros(c.precios.tapaDura, idioma)}</b> {x.precios.envio}</p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm font-bold">
              {k.confianza.map((txt) => <li key={txt} className="flex items-center gap-2"><span className="acento" aria-hidden>✓</span>{txt}</li>)}
            </ul>
          </div>
          <div className="hidden sm:block justify-self-center w-full max-w-[420px]">
            <Image src={imagen} alt="" width={900} height={900} priority sizes="(max-width: 1024px) 60vw, 420px" className="w-full rounded-[28px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] rotate-[1.5deg]" />
          </div>
        </div>
      </header>

      <article className="envoltura">
        <div className="mx-auto max-w-3xl pt-6 pb-4">
          <div className="prosa prosa-seo">
            {pagina.secciones.map((s) => (
              <section key={s.h2}>
                <h2>{s.h2}</h2>
                {s.parrafos.map((p) => <p key={p}>{p}</p>)}
                {s.lista && <ul>{s.lista.map((l) => <li key={l}>{l}</li>)}</ul>}
              </section>
            ))}
          </div>
        </div>
      </article>

      {/* Muestra real: tres páginas del cuento de ejemplo y enlace al cuento entero */}
      <section className="envoltura">
        <div className="mx-auto max-w-5xl py-10">
          <p className="ojo mb-2">{k.muestraOjo}</p>
          <h2 className="text-2xl sm:text-3xl mb-2">{k.muestraTitulo}</h2>
          <p className="text-suave mb-6 max-w-2xl">{k.muestraSub}</p>
          <Link href={`${pref(idioma)}/muestras/${muestra.slug}`} className="grid grid-cols-3 gap-3 sm:gap-5 group" aria-label={`${k.muestraCta}: ${muestra.titulo}`}>
            {["00", "04", "09"].map((n, i) => (
              <span key={n} className={`block overflow-hidden rounded-2xl shadow-[0_18px_40px_-24px_#1B2444] transition-transform duration-300 group-hover:-translate-y-1 ${i === 1 ? "sm:translate-y-3" : ""}`}>
                <Image src={`/muestras/${muestra.slug}/${n}-p.webp`} alt="" width={480} height={480} className="w-full aspect-square object-cover" />
              </span>
            ))}
          </Link>
          <Link href={`${pref(idioma)}/muestras/${muestra.slug}`} className="boton-sec mt-7">{k.muestraCta}: {muestra.titulo}</Link>
        </div>
      </section>

      {/* Cierre de regalo */}
      <section className="envoltura">
        <div className="mx-auto max-w-5xl">
          <div className="cielo rounded-[32px] px-6 py-10 sm:px-12 sm:py-12 grid gap-6 sm:grid-cols-[auto_1fr] items-center regalo-cierre">
            <Luna className="w-16 h-16 sm:w-24 sm:h-24 relative z-[1]" />
            <div className="relative z-[1]">
              <h2 className="text-3xl sm:text-4xl mb-2">{k.regaloTitulo}</h2>
              <p className="opacity-90 mb-5 max-w-xl">{k.regaloSub}</p>
              <Link href={crear} className="boton-luna">{x.hero.cta}</Link>
              <p className="text-sm opacity-85 mt-5">{k.fechas(fecha(c.fechasLimite.navidadTapaDura, idioma), fecha(c.fechasLimite.reyesTapaDura, idioma))}</p>
              <p className="text-sm opacity-85 mt-1 flex items-center gap-2"><span className="acento" aria-hidden><Icono.corazon /></span>{k.garantia}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="envoltura">
        <div className="mx-auto max-w-3xl py-12">
          <h2 className="text-2xl sm:text-3xl mb-5">{x.faqTitulo}</h2>
          <div className="space-y-3">
            {pagina.faq.map(([q, a]) => (
              <details key={q} className="tarjeta p-5 group">
                <summary className="font-bold cursor-pointer text-noche list-none flex justify-between gap-4">{q}<span aria-hidden className="group-open:rotate-45 transition-transform">+</span></summary>
                <p className="mt-2 text-suave">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="envoltura">
        <div className="mx-auto max-w-5xl pb-6">
          <h2 className="text-2xl mb-5">{k.mas}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otras.map((o) => <TarjetaIdea key={o.slug} idioma={idioma} slug={o.slug} titulo={o.h1} coleccion={o.coleccion} />)}
          </div>
        </div>
      </section>
      <div className="h-20 md:hidden" aria-hidden />
      <BarraMovil idioma={idioma} desde={euros(c.precios.pdf, idioma)} />
    </Pagina>
  );
}

function TarjetaIdea({ idioma, slug, titulo, texto, coleccion }: { idioma: Idioma; slug: string; titulo: string; texto?: string; coleccion?: string }) {
  return (
    <Link href={`${rutaSeo(idioma)}/${slug}`} className="tarjeta overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      <Image src={(IMAGEN[coleccion ?? "dormir"]).replace(/\.webp$/, "-p.webp")} alt="" width={480} height={480} className="w-full aspect-[16/10] object-cover" />
      <span className="p-5 flex-1">
        <span className="block titulo text-lg leading-snug mb-1">{titulo}</span>
        {texto && <span className="block text-sm text-suave">{texto}</span>}
      </span>
    </Link>
  );
}

export function IndiceSeo({ idioma }: { idioma: Idioma }) {
  const k = L[idioma];
  return (
    <Pagina idioma={idioma} alternativa={rutaSeo(idioma === "ca" ? "es" : "ca")}>
      <header className="cielo envoltura">
        <div className="mx-auto max-w-6xl pt-8 pb-20 relative z-[1]">
          <Migas idioma={idioma} />
          <h1 className="text-[2rem] sm:text-5xl leading-[1.06] mb-3 max-w-3xl">{k.indiceTitulo}</h1>
          <p className="text-lg opacity-90 max-w-2xl">{k.indiceSub}</p>
        </div>
      </header>
      <div className="envoltura">
        <div className="mx-auto max-w-6xl py-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seo(idioma).map((p) => <TarjetaIdea key={p.slug} idioma={idioma} slug={p.slug} titulo={p.h1} texto={p.descripcion} coleccion={p.coleccion} />)}
        </div>
      </div>
    </Pagina>
  );
}
