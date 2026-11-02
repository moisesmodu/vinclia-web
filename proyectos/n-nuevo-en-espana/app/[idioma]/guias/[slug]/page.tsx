import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IDIOMAS, config, urlBase } from "@/lib/config";
import { dicc, fechaLarga, LOCALE_BCP47 } from "@/lib/i18n";
import { guia, resumen, slugsGuias } from "@/lib/contenido";
import GuiaCompleta from "@/components/GuiaCompleta";
import CargarGuia from "@/components/CargarGuia";

export function generateStaticParams() {
  return IDIOMAS.flatMap((idioma) => slugsGuias().map((slug) => ({ idioma, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ idioma: string; slug: string }> }): Promise<Metadata> {
  const { idioma, slug } = await params;
  const r = resumen(slug, idioma);
  if (!r) return {};
  // Solo los idiomas con guía propia entran en hreflang. En catalán la guía se muestra en castellano: su canonical es
  // la versión en castellano para no competir con ella como contenido duplicado.
  const propios = IDIOMAS.filter((i) => resumen(slug, i)?.idiomaContenido === i);
  const canonical = `/${r.idiomaContenido}/guias/${slug}`;
  return {
    title: r.tituloSeo ? { absolute: r.tituloSeo } : r.titulo,
    description: r.descripcionSeo ?? recortar(r.resumen, 155),
    alternates: {
      canonical,
      languages: { ...Object.fromEntries(propios.map((i) => [LOCALE_BCP47[i], `/${i}/guias/${slug}`])), "x-default": `/es/guias/${slug}` }
    },
    openGraph: { title: r.tituloSeo ?? r.titulo, description: r.descripcionSeo ?? recortar(r.resumen, 155), type: "article", siteName: dicc(idioma).marca, locale: LOCALE_BCP47[idioma], url: `/${idioma}/guias/${slug}`, images: [{ url: `/${idioma}/opengraph-image`, width: 1200, height: 630 }] }
  };
}

function recortar(t: string, n: number): string {
  if (t.length <= n) return t;
  const corte = t.slice(0, n - 1);
  return corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:.]$/, "") + "…";
}

export default async function PaginaGuia({ params }: { params: Promise<{ idioma: string; slug: string }> }) {
  const { idioma, slug } = await params;
  const r = resumen(slug, idioma);
  if (!r) notFound();
  const d = dicc(idioma);
  const completa = r.gratis ? guia(slug, idioma)!.guia : null;
  const otras = slugsGuias().filter((s) => s !== slug).map((s) => resumen(s, idioma)!);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: r.titulo,
    description: r.resumen,
    inLanguage: LOCALE_BCP47[r.idiomaContenido],
    dateModified: r.actualizado,
    isAccessibleForFree: r.gratis,
    author: { "@type": "Organization", name: d.marca, url: urlBase() },
    publisher: { "@type": "Organization", name: d.marca, url: urlBase(), logo: `${urlBase()}/iconos/icono-512.png` },
    mainEntityOfPage: `${urlBase()}/${idioma}/guias/${slug}`,
    citation: r.fuentes.map((f) => f.url)
  };
  return (
    <article className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-sm text-suave"><Link href={`/${idioma}#guias`}><span className="inline-block rtl:rotate-180" aria-hidden>←</span> {d.nav.guias}</Link></nav>
      {r.idiomaContenido !== idioma ? <p className="bg-aviso-claro rounded-xl p-3 text-sm">{d.guia.noTraducida}</p> : null}
      <header>
        <span className={`sello ${r.gratis ? "bg-ok-claro text-ok" : "bg-marca-claro text-marca-oscuro"}`}>
          {r.gratis ? d.guia.gratis : d.guia.dePago}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3 leading-tight" lang={LOCALE_BCP47[r.idiomaContenido]}>{r.titulo}</h1>
        <p className="text-sm text-suave mt-2">{d.guia.actualizado} {fechaLarga(r.actualizado, idioma)}</p>
      </header>

      <div lang={LOCALE_BCP47[r.idiomaContenido]} className="space-y-6">
        <section className="tarjeta p-5">
          <h2 className="font-bold text-lg mb-2">{d.guia.resumen}</h2>
          <p className="leading-relaxed">{r.resumen}</p>
          <h3 className="font-semibold mt-4">{d.guia.paraQuien}</h3>
          <p className="text-suave">{r.paraQuien}</p>
        </section>

        {r.datosClave?.length ? (
          <section>
            <h2 className="sr-only">{d.guia.datosClave}</h2>
            <dl className="grid grid-cols-2 gap-2">
              {r.datosClave.map((x) => (
                <div key={x.etiqueta} className="tarjeta p-3 border-s-4 border-s-marca">
                  <dt className="text-sm text-suave">{x.etiqueta}</dt>
                  <dd className="font-semibold mt-1 cifras">{x.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {slug === "nacionalidad" && config.enlaces?.ccse ? (
          <aside className="tarjeta p-5 border-2 border-marca">
            <h2 className="font-bold text-lg">{d.guia.ccseTitulo}</h2>
            <p className="mt-1 text-suave">{d.guia.ccseTexto}</p>
            <a className="boton inline-block mt-3" href={config.enlaces.ccse} target="_blank" rel="noopener">{d.guia.ccseBoton}</a>
          </aside>
        ) : null}

        {completa ? (
          <GuiaCompleta g={completa} idioma={idioma} d={d} oferta />
        ) : (
          <CargarGuia slug={slug} idioma={idioma} d={d} cuenta={r.cuenta} />
        )}

        <section className="tarjeta p-5">
          <h2 className="font-bold text-lg mb-2">{d.guia.fuentes}</h2>
          <ul className="space-y-2 text-sm">
            {r.fuentes.map((f) => (
              <li key={f.url}>
                <a className="enlace break-words" href={f.url} target="_blank" rel="noopener noreferrer">{f.nombre}</a>
                <span className="text-suave"> · {d.guia.consultado} {fechaLarga(f.consultado, idioma)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-suave mt-4">{d.aviso.largo}</p>
        </section>
      </div>

      <section className="no-imprimir">
        <h2 className="font-bold text-lg mb-2">{d.guia.otrasGuias}</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {otras.map((o) => (
            <li key={o.slug}><Link className="tarjeta tarjeta-enlace p-3 block h-full" href={`/${idioma}/guias/${o.slug}`}>{o.titulo}</Link></li>
          ))}
        </ul>
      </section>
    </article>
  );
}
