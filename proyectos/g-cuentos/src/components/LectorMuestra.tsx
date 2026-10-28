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
        <p className="text-terracota font-bold">{idioma === "ca" ? "Conte de mostra" : "Cuento de muestra"}</p>
        <h1 className="text-3xl sm:text-5xl mt-1 mb-6">{c.titulo}</h1>
        <div className="tarjeta p-3 mb-6">
          <div className="relative rounded-xl overflow-hidden">
            <Image src={img(0)} alt={c.titulo} width={1200} height={1200} priority className="w-full" />
            <div className="absolute top-[6%] inset-x-[8%] bg-crema/90 rounded-xl p-3 text-center"><p className="titulo text-2xl sm:text-4xl">{c.titulo}</p></div>
          </div>
        </div>
        <div className="tarjeta p-8 text-center italic whitespace-pre-line text-lg mb-6">{c.dedicatoria}</div>
        <div className="space-y-6">
          {c.paginas.map((texto, i) => (
            <section key={i} className="tarjeta grid md:grid-cols-2 overflow-hidden">
              <p className={`p-6 sm:p-10 text-lg sm:text-xl leading-relaxed self-center ${i % 2 ? "md:order-2" : ""}`}>{texto}</p>
              <Image src={img(i + 1)} alt="" width={1200} height={1200} className="w-full h-full object-cover" loading={i < 2 ? "eager" : "lazy"} />
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
