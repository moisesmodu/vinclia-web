import Image from "next/image";
import Link from "next/link";
import type { Idioma } from "@/lib/catalogo";

// «Un cuento distinto para cada edad»: las dos franjas con una página real de cada muestra.
const C = {
  es: {
    ojo: "Crece con su edad",
    titulo: "No es el mismo cuento con otro nombre: es otro cuento",
    sub: "Cada colección tiene dos historias escritas aparte. Eliges la edad y Lunilla escribe la que toca.",
    bandas: [
      {
        edad: "2 a 4 años", paginas: "18 páginas", img: "/muestras/leo-y-la-luz-de-la-luna/05.webp", alt: "Página de «Leo y la luz de la luna»",
        cita: "«Luz, lucita, luz de luna: aquí no hay miedo ninguno». Leo las dijo bajito. ¡Funcionaban!",
        puntos: ["Una idea por página y frases cortas", "Un estribillo para repetir juntos en voz alta", "Onomatopeyas y cosas que señalar en el dibujo", "Letra grande, ilustración en cada página"],
      },
      {
        edad: "5 a 8 años", paginas: "22 páginas", img: "/muestras/la-martina-i-els-secrets-de-lleida/15.webp", alt: "Página de «La Martina i els secrets de Lleida»",
        cita: "—Uf, quants esglaons! —va bufar la Martina. Però no es va aturar: esglaó a esglaó, va arribar a dalt de tot.",
        puntos: ["Una aventura con pistas, un tropiezo y un giro", "Diálogos y personajes de su ciudad de verdad", "Una decisión que toma su protagonista", "Para leer juntos o empezar a leer solos"],
      },
    ],
    cta: "Elegir su edad y empezar",
  },
  ca: {
    ojo: "Creix amb la seva edat",
    titulo: "No és el mateix conte amb un altre nom: és un altre conte",
    sub: "Cada col·lecció té dues històries escrites a part. Tries l'edat i la Lunilla escriu la que toca.",
    bandas: [
      {
        edad: "2 a 4 anys", paginas: "18 pàgines", img: "/muestras/leo-y-la-luz-de-la-luna/05.webp", alt: "Pàgina de «Leo y la luz de la luna»",
        cita: "«Llum, llumeta, llum de lluna: aquí no hi ha cap por». En Leo les va dir baixet. Funcionaven!",
        puntos: ["Una idea per pàgina i frases curtes", "Una tornada per repetir junts en veu alta", "Onomatopeies i coses per assenyalar al dibuix", "Lletra grossa, il·lustració a cada pàgina"],
      },
      {
        edad: "5 a 8 anys", paginas: "22 pàgines", img: "/muestras/la-martina-i-els-secrets-de-lleida/15.webp", alt: "Pàgina de «La Martina i els secrets de Lleida»",
        cita: "—Uf, quants esglaons! —va bufar la Martina. Però no es va aturar: esglaó a esglaó, va arribar a dalt de tot.",
        puntos: ["Una aventura amb pistes, un entrebanc i un gir", "Diàlegs i personatges de la seva ciutat de veritat", "Una decisió que pren el protagonista", "Per llegir junts o començar a llegir sols"],
      },
    ],
    cta: "Triar la seva edat i començar",
  },
};

export function Edades({ idioma }: { idioma: Idioma }) {
  const k = C[idioma];
  const p = idioma === "ca" ? "/ca" : "";
  return (
    <section className="envoltura">
      <div className="mx-auto max-w-6xl py-16">
        <p className="ojo mb-2">{k.ojo}</p>
        <h2 className="text-3xl sm:text-4xl mb-3 max-w-3xl">{k.titulo}</h2>
        <p className="text-suave max-w-2xl mb-10">{k.sub}</p>
        <div className="grid gap-8 lg:grid-cols-2">
          {k.bandas.map((b, i) => (
            <article key={b.edad} className={`edad-tarjeta ${i ? "edad-mayores" : "edad-peques"}`}>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h3 className="text-3xl">{b.edad}</h3>
                <span className="edad-sello">{b.paginas}</span>
              </div>
              <figure className="pagina-libro mb-5 rotate-[-1.2deg]">
                <div className="ilu"><Image src={b.img} alt={b.alt} width={1200} height={800} sizes="(max-width: 1024px) 92vw, 540px" /></div>
                <blockquote className={`px-6 pb-5 pt-3 leading-relaxed ${i ? "text-base" : "text-xl"}`} lang={i ? "ca" : "es"}>{b.cita}</blockquote>
              </figure>
              <ul className="grid gap-2 sm:grid-cols-2">
                {b.puntos.map((pt) => <li key={pt} className="flex gap-2 text-sm"><span className="text-luna-osc font-black" aria-hidden>✦</span>{pt}</li>)}
              </ul>
              <Link href={`${p}/crear?edad=${i ? 6 : 3}`} className="inline-block mt-5 font-bold text-noche underline decoration-[#F5C84C] decoration-4 underline-offset-4">{k.cta} →</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
