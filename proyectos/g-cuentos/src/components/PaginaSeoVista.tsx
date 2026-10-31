import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais, euros, URL_BASE } from "@/lib/config";
import { rutaSeo, seo } from "@/lib/contenido";
import { pref, t } from "@/i18n/textos";
import { Pagina } from "./Marco";

const IMAGEN: Record<string, string> = {
  dormir: "/muestras/leo-y-la-luz-de-la-luna/03.webp",
  ciudad: "/muestras/la-martina-i-els-secrets-de-lleida/04.webp",
  valores: "/muestras/la-martina-i-els-secrets-de-lleida/06.webp",
  hermanito: "/muestras/leo-y-la-luz-de-la-luna/11.webp",
};

export function PaginaSeoVista({ idioma, slug }: { idioma: Idioma; slug: string }) {
  const pagina = seo(idioma).find((p) => p.slug === slug);
  if (!pagina) notFound();
  const x = t(idioma);
  const c = configPais();
  const alt = pagina.alternativa ? `${rutaSeo(idioma === "ca" ? "es" : "ca")}/${pagina.alternativa}` : undefined;
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pagina.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  // Mismo Product que la portada (precio y moneda visibles para Google en cada página SEO).
  const productLd = {
    "@context": "https://schema.org", "@type": "Product",
    name: idioma === "ca" ? "Conte infantil personalitzat Lunilla" : "Cuento infantil personalizado Lunilla",
    description: pagina.descripcion, image: [`${URL_BASE()}${IMAGEN[pagina.coleccion ?? "dormir"]}`],
    brand: { "@type": "Brand", name: "Lunilla" }, url: `${URL_BASE()}${rutaSeo(idioma)}/${pagina.slug}`,
    offers: [
      { "@type": "Offer", price: (c.precios.pdf / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.pdf },
      { "@type": "Offer", price: (c.precios.tapaDura / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.tapaDura, shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" } } },
    ],
  };
  const otras = seo(idioma).filter((p) => p.slug !== slug).slice(0, 6);
  return (
    <Pagina idioma={idioma} alternativa={alt}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqLd, productLd]) }} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl sm:text-4xl mb-4">{pagina.h1}</h1>
        <p className="text-lg text-suave mb-6">{pagina.intro}</p>
        <Image src={IMAGEN[pagina.coleccion ?? "dormir"]} alt="" width={1200} height={1200} className="tarjeta w-full mb-8" />
        <div className="prosa">
          {pagina.secciones.map((s) => (
            <section key={s.h2}>
              <h2>{s.h2}</h2>
              {s.parrafos.map((p) => <p key={p}>{p}</p>)}
              {s.lista && <ul>{s.lista.map((l) => <li key={l}>{l}</li>)}</ul>}
            </section>
          ))}
        </div>
        <div className="tarjeta p-6 my-10 text-center">
          <p className="titulo text-2xl mb-1">{x.hero.cta}</p>
          <p className="text-suave mb-4">PDF {euros(c.precios.pdf, idioma)} · {x.precios.tapaDura} {euros(c.precios.tapaDura, idioma)}</p>
          <Link href={`${pref(idioma)}/crear${pagina.coleccion ? `?coleccion=${pagina.coleccion}` : ""}`} className="boton">{x.hero.cta}</Link>
        </div>
        <h2 className="text-2xl mb-4">{x.faqTitulo}</h2>
        <div className="space-y-3 mb-10">
          {pagina.faq.map(([q, a]) => (
            <details key={q} className="tarjeta p-5"><summary className="font-bold cursor-pointer text-noche">{q}</summary><p className="mt-2 text-suave">{a}</p></details>
          ))}
        </div>
        <nav className="grid sm:grid-cols-2 gap-2 text-sm">
          {otras.map((o) => <Link key={o.slug} href={`${rutaSeo(idioma)}/${o.slug}`} className="underline text-noche">{o.h1}</Link>)}
        </nav>
      </article>
    </Pagina>
  );
}

export function IndiceSeo({ idioma }: { idioma: Idioma }) {
  return (
    <Pagina idioma={idioma} alternativa={rutaSeo(idioma === "ca" ? "es" : "ca")}>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl sm:text-4xl mb-6">{idioma === "ca" ? "Idees de regal i contes per a cada moment" : "Ideas de regalo y cuentos para cada momento"}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {seo(idioma).map((p) => (
            <Link key={p.slug} href={`${rutaSeo(idioma)}/${p.slug}`} className="tarjeta p-5 hover:-translate-y-0.5 transition">
              <h2 className="text-xl mb-1">{p.h1}</h2>
              <p className="text-sm text-suave">{p.descripcion}</p>
            </Link>
          ))}
        </div>
      </div>
    </Pagina>
  );
}
