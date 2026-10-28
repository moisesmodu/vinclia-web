import Image from "next/image";
import Link from "next/link";
import { COLECCIONES, type Idioma } from "@/lib/catalogo";
import { configPais, euros, URL_BASE } from "@/lib/config";
import { CUENTOS_MUESTRA } from "@/lib/muestras-contenido";
import { t } from "@/i18n/textos";
import { Edades } from "./inicio/Edades";
import { TuDecides } from "./inicio/TuDecides";
import { DentroDelLibro } from "./inicio/DentroDelLibro";
import { Icono } from "./inicio/Iconos";
import { Personalizador } from "./inicio/Personalizador";
import { AvisoCampana, BarraMovil } from "./inicio/Pequenos";
import { Pagina } from "./Marco";

// Textos propios de la portada (es / ca). El resto viene de i18n/textos.ts.
const C = {
  es: {
    ojo: "Cuentos personalizados · castellano y català",
    sub: "Escribe su nombre y mira cómo cambia la portada. Después eliges su ciudad, su mascota, lo que le gusta y un miedo o un valor, y Lunilla lo convierte en un álbum ilustrado de 18 páginas (de 2 a 4 años) o 22 (de 5 a 8), con una historia distinta para cada edad.",
    confianza: [["ojo", "3 páginas gratis antes de pagar"], ["sinFoto", "Sin fotos de tu hijo"], ["rayo", "PDF en menos de 2 horas"], ["camion", "Tapa dura con envío incluido"]],
    dentroOjo: "Por dentro", dentroTitulo: "Dos cuentos enteros, página a página",
    dentroSub: "Leo y Martina son inventados. Sus cuentos están hechos con el mismo sistema que hará el tuyo: mismas plantillas, mismos protagonistas, misma imprenta.",
    queOjo: "Qué cambia", queTitulo: "No solo el nombre: la historia es suya",
    que: [
      ["nombre", "Su nombre", "En la portada, en la dedicatoria y en cada página, con el artículo bien puesto también en catalán: «en Pau», «la Martina»."],
      ["casa", "Su ciudad o su pueblo", "La aventura pasa donde vive. En ciudades como Lleida, Zaragoza o Valencia, con lugares reales: el Segre, el Pilar, el Turia."],
      ["pata", "Su mascota o su peluche", "Le acompaña en toda la historia y aparece en las ilustraciones: «la sombra entera era Bigotes, estirándose bajo una farola»."],
      ["estrella", "Lo que más le gusta", "Dinosaurios, fútbol, dibujar, música… En «Dormir» las estrellas dibujan su afición en el cielo."],
      ["luna", "Un miedo o un valor", "La oscuridad, los monstruos, los celos de un hermanito, decir la verdad, compartir. 17 temas escritos y revisados."],
      ["pluma", "La dedicatoria", "La escribes tú o te proponemos una. Es lo primero que leerá: «Para Leo, con todo el cariño, los abuelos»."],
    ],
    colOjo: "Cuatro colecciones", colTitulo: "Elige por lo que está viviendo",
    colPara: { dormir: "Le cuesta dormir", valores: "Quieres hablar de algo importante", hermanito: "Va a llegar un bebé", ciudad: "Le encanta salir a explorar" } as Record<string, string>,
    edades: "Edad", temas: "Temas para elegir", crearCol: "Crear este cuento",
    prodOjo: "El libro", prodTitulo: "PDF hoy mismo o tapa dura en casa",
    pdf: ["Se lee en tablet, móvil u ordenador", "Se imprime en casa o en la copistería", "Llega a tu correo en menos de 2 horas", "Perfecto para la noche de Reyes o Nochebuena"],
    libro: ["Tapa dura laminada mate, 20 × 20 cm", "28 páginas a todo color en papel estucado de 170 g", "Ilustraciones a página completa, a sangre", "Impreso bajo demanda en la UE y enviado a casa", "Incluye también el PDF al momento"],
    directo: "¿Es un regalo? Pon la dirección del niño al pagar y le llegará directamente.",
    hermanos: "Segundo cuento para un hermano: 20 % de descuento con el código HERMANOS20.",
    ilustrativa: "Imagen ilustrativa del libro impreso.",
    fechasOjo: "Fechas", fechasTitulo: "Llega a tiempo, seguro",
    fechas: (n: string, r: string) => [
      ["Hasta el " + n, "Libro de tapa dura para Navidad"],
      ["Hasta el " + r, "Libro de tapa dura para Reyes"],
      ["Siempre", "PDF en menos de 2 horas, también el 24 de diciembre y el 5 de enero"],
    ],
    lunillaOjo: "Conoce a Lunilla", lunillaTitulo: "La luna que acompaña cada cuento",
    lunillaTexto: "Lunilla es una luna pequeña con bufanda. Nunca grita ni habla con mayúsculas. Aparece en la portada de cada cuento y se despide en la última página con una frase para decir en voz alta juntos.",
    lunillaFrase: "«Buenas noches, luna; buenas noches, Lunilla.»", lunillaPie: "La frase final de «Leo y la luz de la luna»",
    compOjo: "Comparado", compTitulo: "Lo que nos diferencia",
    compCab: ["", "Lunilla", "Un libro personalizado típico"],
    comp: [
      ["La historia", "Cambia con su ciudad, su mascota, su afición y lo que le preocupa", "Cambian el nombre y el aspecto del personaje"],
      ["Fotos del niño", "Nunca: protagonistas ilustrados", "Muchas veces piden varias fotos de la cara"],
      ["Ver antes de pagar", "Portada, dedicatoria y 3 páginas, gratis", "Depende de la tienda"],
      ["Regalo de última hora", "PDF en menos de 2 horas", "Solo impreso; a España, a menudo de 8 a 15 días"],
      ["Catalán", "Escrito en catalán, no traducido", "Pocas veces"],
      ["Precio", "PDF 7,90 € · tapa dura 36,90 € con envío", "30–45 €, y el envío aparte"],
    ],
    ocasionesTitulo: "Ideas por ocasión",
    ocasiones: [["Regalo de los abuelos", "/cuentos/regalo-abuelos-navidad"], ["Reyes", "/cuentos/regalo-reyes-magos-cuento-personalizado"], ["Última hora", "/cuentos/regalo-ultima-hora-cuento-pdf"], ["Cumpleaños", "/cuentos/regalo-cumpleanos-nino-personalizado"], ["Hermanito nuevo", "/cuentos/cuento-hermanito-nuevo-celos"], ["Miedo a la oscuridad", "/cuentos/cuento-para-dormir-miedo-a-la-oscuridad"], ["3 años", "/cuentos/regalo-original-nino-3-anos"], ["5 y 6 años", "/cuentos/regalo-original-ninos-5-anos"]],
    garOjo: "Tranquilidad", garTitulo: "Si algo no te gusta, lo arreglamos",
    gar: [["corazon", "Te lo rehacemos gratis", "Una vez: el texto, las ilustraciones o las dos cosas."], ["regalo", "Reimpresión sin coste", "Si el libro llega dañado o con un defecto, nos mandas una foto y lo volvemos a imprimir."], ["escudo", "Pago seguro", "Con tarjeta, Apple Pay o Google Pay a través de Stripe. No guardamos tu tarjeta."], ["pluma", "Te responde una persona", "Escríbenos a hola@lunilla.es: contestamos en menos de 24 horas laborables."]],
    finalTitulo: "¿Cómo se llama tu protagonista?", finalSub: "Ves su portada y las primeras páginas antes de pagar nada.",
  },
  ca: {
    ojo: "Contes personalitzats · català i castellano",
    sub: "Escriu el seu nom i mira com canvia la portada. Després tries la seva ciutat, la seva mascota, el que li agrada i una por o un valor, i la Lunilla ho converteix en un àlbum il·lustrat de 18 pàgines (de 2 a 4 anys) o 22 (de 5 a 8), amb una història diferent per a cada edat.",
    confianza: [["ojo", "3 pàgines gratis abans de pagar"], ["sinFoto", "Sense fotos del teu fill"], ["rayo", "PDF en menys de 2 hores"], ["camion", "Tapa dura amb enviament inclòs"]],
    dentroOjo: "Per dins", dentroTitulo: "Dos contes sencers, pàgina a pàgina",
    dentroSub: "En Leo i la Martina són inventats. Els seus contes estan fets amb el mateix sistema que farà el teu: mateixes plantilles, mateixos protagonistes, mateixa impremta.",
    queOjo: "Què canvia", queTitulo: "No només el nom: la història és seva",
    que: [
      ["nombre", "El seu nom", "A la portada, a la dedicatòria i a cada pàgina, amb l'article com toca: «en Pau», «la Martina», «l'Oriol»."],
      ["casa", "La seva ciutat o el seu poble", "L'aventura passa on viu. A ciutats com Lleida, Girona o Tarragona, amb llocs reals: el Segre, la Seu Vella, l'Onyar."],
      ["pata", "La seva mascota o el seu peluix", "L'acompanya en tota la història i surt a les il·lustracions: «En Núvol movia la cua, com si també volgués saber-ho»."],
      ["estrella", "El que més li agrada", "Dinosaures, futbol, dibuixar, música… A «Dormir» les estrelles dibuixen la seva afició al cel."],
      ["luna", "Una por o un valor", "La foscor, els monstres, la gelosia d'un germanet, dir la veritat, compartir. 17 temes escrits i revisats."],
      ["pluma", "La dedicatòria", "L'escrius tu o te'n proposem una. És el primer que llegirà: «Per a la Martina, amb tot l'amor, els avis»."],
    ],
    colOjo: "Quatre col·leccions", colTitulo: "Tria pel que està vivint",
    colPara: { dormir: "Li costa dormir", valores: "Vols parlar d'alguna cosa important", hermanito: "Arribarà un nadó", ciudad: "Li encanta sortir a explorar" } as Record<string, string>,
    edades: "Edat", temas: "Temes per triar", crearCol: "Crear aquest conte",
    prodOjo: "El llibre", prodTitulo: "PDF avui mateix o tapa dura a casa",
    pdf: ["Es llegeix a la tauleta, al mòbil o a l'ordinador", "S'imprimeix a casa o a la copisteria", "Arriba al teu correu en menys de 2 hores", "Perfecte per a la nit de Reis o de Nadal"],
    libro: ["Tapa dura laminada mat, 20 × 20 cm", "28 pàgines a tot color en paper estucat de 170 g", "Il·lustracions a pàgina sencera, a sang", "Imprès sota demanda a la UE i enviat a casa", "Inclou també el PDF a l'instant"],
    directo: "És un regal? Posa l'adreça de l'infant en pagar i li arribarà directament.",
    hermanos: "Segon conte per a un germà: 20 % de descompte amb el codi HERMANOS20.",
    ilustrativa: "Imatge il·lustrativa del llibre imprès.",
    fechasOjo: "Dates", fechasTitulo: "Arriba a temps, segur",
    fechas: (n: string, r: string) => [
      ["Fins al " + n, "Llibre de tapa dura per Nadal"],
      ["Fins al " + r, "Llibre de tapa dura per Reis"],
      ["Sempre", "PDF en menys de 2 hores, també el 24 de desembre i el 5 de gener"],
    ],
    lunillaOjo: "Coneix la Lunilla", lunillaTitulo: "La lluna que acompanya cada conte",
    lunillaTexto: "La Lunilla és una lluna petita amb bufanda. Mai no crida ni parla amb majúscules. Surt a la portada de cada conte i s'acomiada a l'última pàgina amb una frase per dir en veu alta junts.",
    lunillaFrase: "«Bona nit, Lleida; demà, més secrets.»", lunillaPie: "La frase final de «La Martina i els secrets de Lleida»",
    compOjo: "Comparat", compTitulo: "El que ens fa diferents",
    compCab: ["", "Lunilla", "Un llibre personalitzat típic"],
    comp: [
      ["La història", "Canvia amb la seva ciutat, la seva mascota, la seva afició i el que el preocupa", "Canvien el nom i l'aspecte del personatge"],
      ["Fotos de l'infant", "Mai: protagonistes il·lustrats", "Moltes vegades en demanen diverses de la cara"],
      ["Veure abans de pagar", "Portada, dedicatòria i 3 pàgines, gratis", "Depèn de la botiga"],
      ["Regal d'última hora", "PDF en menys de 2 hores", "Només imprès; a Espanya, sovint de 8 a 15 dies"],
      ["Català", "Escrit en català, no traduït", "Poques vegades"],
      ["Preu", "PDF 7,90 € · tapa dura 36,90 € amb enviament", "30–45 €, i l'enviament a part"],
    ],
    ocasionesTitulo: "Idees per ocasió",
    ocasiones: [["Regal dels avis", "/ca/contes/regal-avis-nadal"], ["Reis", "/ca/contes/regal-reis-conte-personalitzat"], ["El tió", "/ca/contes/regal-tio-de-nadal"], ["Germanet nou", "/ca/contes/conte-germanet-nou"], ["Por de la foscor", "/ca/contes/conte-per-dormir-por-a-la-foscor"], ["Un conte a Lleida", "/ca/contes/conte-personalitzat-lleida"], ["Sense fotos", "/ca/contes/conte-personalitzat-sense-fotos"]],
    garOjo: "Tranquil·litat", garTitulo: "Si alguna cosa no t'agrada, ho arreglem",
    gar: [["corazon", "Te'l refem gratis", "Una vegada: el text, les il·lustracions o totes dues coses."], ["regalo", "Reimpressió sense cost", "Si el llibre arriba malmès o amb un defecte, ens envies una foto i el tornem a imprimir."], ["escudo", "Pagament segur", "Amb targeta, Apple Pay o Google Pay a través de Stripe. No guardem la teva targeta."], ["pluma", "Et respon una persona", "Escriu-nos a hola@lunilla.es: contestem en menys de 24 hores feineres."]],
    finalTitulo: "Com es diu el teu protagonista?", finalSub: "Veus la seva portada i les primeres pàgines abans de pagar res.",
  },
};

const IMG_COL: Record<string, string> = {
  dormir: "/muestras/leo-y-la-luz-de-la-luna/07-p.webp",
  valores: "/muestras/leo-y-la-luz-de-la-luna/10-p.webp",
  hermanito: "/muestras/leo-y-la-luz-de-la-luna/12-p.webp",
  ciudad: "/muestras/la-martina-i-els-secrets-de-lleida/09-p.webp",
};

function fecha(iso: string, idioma: Idioma) {
  return new Intl.DateTimeFormat(idioma === "ca" ? "ca-ES" : "es-ES", { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));
}

export function Inicio({ idioma }: { idioma: Idioma }) {
  const x = t(idioma);
  const k = C[idioma];
  const ca = idioma === "ca";
  const p = ca ? "/ca" : "";
  const c = configPais();
  const muestras = [CUENTOS_MUESTRA["leo-y-la-luz-de-la-luna"], CUENTOS_MUESTRA["la-martina-i-els-secrets-de-lleida"]];
  if (ca) muestras.reverse();
  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "Product",
      name: ca ? "Conte infantil personalitzat Lunilla" : "Cuento infantil personalizado Lunilla",
      description: k.sub, image: [`${URL_BASE()}/muestras/leo-y-la-luz-de-la-luna/00.webp`, `${URL_BASE()}/producto/regalo.webp`],
      brand: { "@type": "Brand", name: "Lunilla" },
      offers: [
        { "@type": "Offer", price: (c.precios.pdf / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.pdf },
        { "@type": "Offer", price: (c.precios.tapaDura / 100).toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", name: x.precios.tapaDura, shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "ES" } } },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: x.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return (
    <Pagina idioma={idioma}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <AvisoCampana idioma={idioma} navidad={c.fechasLimite.navidadTapaDura} reyes={c.fechasLimite.reyesTapaDura} />

      {/* 1 · Noche: promesa + portada que se personaliza en vivo */}
      <section className="cielo envoltura">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center pt-10 pb-24 lg:pt-14 lg:pb-28 relative z-[1]">
          <div className="order-2 lg:order-1">
            <p className="ojo mb-3">{k.ojo}</p>
            <h1 className="text-[2.6rem] sm:text-6xl leading-[1.02] mb-5">{x.promesa.replace(/\.$/, "")}</h1>
            <p className="text-lg opacity-90 mb-7 max-w-[34rem]">{k.sub}</p>
            <ul className="grid sm:grid-cols-2 gap-3 max-w-[34rem]">
              {k.confianza.map(([i, txt]) => {
                const I = Icono[i as keyof typeof Icono];
                return <li key={txt} className="flex items-center gap-3 font-bold"><span className="acento"><I /></span>{txt}</li>;
              })}
            </ul>
            <p className="mt-7 text-sm opacity-80">
              PDF <b className="acento">{euros(c.precios.pdf, idioma)}</b> · {x.precios.tapaDura.toLowerCase()} <b className="acento">{euros(c.precios.tapaDura, idioma)}</b> {x.precios.envio} · {x.precio.iva}
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <Personalizador idioma={idioma} />
          </div>
        </div>
      </section>

      {/* 2 · Por dentro del libro */}
      <section className="envoltura" id="muestras">
        <div className="mx-auto max-w-6xl py-14 scroll-mt-20">
          <p className="ojo mb-2">{k.dentroOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-3">{k.dentroTitulo}</h2>
          <p className="text-suave max-w-2xl mb-8">{k.dentroSub}</p>
          <DentroDelLibro idioma={idioma} cuentos={muestras} />
          <div className="flex flex-wrap gap-3 mt-6">
            {muestras.map((m) => (
              <Link key={m.slug} href={`${p}/muestras/${m.slug}`} className="boton-sec">{x.muestras.leer}: {m.titulo}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2b · Un cuento distinto para cada edad */}
      <Edades idioma={idioma} />

      {/* 3 · Qué se personaliza */}
      <section className="banda-rosa curva-arriba envoltura">
        <div className="mx-auto max-w-6xl py-16">
          <p className="ojo mb-2">{k.queOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-10 max-w-2xl">{k.queTitulo}</h2>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {k.que.map(([i, h, d]) => {
              const I = Icono[i as keyof typeof Icono];
              return (
                <div key={h} className="flex gap-4">
                  <span className="icono-redondo"><I /></span>
                  <div className="min-w-0"><h3 className="text-xl mb-1">{h}</h3><p className="texto-rosa">{d}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 · Colecciones por necesidad */}
      <section className="envoltura">
        <div className="mx-auto max-w-6xl py-16">
          <p className="ojo mb-2">{k.colOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-8">{k.colTitulo}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {COLECCIONES.map((col) => (
              <article key={col.id} className="tarjeta overflow-hidden grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr]">
                <Image src={IMG_COL[col.id]} alt="" width={480} height={480} className="h-full w-full object-cover" />
                <div className="p-5 min-w-0">
                  <p className="text-sm font-bold text-primario">{k.colPara[col.id]}</p>
                  <h3 className="text-2xl mb-1">{col.nombre[idioma]}</h3>
                  <p className="text-suave text-sm mb-2">{col.descripcion[idioma]} {k.edades}: {col.edades}.</p>
                  <p className="text-xs text-suave mb-3">{k.temas}: {col.temas.map((tm) => tm.etiqueta[idioma]).join(" · ")}</p>
                  <Link href={`${p}/crear?coleccion=${col.id}`} className="font-bold text-noche underline decoration-[#F5C84C] decoration-4 underline-offset-4">{k.crearCol} →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · El producto y el precio (MARCAS.md §3) */}
      <section className="envoltura" id="precio">
        <div className="mx-auto max-w-6xl py-16">
          <p className="ojo mb-2">{k.prodOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-8">{k.prodTitulo}</h2>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
            <figure>
              <div className="marco-foto"><Image src="/producto/regalo.webp" alt={k.ilustrativa} width={1600} height={1200} className="w-full" /></div>
              <figcaption className="text-xs text-suave mt-2">{k.ilustrativa}</figcaption>
            </figure>
            <div className="grid gap-4">
              <div className="tarjeta p-6">
                <div className="flex items-baseline justify-between gap-3"><h3 className="text-xl">{x.precio.gratis}</h3><p className="titulo text-3xl">0 €</p></div>
                <ul className="text-suave mt-2 space-y-1">{x.precio.gratisLista.map((l) => <li key={l}>✓ {l}</li>)}</ul>
              </div>
              <div className="tarjeta p-6">
                <div className="flex items-baseline justify-between gap-3"><h3 className="text-xl">{x.precios.pdf}</h3><p className="titulo text-3xl">{euros(c.precios.pdf, idioma)}</p></div>
                <ul className="text-suave mt-2 space-y-1">{k.pdf.map((l) => <li key={l}>✓ {l}</li>)}</ul>
              </div>
              <div className="tarjeta p-6 ring-2 ring-[#F5C84C]">
                <div className="flex items-baseline justify-between gap-3"><h3 className="text-xl">{x.precios.tapaDura}</h3><p className="titulo text-3xl">{euros(c.precios.tapaDura, idioma)}</p></div>
                <p className="text-sm font-bold text-primario">{x.precios.envio}</p>
                <ul className="text-suave mt-2 space-y-1">{k.libro.map((l) => <li key={l}>✓ {l}</li>)}</ul>
              </div>
              <p className="text-sm text-suave">{x.precio.iva} · {x.precio.unico}</p>
              <p className="text-sm"><b className="text-noche">{k.directo}</b></p>
              <p className="text-sm"><b className="text-noche">{k.hermanos}</b></p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 · Fechas límite */}
      <section className="banda-noche curva-arriba envoltura">
        <div className="mx-auto max-w-6xl py-14 grid gap-8 lg:grid-cols-[1fr_1.4fr] items-center">
          <div>
            <p className="ojo mb-2">{k.fechasOjo}</p>
            <h2 className="text-3xl sm:text-4xl">{k.fechasTitulo}</h2>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {k.fechas(fecha(c.fechasLimite.navidadTapaDura, idioma), fecha(c.fechasLimite.reyesTapaDura, idioma)).map(([f, d]) => (
              <li key={f} className="fecha-tarjeta">
                <p className="titulo text-2xl acento">{f}</p>
                <p className="mt-1 opacity-90">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 · Lunilla */}
      <section className="envoltura">
        <div className="mx-auto max-w-6xl py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="ojo mb-2">{k.lunillaOjo}</p>
            <h2 className="text-3xl sm:text-4xl mb-4">{k.lunillaTitulo}</h2>
            <p className="text-lg text-suave mb-6">{k.lunillaTexto}</p>
            <blockquote className="cita">{k.lunillaFrase}</blockquote>
            <p className="text-sm text-suave mt-2">{k.lunillaPie}</p>
          </div>
          <Image src="/personajes/lunilla-hoja.webp" alt="Lunilla" width={1600} height={893} className="w-full rounded-3xl" />
        </div>
      </section>

      {/* 8 · Tú decides cómo es */}
      <TuDecides idioma={idioma} />

      {/* 9 · Comparativa */}
      <section className="envoltura">
        <div className="mx-auto max-w-5xl py-14">
          <p className="ojo mb-2">{k.compOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-6">{k.compTitulo}</h2>
          <div className="tarjeta overflow-x-auto">
            <table className="comparativa sm:min-w-[560px]">
              <thead><tr>{k.compCab.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
              <tbody>{k.comp.map(([a, b, d]) => (<tr key={a}><th scope="row" className="font-bold text-noche">{a}</th><td className="si" data-etiqueta={k.compCab[1]}>{b}</td><td className="no" data-etiqueta={k.compCab[2]}>{d}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 10 · Garantías */}
      <section className="banda-rosa curva-arriba envoltura">
        <div className="mx-auto max-w-6xl py-16">
          <p className="ojo mb-2">{k.garOjo}</p>
          <h2 className="text-3xl sm:text-4xl mb-8">{k.garTitulo}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {k.gar.map(([i, h, d]) => {
              const I = Icono[i as keyof typeof Icono];
              return <div key={h}><span className="icono-redondo mb-3"><I /></span><h3 className="text-lg mb-1">{h}</h3><p className="texto-rosa text-sm">{d}</p></div>;
            })}
          </div>
        </div>
      </section>

      {/* 11 · Ocasiones + FAQ */}
      <section className="envoltura">
        <div className="mx-auto max-w-6xl py-16 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="min-w-0">
            <h2 className="text-3xl mb-5">{k.ocasionesTitulo}</h2>
            <div className="flex flex-wrap gap-2">{k.ocasiones.map(([n, href]) => <Link key={href} href={href} className="chip">{n}</Link>)}</div>
            <div className="mt-8"><Image src="/producto/libro-abierto.webp" alt={k.ilustrativa} width={1200} height={1140} className="marco-foto w-full" /></div>
          </div>
          <div className="min-w-0">
            <h2 className="text-3xl mb-5">{x.faqTitulo}</h2>
            <div className="space-y-3">
              {x.faq.map(([q, a]) => (
                <details key={q} className="tarjeta p-5 group">
                  <summary className="font-bold cursor-pointer text-noche list-none flex justify-between gap-4">{q}<span aria-hidden className="group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="mt-2 text-suave">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12 · Cierre */}
      <section className="cielo envoltura">
        <div className="mx-auto max-w-3xl text-center pt-14 pb-24 relative z-[1]">
          <h2 className="text-4xl sm:text-5xl mb-3">{k.finalTitulo}</h2>
          <p className="opacity-90 mb-8">{k.finalSub}</p>
          <Link href={`${p}/crear`} className="boton-luna text-lg">{x.hero.cta}</Link>
          <p className="mt-6 text-sm font-bold acento">{x.sello}</p>
        </div>
      </section>
      <div className="h-20 md:hidden" aria-hidden />
      <BarraMovil idioma={idioma} desde={euros(c.precios.pdf, idioma)} />
    </Pagina>
  );
}
