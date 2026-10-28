import type { Idioma } from "@/lib/catalogo";

export const T = {
  es: {
    marca: "Lunilla",
    lema: "Cuentos personalizados con nombre, ilustrados con cariño",
    nav: { crear: "Crear cuento", muestras: "Ver muestras", ideas: "Ideas de regalo", afiliados: "Afiliadas", otroIdioma: "Català" },
    hero: {
      titulo: "Un cuento donde tu peque es el protagonista",
      sub: "Con su nombre, su ciudad, su mascota y lo que más le gusta. 12 páginas ilustradas y una historia que le ayuda con un miedo o un valor. Sin fotos del niño.",
      cta: "Crear su cuento gratis",
      nota: "Ves 3 páginas antes de pagar. PDF en menos de 2 horas.",
    },
    precios: { pdf: "PDF para leer e imprimir", tapaDura: "Libro de tapa dura", envio: "envío incluido", entrega: "En tu correo en menos de 2 horas", entregaLibro: "Impreso bajo demanda y enviado a casa (incluye el PDF)" },
    comoFunciona: {
      titulo: "Así de fácil",
      pasos: [
        ["Cuéntanos cómo es", "Nombre, edad, ciudad, mascota, afición y un miedo o valor que quieras trabajar."],
        ["Mira la vista previa", "Te enseñamos gratis las primeras páginas con su nombre."],
        ["Recíbelo", "El PDF llega a tu correo; el libro impreso, a tu casa."],
      ],
    },
    colecciones: "Cuatro colecciones",
    muestras: { titulo: "Dos cuentos de muestra, de verdad", sub: "Leo y Martina son inventados; sus cuentos están hechos con el mismo sistema que hará el tuyo.", leer: "Leer el cuento" },
    porque: {
      titulo: "Por qué Lunilla",
      puntos: [
        ["Ilustración de álbum, no fotos pegadas", "Dos protagonistas dibujados con hoja de personaje, iguales en todas las páginas. Nunca pedimos fotos de menores."],
        ["Historias que ayudan", "Miedo a la oscuridad, celos de un hermanito, decir la verdad… Plantillas escritas y revisadas, no texto al azar."],
        ["En castellano y en català", "El cuento entero, los correos y la web, en los dos idiomas."],
        ["Regalo de última hora", "El PDF llega en menos de 2 horas. Perfecto para Nochebuena o la noche de Reyes."],
      ],
    },
    garantia: "Si algo no te gusta, te lo rehacemos gratis una vez.",
    fechas: (navidad: string, reyes: string) => `Libro impreso: pide antes del ${navidad} para Navidad y antes del ${reyes} para Reyes. El PDF llega siempre a tiempo.`,
    faqTitulo: "Preguntas frecuentes",
    faq: [
      ["¿Necesitáis fotos de mi hijo?", "No. Elegís entre nuestros dos protagonistas, un niño y una niña. No guardamos imágenes de menores."],
      ["¿Cuánto tarda?", "El PDF, menos de 2 horas. El libro de tapa dura se imprime bajo demanda y tarda unos 5 a 7 días laborables a península."],
      ["¿Lo puedo ver antes de pagar?", "Sí: la vista previa gratuita muestra la portada, la dedicatoria y las primeras páginas con su nombre."],
      ["¿Está hecho con inteligencia artificial?", "Sí, con ayuda de IA y siempre a partir de plantillas escritas y revisadas por nosotros. Lo indicamos en el propio libro."],
      ["¿Puedo devolverlo?", "Al ser un producto personalizado no hay derecho de desistimiento, pero si algo no te gusta te lo rehacemos gratis una vez."],
    ],
    form: {
      titulo: "Crea su cuento",
      sub: "Tarda un minuto. Después verás la vista previa gratis.",
      nombre: "Nombre del niño o la niña", edad: "Edad", protagonista: "Protagonista", nino: "Niño", nina: "Niña",
      ciudad: "Ciudad o pueblo", companero: "Su compañero de aventuras", mascota: "Nombre de la mascota o del peluche", mascotaDesc: "¿Cómo es? (opcional: color, tamaño)",
      aficion: "Lo que más le gusta", coleccion: "Colección", tema: "Miedo o valor a tratar", idioma: "Idioma del cuento",
      bebe: "Nombre del bebé (opcional)", bebeGenero: "El bebé es", hermanito: "niño", hermanita: "niña",
      dedicatoria: "Dedicatoria (opcional; si la dejas vacía, te proponemos una)", dePartede: "De parte de (opcional)", dePartedeEj: "los abuelos, la tía Carmen…",
      enviar: "Ver la vista previa gratis", creando: "Escribiendo su cuento…", error: "No hemos podido crear el cuento. Inténtalo de nuevo.",
      privacidad: "Solo usamos estos datos para escribir el cuento. Nada de fotos.",
    },
    vista: {
      titulo: "Vista previa", aviso: "Estas son las primeras páginas. El cuento completo tiene 12 páginas ilustradas.",
      ilustracionMuestra: "Ilustración de muestra: en tu cuento aparecerán su mascota y su ciudad.",
      elige: "Elige el formato", pagar: "Comprar", email: "Tu correo (para enviarte el cuento)", cambiar: "Cambiar datos",
      restantes: "…y 9 páginas más.", libroIncluyePdf: "Incluye también el PDF al momento.",
    },
    pedido: {
      titulo: "Tu pedido", gracias: "¡Gracias! Hemos recibido el pago.",
      estados: { borrador: "Pendiente de pago", pagado: "Pagado", ilustrando: "Ilustrando tu cuento", maquetando: "Montando el libro", entregado: "Entregado: revisa tu correo", imprenta: "Preparando la impresión", enviado_imprenta: "En la imprenta", enviado: "Enviado", incidencia: "Lo estamos revisando; te escribiremos pronto" } as Record<string, string>,
      descargar: "Descargar el PDF", soporte: "¿Algo no va bien? Escríbenos a",
    },
    pie: { legal: "Aviso legal", privacidad: "Privacidad", cookies: "Cookies", condiciones: "Condiciones de venta", afiliados: "Programa de afiliadas", ia: "Textos e ilustraciones creados con ayuda de IA a partir de plantillas propias." },
  },
  ca: {
    marca: "Lunilla",
    lema: "Contes personalitzats amb nom, il·lustrats amb estima",
    nav: { crear: "Crear conte", muestras: "Veure mostres", ideas: "Idees de regal", afiliados: "Afiliades", otroIdioma: "Castellano" },
    hero: {
      titulo: "Un conte on el teu petit és el protagonista",
      sub: "Amb el seu nom, la seva ciutat, la seva mascota i el que més li agrada. 12 pàgines il·lustrades i una història que l'ajuda amb una por o un valor. Sense fotos de l'infant.",
      cta: "Crear el seu conte gratis",
      nota: "Veus 3 pàgines abans de pagar. PDF en menys de 2 hores.",
    },
    precios: { pdf: "PDF per llegir i imprimir", tapaDura: "Llibre de tapa dura", envio: "enviament inclòs", entrega: "Al teu correu en menys de 2 hores", entregaLibro: "Imprès sota demanda i enviat a casa (inclou el PDF)" },
    comoFunciona: {
      titulo: "Així de fàcil",
      pasos: [
        ["Explica'ns com és", "Nom, edat, ciutat, mascota, afició i una por o un valor que vulguis treballar."],
        ["Mira la vista prèvia", "T'ensenyem gratis les primeres pàgines amb el seu nom."],
        ["Rep-lo", "El PDF arriba al teu correu; el llibre imprès, a casa."],
      ],
    },
    colecciones: "Quatre col·leccions",
    muestras: { titulo: "Dos contes de mostra, de debò", sub: "En Leo i la Martina són inventats; els seus contes estan fets amb el mateix sistema que farà el teu.", leer: "Llegir el conte" },
    porque: {
      titulo: "Per què Lunilla",
      puntos: [
        ["Il·lustració d'àlbum, no fotos enganxades", "Dos protagonistes dibuixats amb full de personatge, iguals a totes les pàgines. Mai no demanem fotos de menors."],
        ["Històries que ajuden", "Por de la foscor, gelosia d'un germanet, dir la veritat… Plantilles escrites i revisades, no text a l'atzar."],
        ["En català i en castellà", "El conte sencer, els correus i el web, en les dues llengües."],
        ["Regal d'última hora", "El PDF arriba en menys de 2 hores. Perfecte per a la nit de Nadal o la nit de Reis."],
      ],
    },
    garantia: "Si alguna cosa no t'agrada, te'l refem gratis una vegada.",
    fechas: (navidad: string, reyes: string) => `Llibre imprès: demana'l abans del ${navidad} per a Nadal i abans del ${reyes} per a Reis. El PDF arriba sempre a temps.`,
    faqTitulo: "Preguntes freqüents",
    faq: [
      ["Necessiteu fotos del meu fill?", "No. Trieu entre els nostres dos protagonistes, un nen i una nena. No guardem imatges de menors."],
      ["Quant tarda?", "El PDF, menys de 2 hores. El llibre de tapa dura s'imprimeix sota demanda i tarda uns 5 a 7 dies laborables a la península."],
      ["El puc veure abans de pagar?", "Sí: la vista prèvia gratuïta mostra la portada, la dedicatòria i les primeres pàgines amb el seu nom."],
      ["Està fet amb intel·ligència artificial?", "Sí, amb ajuda d'IA i sempre a partir de plantilles escrites i revisades per nosaltres. Ho indiquem al mateix llibre."],
      ["El puc tornar?", "En ser un producte personalitzat no hi ha dret de desistiment, però si alguna cosa no t'agrada te'l refem gratis una vegada."],
    ],
    form: {
      titulo: "Crea el seu conte",
      sub: "Tarda un minut. Després veuràs la vista prèvia gratis.",
      nombre: "Nom del nen o la nena", edad: "Edat", protagonista: "Protagonista", nino: "Nen", nina: "Nena",
      ciudad: "Ciutat o poble", companero: "El seu company d'aventures", mascota: "Nom de la mascota o del peluix", mascotaDesc: "Com és? (opcional: color, mida)",
      aficion: "El que més li agrada", coleccion: "Col·lecció", tema: "Por o valor a treballar", idioma: "Idioma del conte",
      bebe: "Nom del nadó (opcional)", bebeGenero: "El nadó és", hermanito: "nen", hermanita: "nena",
      dedicatoria: "Dedicatòria (opcional; si la deixes buida, te'n proposem una)", dePartede: "De part de (opcional)", dePartedeEj: "els avis, la tieta Núria…",
      enviar: "Veure la vista prèvia gratis", creando: "Escrivint el seu conte…", error: "No hem pogut crear el conte. Torna-ho a provar.",
      privacidad: "Només fem servir aquestes dades per escriure el conte. Res de fotos.",
    },
    vista: {
      titulo: "Vista prèvia", aviso: "Aquestes són les primeres pàgines. El conte complet té 12 pàgines il·lustrades.",
      ilustracionMuestra: "Il·lustració de mostra: al teu conte hi sortiran la seva mascota i la seva ciutat.",
      elige: "Tria el format", pagar: "Comprar", email: "El teu correu (per enviar-te el conte)", cambiar: "Canviar dades",
      restantes: "…i 9 pàgines més.", libroIncluyePdf: "Inclou també el PDF a l'instant.",
    },
    pedido: {
      titulo: "La teva comanda", gracias: "Gràcies! Hem rebut el pagament.",
      estados: { borrador: "Pendent de pagament", pagado: "Pagat", ilustrando: "Il·lustrant el teu conte", maquetando: "Muntant el llibre", entregado: "Lliurat: mira el teu correu", imprenta: "Preparant la impressió", enviado_imprenta: "A la impremta", enviado: "Enviat", incidencia: "Ho estem revisant; t'escriurem aviat" } as Record<string, string>,
      descargar: "Descarregar el PDF", soporte: "Alguna cosa no va bé? Escriu-nos a",
    },
    pie: { legal: "Avís legal", privacidad: "Privacitat", cookies: "Galetes", condiciones: "Condicions de venda", afiliados: "Programa d'afiliades", ia: "Textos i il·lustracions creats amb ajuda d'IA a partir de plantilles pròpies." },
  },
} as const;

export type Textos = (typeof T)["es"];
export const t = (i: Idioma) => T[i] as unknown as Textos;
export const pref = (i: Idioma) => (i === "ca" ? "/ca" : "");
