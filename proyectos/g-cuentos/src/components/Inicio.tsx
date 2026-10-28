import Image from "next/image";
import Link from "next/link";
import { COLECCIONES, type Idioma } from "@/lib/catalogo";
import { configPais, euros, URL_BASE } from "@/lib/config";
import { MUESTRAS } from "@/lib/muestras";
import { pref, t } from "@/i18n/textos";
import { Pagina } from "./Marco";

const PORTADAS_COLECCION: Record<string, string> = {
  dormir: "/muestras/leo-y-la-luz-de-la-luna/07-p.webp",
  valores: "/personajes/nino-retrato.webp",
  hermanito: "/personajes/nina-retrato.webp",
  ciudad: "/muestras/la-martina-i-els-secrets-de-lleida/09-p.webp",
};

function fecha(iso: string, idioma: Idioma) {
  return new Intl.DateTimeFormat(idioma === "ca" ? "ca-ES" : "es-ES", { day: "numeric", month: "long" }).format(new Date(iso));
}

export function Inicio({ idioma }: { idioma: Idioma }) {
  const x = t(idioma);
  const p = pref(idioma);
  const c = configPais();
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: idioma === "ca" ? "Conte infantil personalitzat Lunilla" : "Cuento infantil personalizado Lunilla",
    image: [`${URL_BASE()}/muestras/leo-y-la-luz-de-la-luna/00.webp`],
    brand: { "@type": "Brand", name: "Lunilla" },
    offers: [
      { "@type": "Offer", price: (c.precios.pdf / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.pdf },
      { "@type": "Offer", price: (c.precios.tapaDura / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.tapaDura },
    ],
  };
  return (
    <Pagina idioma={idioma}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      {/* Portada */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <p className="text-terracota font-bold mb-3">{x.lema}</p>
          <h1 className="text-4xl sm:text-5xl leading-[1.05] mb-5">{x.hero.titulo}</h1>
          <p className="text-lg text-suave mb-7">{x.hero.sub}</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Link href={`${p}/crear`} className="boton text-lg">{x.hero.cta}</Link>
            <Link href={`${p}/#muestras`} className="boton-sec">{x.nav.muestras}</Link>
          </div>
          <p className="text-sm text-suave mt-4">{x.hero.nota}</p>
        </div>
        <div className="relative h-[340px] sm:h-[440px]">
          <Image src="/muestras/leo-y-la-luz-de-la-luna/00.webp" alt="Leo y la luz de la luna" width={600} height={600} priority className="absolute left-0 top-4 w-[68%] rotate-[-4deg] rounded-2xl shadow-xl" />
          <Image src="/muestras/la-martina-i-els-secrets-de-lleida/00.webp" alt="La Martina i els secrets de Lleida" width={600} height={600} className="absolute right-0 bottom-0 w-[60%] rotate-[5deg] rounded-2xl shadow-xl" />
        </div>
      </section>

      {/* Precios */}
      <section className="mx-auto max-w-4xl px-4 grid gap-4 sm:grid-cols-2">
        <div className="tarjeta p-6">
          <p className="font-bold text-noche">{x.precios.pdf}</p>
          <p className="titulo text-4xl my-2">{euros(c.precios.pdf, idioma)}</p>
          <p className="text-suave">{x.precios.entrega}</p>
        </div>
        <div className="tarjeta p-6 ring-2 ring-terracota">
          <p className="font-bold text-noche">{x.precios.tapaDura}</p>
          <p className="titulo text-4xl my-2">{euros(c.precios.tapaDura, idioma)} <span className="text-base text-suave" style={{ fontFamily: "var(--font-texto)" }}>· {x.precios.envio}</span></p>
          <p className="text-suave">{x.precios.entregaLibro}</p>
        </div>
        <p className="sm:col-span-2 text-center text-sm text-terracota-osc font-bold">
          {x.fechas(fecha(c.fechasLimite.navidadTapaDura, idioma), fecha(c.fechasLimite.reyesTapaDura, idioma))}
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl mb-6 text-center">{x.comoFunciona.titulo}</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {x.comoFunciona.pasos.map(([h, d], i) => (
            <li key={h} className="tarjeta p-6">
              <span className="titulo text-terracota text-3xl">{i + 1}</span>
              <h3 className="text-xl mt-1 mb-2">{h}</h3>
              <p className="text-suave">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Muestras */}
      <section id="muestras" className="mx-auto max-w-6xl px-4 mt-16 scroll-mt-20">
        <h2 className="text-3xl mb-2 text-center">{x.muestras.titulo}</h2>
        <p className="text-center text-suave mb-8">{x.muestras.sub}</p>
        <div className="grid gap-6 md:grid-cols-2">
          {MUESTRAS.map((m) => (
            <Link key={m.slug} href={`${p}/muestras/${m.slug}`} className="tarjeta overflow-hidden group">
              <div className="grid grid-cols-3 gap-1 p-1">
                {[1, 5, 9].map((n) => (
                  <Image key={n} src={`/muestras/${m.slug}/${String(n).padStart(2, "0")}-p.webp`} alt="" width={480} height={480} className="rounded-lg" />
                ))}
              </div>
              <div className="p-5">
                <h3 className="text-2xl">{m.datos.idioma === "ca" ? "La Martina i els secrets de Lleida" : "Leo y la luz de la luna"}</h3>
                <p className="text-suave mt-1">
                  {m.datos.idioma === "ca" ? "Col·lecció La meva ciutat · en català · 6 anys" : "Colección Dormir · en castellano · 4 años"}
                </p>
                <span className="inline-block mt-3 font-bold text-terracota group-hover:underline">{x.muestras.leer} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Colecciones */}
      <section className="mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl mb-6 text-center">{x.colecciones}</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {COLECCIONES.map((col) => (
            <Link key={col.id} href={`${p}/crear?coleccion=${col.id}`} className="tarjeta p-4 hover:-translate-y-0.5 transition">
              <Image src={PORTADAS_COLECCION[col.id]} alt="" width={480} height={480} className="rounded-xl mb-3 aspect-square object-cover" />
              <h3 className="text-xl">{col.nombre[idioma]}</h3>
              <p className="text-sm text-suave mt-1">{col.descripcion[idioma]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Por qué */}
      <section className="mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-3xl mb-6 text-center">{x.porque.titulo}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {x.porque.puntos.map(([h, d]) => (
            <div key={h} className="tarjeta p-6">
              <h3 className="text-xl mb-2">{h}</h3>
              <p className="text-suave">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-6 font-bold text-noche">{x.garantia}</p>
      </section>

      {/* Protagonistas */}
      <section className="mx-auto max-w-6xl px-4 mt-16 grid gap-4 sm:grid-cols-2">
        <Image src="/personajes/nino-hoja.webp" alt="" width={1600} height={893} className="tarjeta" />
        <Image src="/personajes/nina-hoja.webp" alt="" width={1600} height={893} className="tarjeta" />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 mt-16">
        <h2 className="text-3xl mb-6 text-center">{x.faqTitulo}</h2>
        <div className="space-y-3">
          {x.faq.map(([q, a]) => (
            <details key={q} className="tarjeta p-5">
              <summary className="font-bold cursor-pointer text-noche">{q}</summary>
              <p className="mt-2 text-suave">{a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href={`${p}/crear`} className="boton text-lg">{x.hero.cta}</Link>
        </div>
      </section>
    </Pagina>
  );
}
