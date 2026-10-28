import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IDIOMAS, urlBase } from "@/lib/config";
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
  return {
    title: r.titulo,
    description: r.resumen.slice(0, 160),
    alternates: {
      canonical: `/${idioma}/guias/${slug}`,
      languages: Object.fromEntries(IDIOMAS.map((i) => [LOCALE_BCP47[i], `/${i}/guias/${slug}`]))
    }
  };
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
    publisher: { "@type": "Organization", name: d.marca },
    mainEntityOfPage: `${urlBase()}/${idioma}/guias/${slug}`,
    citation: r.fuentes.map((f) => f.url)
  };
  return (
    <article className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="text-sm text-suave"><Link href={`/${idioma}#guias`}><span className="inline-block rtl:rotate-180" aria-hidden>←</span> {d.nav.guias}</Link></nav>
      {r.idiomaContenido !== idioma ? <p className="bg-aviso-claro rounded-xl p-3 text-sm">{d.guia.noTraducida}</p> : null}
      <header>
        <span className={`text-xs font-semibold rounded-full px-2 py-1 ${r.gratis ? "bg-ok-claro text-ok" : "bg-marca-claro text-marca-oscuro"}`}>
          {r.gratis ? d.guia.gratis : d.guia.dePago}
        </span>
        <h1 className="text-3xl font-bold mt-3 leading-tight" lang={LOCALE_BCP47[r.idiomaContenido]}>{r.titulo}</h1>
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
                <div key={x.etiqueta} className="tarjeta p-3">
                  <dt className="text-xs uppercase tracking-wide text-suave">{x.etiqueta}</dt>
                  <dd className="font-semibold mt-1">{x.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {completa ? (
          <GuiaCompleta g={completa} idioma={idioma} d={d} />
        ) : (
          <CargarGuia slug={slug} idioma={idioma} d={d} />
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
            <li key={o.slug}><Link className="tarjeta p-3 block" href={`/${idioma}/guias/${o.slug}`}>{o.titulo}</Link></li>
          ))}
        </ul>
      </section>
    </article>
  );
}
