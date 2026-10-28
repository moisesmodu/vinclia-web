import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { CUENTOS_MUESTRA } from "@/lib/muestras-contenido";
import { pref, t } from "@/i18n/textos";
import { Pagina } from "./Marco";

export function LectorMuestra({ slug, idioma }: { slug: string; idioma: Idioma }) {
  const c = CUENTOS_MUESTRA[slug];
  if (!c) notFound();
  const x = t(idioma);
  const img = (i: number) => `/muestras/${slug}/${String(i).padStart(2, "0")}.webp`;
  return (
    <Pagina idioma={idioma}>
      <article className="mx-auto max-w-5xl px-4 py-8" lang={c.idioma}>
        <p className="text-primario font-bold">{idioma === "ca" ? "Conte de mostra" : "Cuento de muestra"}</p>
        <h1 className="text-3xl sm:text-5xl mt-1 mb-6">{c.titulo}</h1>
        <div className="tarjeta p-3 mb-6">
          <div className="relative rounded-xl overflow-hidden">
            <Image src={img(0)} alt={c.titulo} width={1200} height={1200} priority className="w-full" />
            <div className="absolute top-[6%] inset-x-[8%] bg-crema/90 rounded-xl p-3 text-center"><p className="titulo text-2xl sm:text-4xl">{c.titulo}</p></div>
          </div>
        </div>
        <div className="tarjeta p-8 text-center italic whitespace-pre-line text-lg mb-6">{c.dedicatoria}</div>
        {c.ilustradas?.some((v) => !v) && (
          <p className="tarjeta p-4 mb-6 text-sm text-suave">
            {idioma === "ca"
              ? `Mostra en preparació: ${c.ilustradas.filter(Boolean).length} de les ${c.paginas.length} pàgines ja estan il·lustrades; la resta es mostren només amb el text.`
              : `Muestra en preparación: ${c.ilustradas.filter(Boolean).length} de las ${c.paginas.length} páginas ya están ilustradas; el resto se muestran solo con el texto.`}
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {c.paginas.map((texto, i) => (
            <section key={i} className="pagina-libro">
              {c.ilustradas?.[i] === false ? (
                <div className="ilu grid place-items-center bg-[#2B3A67] text-crema/70 text-sm p-6 text-center">
                  <span><span className="block text-4xl mb-2 text-luna" aria-hidden>☾</span>{idioma === "ca" ? "Il·lustració en preparació" : "Ilustración en preparación"}</span>
                </div>
              ) : (
                <div className="ilu"><Image src={img(i + 1)} alt="" width={1200} height={800} loading={i < 2 ? "eager" : "lazy"} /></div>
              )}
              <p className={`px-6 pb-4 pt-3 leading-relaxed ${c.paginas.length <= 18 ? "text-xl" : "text-lg"}`}>{texto}</p>
              <p className="text-center text-xs text-suave pb-3">{5 + i}</p>
            </section>
          ))}
        </div>
        <div className="tarjeta p-8 text-center mt-6">
          <p className="titulo text-3xl mb-2">{c.idioma === "ca" ? "Fi" : "Fin"}</p>
          <p className="text-suave mb-6">{c.contraportada}</p>
          <Link href={`${pref(idioma)}/crear`} className="boton text-lg">{x.hero.cta}</Link>
        </div>
      </article>
    </Pagina>
  );
}
