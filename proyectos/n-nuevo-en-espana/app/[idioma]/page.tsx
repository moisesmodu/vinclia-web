import Link from "next/link";
import { dicc, LOCALE_BCP47, NOMBRES_IDIOMA } from "@/lib/i18n";
import { guia, preguntas, resumen, slugsGuias } from "@/lib/contenido";
import { config, IDIOMAS, SITUACIONES, urlBase } from "@/lib/config";
import PorDondeEmpiezo from "@/components/PorDondeEmpiezo";
import TarjetaGuia from "@/components/TarjetaGuia";

// Preguntas que más se buscan (SEO.md y AUDITORIA.md): van primero en «Lo más buscado» si existen en el idioma.
const PRIORIDAD = [
  "cita-previa-nie-tie-huellas",
  "empadronarse-sin-contrato-de-alquiler",
  "como-renovar-residencia-2027",
  "numero-seguridad-social-sin-nie",
  "caducidad-autorizacion-regularizacion-modificacion-articulo-191"
];

export default async function Inicio({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const guias = slugsGuias().map((s) => resumen(s, idioma)!).filter(Boolean);
  const titulos = Object.fromEntries(guias.map((g) => [g.slug, g.titulo]));
  const gratis = guia(config.guiaGratis, idioma);
  const muestra = gratis?.guia.checklist.slice(0, 4) ?? [];
  const pos = (s: string) => (PRIORIDAD.indexOf(s) + 1 || 99);
  const buscadas = preguntas(idioma).sort((a, b) => pos(a.slug) - pos(b.slug)).slice(0, 4);
  const ld = [
    { "@context": "https://schema.org", "@type": "WebSite", name: d.marca, url: `${urlBase()}/${idioma}`, inLanguage: LOCALE_BCP47[idioma], description: d.meta.descripcion },
    { "@context": "https://schema.org", "@type": "Organization", name: d.marca, url: urlBase(), logo: `${urlBase()}/iconos/icono-512.png`, slogan: d.lema,
      address: { "@type": "PostalAddress", addressLocality: "Lleida", addressCountry: "ES" } }
  ];

  return (
    <div className="space-y-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section className="pt-2 grid sm:grid-cols-[1fr_14rem] gap-8 items-center">
        <div>
          <Link href={`/${idioma}/guias/renovacion-residencia`} className="sello bg-marca-claro text-marca-oscuro mb-5 hover:underline">
            {d.inicio.novedad} <span className="inline-block rtl:rotate-180" aria-hidden>→</span>
          </Link>
          <h1 className="text-[2.15rem] sm:text-5xl font-bold leading-[1.08]">{d.inicio.titulo}</h1>
          <p className="mt-4 text-lg text-suave max-w-[60ch]">{d.inicio.subtitulo}</p>
          <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <Link href={`/${idioma}/guias/${config.guiaGratis}`} className="boton boton-marca sm:whitespace-nowrap">{d.inicio.ctaGratis}</Link>
            <Link href={`/${idioma}#guias`} className="enlace font-semibold text-center py-2">{d.inicio.ctaGuias} <span className="inline-block rtl:rotate-180" aria-hidden>→</span></Link>
          </div>
          <p className="mt-4 text-sm text-suave">{d.aviso.corto}</p>
        </div>

        {/* Vista previa real de la guía gratis: los primeros puntos de su lista de comprobación. */}
        {gratis ? (
          <Link href={`/${idioma}/guias/${config.guiaGratis}#lista`} className="relative block mx-auto w-full max-w-[17rem] sm:max-w-none" aria-label={titulos[config.guiaGratis]}>
            <div className="papel absolute inset-0 translate-x-3 translate-y-3 rotate-[3deg] opacity-70" aria-hidden />
            <div className="papel relative p-4 rotate-[-1.5deg]" lang={LOCALE_BCP47[gratis.idiomaContenido]}>
              <p className="sello bg-ok-claro text-ok">{d.guia.gratis}</p>
              <p className="font-bold mt-2 leading-snug">{titulos[config.guiaGratis]}</p>
              <div className="h-1.5 bg-linea rounded-full mt-3 overflow-hidden" aria-hidden><div className="h-full w-1/2 bg-ok" /></div>
              <ul className="mt-3 space-y-2 text-sm" aria-hidden>
                {muestra.map((c, i) => (
                  <li key={c.id} className="flex gap-2 items-start">
                    <span className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 grid place-items-center ${i < 2 ? "bg-ok border-ok" : "border-linea"}`}>
                      {i < 2 ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><path d="M5 12l5 5 9-10"/></svg> : null}
                    </span>
                    <span className={`line-clamp-2 ${i < 2 ? "text-suave line-through decoration-1" : ""}`}>{c.texto}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        ) : null}
      </section>

      <section className="border-y border-linea py-5">
        <dl className="grid sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x sm:rtl:divide-x-reverse divide-linea">
          {d.inicio.puntos.map((p) => (
            <div key={p.titulo} className="sm:px-5 first:ps-0 last:pe-0">
              <dt className="font-semibold">{p.titulo}</dt>
              <dd className="text-sm text-suave mt-1">{p.texto}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label={d.nav.idioma}>
          {IDIOMAS.map((i) => (
            <li key={i}>
              <Link href={`/${i}`} hrefLang={LOCALE_BCP47[i]} lang={LOCALE_BCP47[i]} aria-current={i === idioma ? "page" : undefined}
                className={`sello text-sm border ${i === idioma ? "bg-tinta text-fondo border-tinta" : "border-linea bg-tarjeta hover:border-marca"}`}>
                {NOMBRES_IDIOMA[i]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-1">{d.inicio.empiezaTitulo}</h2>
        <p className="text-suave mb-4">{d.inicio.empiezaTexto}</p>
        <PorDondeEmpiezo idioma={idioma} situaciones={d.inicio.situaciones} orden={SITUACIONES} titulos={titulos} etiquetaOrden={d.inicio.ordenRecomendado} />
      </section>

      {buscadas.length ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">{d.inicio.masBuscado}</h2>
          <ul className="divide-y divide-linea border-y border-linea">
            {buscadas.map((p) => (
              <li key={p.slug}>
                <Link href={`/${idioma}/preguntas/${p.slug}`} className="flex items-center justify-between gap-4 py-3.5 font-medium hover:text-marca-oscuro transition-colors">
                  <span>{p.pregunta}</span>
                  <span className="text-marca-oscuro rtl:rotate-180" aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/${idioma}/preguntas`} className="enlace text-sm inline-block mt-3">{d.preguntas.titulo}</Link>
        </section>
      ) : null}

      <section id="guias" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4">{d.inicio.guiasTitulo}</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {guias.map((g, i) => <li key={g.slug}><TarjetaGuia g={g} idioma={idioma} d={d} n={i + 1} /></li>)}
        </ul>
      </section>

      <section className="rounded-2xl bg-marca-claro p-6 sm:p-8 grid sm:grid-cols-[1fr_auto] gap-5 items-center">
        <div>
          <h2 className="text-2xl font-bold">{d.precios.titulo}</h2>
          <p className="mt-1">{d.precios.subtitulo}</p>
          <p className="mt-3 text-lg font-bold cifras">{config.precios.suscripcion.texto} <span className="text-suave font-normal">·</span> {config.precios.pack.texto}</p>
          <p className="mt-2 text-sm">{d.precios.garantia}</p>
        </div>
        <Link href={`/${idioma}/precios`} className="boton boton-marca">{d.guia.verPrecios}</Link>
      </section>
    </div>
  );
}
