import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, degrees, LineCapStyle, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import type { Cuento } from "./cuento";
import { aficion, arropa, colorFav, companero, type ColeccionId, type Idioma } from "./catalogo";
import { articuloCa, type DatosNino } from "./rellenar";

// ── Medidas ────────────────────────────────────────────────────────────────
// Libro cuadrado 200 × 200 mm (Gelato «photobooks-hardcover 200x200»), 28 páginas interiores:
//   1 portadilla · 2 dedicatoria · 3 «este libro pertenece a» · 4 «así es…» (ficha) ·
//   5… cuento (18 o 22 páginas, cada una con su ilustración arriba y el texto debajo) · «Fin» ·
//   páginas para la familia hasta completar (diploma, dibujo, foto, notas) · colofón.
// El sangrado y las medidas de la cubierta se leen de la API de la imprenta cuando hay clave
// (imprenta/gelato.ts → dimensionesCubierta); estos valores son los de reserva.
export const MM = 72 / 25.4;
export const LIBRO = { corteMm: 200, sangradoMm: 4, paginas: 28, dpi: 300 };

// Familia Lunilla (marcas/tokens.json)
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const CREMA = hex("#FFF8EC");
const TINTA = hex("#1B2444");
const AZUL_NOCHE = hex("#2B3A67");
const TERRACOTA = hex("#2B3A67"); // acento de textos pequeños: azul luna
const AMARILLO = hex("#F5C84C");
const ROSA = hex("#F7D6E0");

// Web que se imprime en el libro: la de URL_BASE (lunilla.es solo cuando el dominio sea nuestro).
const WEB = () => (process.env.URL_BASE ?? "https://lunilla.vercel.app").replace(/^https?:\/\//, "").replace(/\/$/, "");

export type ModoPdf = "imprenta" | "pantalla";

export interface EntradaPdf {
  cuento: Cuento;
  datos: DatosNino;
  idioma: Idioma;
  nombre: string;
  imagenes: Buffer[]; // N+1: [0] portada (cuadrada), [1..N] páginas (apaisadas 3:2)
  modo: ModoPdf;
  sangradoMm?: number;
}

const TEXTOS = {
  es: { pertenece: "Este libro pertenece a", fin: "Fin", marca: "Un cuento de Lunilla", colofon: (n: string) => `Este cuento se escribió e ilustró solo para ${n}.\nTexto e ilustraciones creados con ayuda de inteligencia artificial a partir de plantillas escritas y revisadas por el taller de Lunilla. Impreso bajo demanda.\n${WEB()}` },
  ca: { pertenece: "Aquest llibre és de", fin: "Fi", marca: "Un conte de Lunilla", colofon: (n: string) => `Aquest conte es va escriure i il·lustrar només per a ${n}.\nText i il·lustracions creats amb ajuda d'intel·ligència artificial a partir de plantilles escrites i revisades pel taller de Lunilla. Imprès sota demanda.\n${WEB()}` },
};

interface Fuentes { texto: PDFFont; cursiva: PDFFont; titulo: PDFFont; negrita: PDFFont }

async function cargarFuentes(doc: PDFDocument): Promise<Fuentes> {
  doc.registerFontkit(fontkit);
  const dir = path.join(process.cwd(), "assets", "fuentes");
  const f = (n: string) => readFile(path.join(dir, n));
  const [r, i, t, b] = await Promise.all([f("Nunito-Regular.ttf"), f("Nunito-Italic.ttf"), f("Baloo2-Bold.ttf"), f("Nunito-Bold.ttf")]);
  return {
    texto: await doc.embedFont(r, { subset: true }),
    cursiva: await doc.embedFont(i, { subset: true }),
    // Baloo 2 se incrusta entera: el subconjunto de pdf-lib pierde glifos con sus tablas OpenType.
    titulo: await doc.embedFont(t, { subset: false }),
    negrita: await doc.embedFont(b, { subset: true }),
  };
}

/** Parte un texto en líneas que caben en `ancho` puntos (respeta saltos de línea). */
export function partirLineas(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const out: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho || !linea) linea = prueba;
      else {
        out.push(linea);
        linea = palabra;
      }
    }
    out.push(linea);
  }
  return out;
}

function bloqueCentrado(
  page: PDFPage, texto: string, fuente: PDFFont, cx: number, cy: number, ancho: number,
  tamMax: number, altoMax: number, color = TINTA, interlineado = 1.45,
) {
  let tam = tamMax;
  let lineas = partirLineas(texto, fuente, tam, ancho);
  while (lineas.length * tam * interlineado > altoMax && tam > 10) {
    tam -= 0.5;
    lineas = partirLineas(texto, fuente, tam, ancho);
  }
  const alto = lineas.length * tam * interlineado;
  let y = cy + alto / 2 - tam;
  for (const l of lineas) {
    const w = fuente.widthOfTextAtSize(l, tam);
    page.drawText(l, { x: cx - w / 2, y, size: tam, font: fuente, color });
    y -= tam * interlineado;
  }
  return tam;
}

function adorno(page: PDFPage, cx: number, y: number) {
  for (const dx of [-14, 0, 14]) page.drawCircle({ x: cx + dx, y, size: dx === 0 ? 2.6 : 1.8, color: AMARILLO });
}

/** Lunilla tal como está en marcas/logos/g-cuentos-icono.svg (viewBox 56×56), centrada en (cx, cy) con lado `lado`. */
export function dibujarLunilla(page: PDFPage, cx: number, cy: number, lado: number) {
  const k = lado / 56;
  const o = { x: cx - lado / 2, y: cy + lado / 2, scale: k };
  page.drawSvgPath("M34.2 5.9A23 23 0 1 0 41 47A21 21 0 0 1 34.2 5.9Z", { ...o, color: AMARILLO });
  page.drawCircle({ x: o.x + 13.5 * k, y: o.y - 24 * k, size: 2.4 * k, color: TINTA });
  page.drawCircle({ x: o.x + 10.5 * k, y: o.y - 31 * k, size: 2.6 * k, color: ROSA });
  page.drawSvgPath("M13 35q4 3 8 0", { ...o, borderColor: TINTA, borderWidth: 2.2 * k, borderLineCap: LineCapStyle.Round });
  page.drawSvgPath("M9 40q8 6 17 3", { ...o, borderColor: AZUL_NOCHE, borderWidth: 5.5 * k, borderLineCap: LineCapStyle.Round });
}

async function prepararImagen(buf: Buffer, anchoPx: number, altoPx: number, calidad: number): Promise<Buffer> {
  return sharp(buf).resize(anchoPx, altoPx, { fit: "cover", kernel: "lanczos3" }).flatten({ background: "#fbf6ec" })
    .jpeg({ quality: calidad, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
}

// Altura de la ilustración en las páginas del cuento (fracción del corte, más el sangrado superior).
const ALTO_ILUSTRACION = 0.64;

const EXTRAS = {
  es: {
    ficha: (n: string) => `Así es ${n}`,
    campos: { edad: "Edad", ciudad: "Vive en", compa: "Su compañero", aficion: "Le encanta", color: "Color favorito", amigo: "Mejor amistad", arropa: "Buenas noches de", rasgo: "Algo único" },
    anos: (e: number) => `${e} años`,
    diploma: "Diploma",
    diplomaTexto: (c: ColeccionId, n: string, f: boolean) => ({
      dormir: `Lunilla certifica que ${n} ya sabe mirar la noche sin miedo.`,
      valores: `Lunilla certifica que ${n} tiene un corazón que hace crecer cosas bonitas.`,
      hermanito: `Lunilla certifica que ${n} es ${f ? "la mejor hermana mayor" : "el mejor hermano mayor"} del universo.`,
      ciudad: `Lunilla certifica que ${n} es ${f ? "exploradora oficial" : "explorador oficial"} de su ciudad.`,
    })[c],
    firma: "Firmado: Lunilla",
    dibujo: (n: string) => `Dibuja aquí a ${n} con Lunilla`,
    foto: (deN: string, e: number) => `Pega aquí una foto ${deN} a los ${e} años`,
    fecha: "Fecha:",
    notas: (n: string) => `Lo que queremos decirte, ${n}`,
  },
  ca: {
    ficha: (n: string) => `Així és ${n}`,
    campos: { edad: "Edat", ciudad: "Viu a", compa: "El seu company", aficion: "Li encanta", color: "Color preferit", amigo: "Millor amistat", arropa: "Bona nit de", rasgo: "Alguna cosa única" },
    anos: (e: number) => `${e} anys`,
    diploma: "Diploma",
    diplomaTexto: (c: ColeccionId, n: string, f: boolean) => ({
      dormir: `La Lunilla certifica que ${n} ja sap mirar la nit sense por.`,
      valores: `La Lunilla certifica que ${n} té un cor que fa créixer coses boniques.`,
      hermanito: `La Lunilla certifica que ${n} és ${f ? "la millor germana gran" : "el millor germà gran"} de l'univers.`,
      ciudad: `La Lunilla certifica que ${n} és ${f ? "exploradora oficial" : "explorador oficial"} de la seva ciutat.`,
    })[c],
    firma: "Signat: Lunilla",
    dibujo: (n: string) => `Dibuixa aquí ${n} amb la Lunilla`,
    foto: (deN: string, e: number) => `Enganxa aquí una foto ${deN} als ${e} anys`,
    fecha: "Data:",
    notas: (n: string) => `El que et volem dir, ${n}`,
  },
};

/** Interior del libro (28 páginas). En modo pantalla añade cubierta delante y contraportada detrás. */
export async function generarInterior(e: EntradaPdf): Promise<Uint8Array> {
  const imprenta = e.modo === "imprenta";
  const sMm = imprenta ? (e.sangradoMm ?? LIBRO.sangradoMm) : 0;
  const b = sMm * MM;
  const corte = LIBRO.corteMm * MM;
  const lado = corte + 2 * b;
  const ppm = imprenta ? LIBRO.dpi / 25.4 : 1600 / LIBRO.corteMm; // píxeles por mm
  const calidad = imprenta ? 92 : 80;
  const t = TEXTOS[e.idioma];
  const x = EXTRAS[e.idioma];
  const d = e.datos;
  const N = e.cuento.paginas.length;
  if (e.imagenes.length !== N + 1) throw new Error(`Hay ${e.imagenes.length} ilustraciones para ${N} páginas (+ portada)`);

  const doc = await PDFDocument.create();
  doc.setTitle(e.cuento.titulo);
  doc.setAuthor("Lunilla");
  doc.setCreator(`Lunilla · ${WEB()}`);
  doc.setLanguage(e.idioma === "ca" ? "ca-ES" : "es-ES");
  const F = await cargarFuentes(doc);
  const altoIlu = b + corte * ALTO_ILUSTRACION; // desde el borde superior (con sangrado)
  const ladoPx = Math.round((LIBRO.corteMm + 2 * sMm) * ppm);
  const altoIluPx = Math.round((altoIlu / MM) * ppm);
  const imgs: PDFImage[] = await Promise.all(
    e.imagenes.map(async (buf, i) => doc.embedJpg(await prepararImagen(buf, ladoPx, i === 0 ? ladoPx : altoIluPx, calidad))),
  );

  const nueva = (fondo = CREMA) => {
    const p = doc.addPage([lado, lado]);
    p.drawRectangle({ x: 0, y: 0, width: lado, height: lado, color: fondo });
    if (imprenta) {
      p.setTrimBox(b, b, corte, corte);
      p.setBleedBox(0, 0, lado, lado);
    }
    return p;
  };
  const cx = lado / 2;
  const cy = lado / 2;
  const anchoTexto = corte - 2 * 30 * MM;
  const numero = (p: PDFPage, n: number) => {
    const s = String(n);
    p.drawText(s, { x: cx - F.texto.widthOfTextAtSize(s, 9) / 2, y: b + 8 * MM, size: 9, font: F.texto, color: TERRACOTA });
  };
  const titular = (p: PDFPage, texto: string, y: number) => bloqueCentrado(p, texto, F.titulo, cx, y, anchoTexto + 20 * MM, 24, 22 * MM, AZUL_NOCHE, 1.15);
  const marco = (p: PDFPage, y: number, h: number) => {
    const m = 22 * MM;
    p.drawRectangle({ x: b + m, y, width: corte - 2 * m, height: h, borderColor: AMARILLO, borderWidth: 2, borderDashArray: [6, 5], color: hex("#FFFDF7") });
  };
  const nombreCa = e.idioma === "ca" ? articuloCa(e.nombre, d.genero) : e.nombre; // «la Martina», «en Pau»
  const deNombre = /^en /.test(nombreCa) ? `d'${nombreCa}` : `de ${nombreCa}`;

  if (!imprenta) dibujarFrontal(nueva(), imgs[0], e.cuento.titulo, t.marca, F, { x: 0, y: 0, w: lado, h: lado });

  // 1 · Portadilla
  {
    const p = nueva();
    bloqueCentrado(p, e.cuento.titulo, F.titulo, cx, b + corte - 42 * MM, anchoTexto, 26, 40 * MM, AZUL_NOCHE, 1.2);
    const s = 105 * MM;
    p.drawImage(imgs[0], { x: cx - s / 2, y: b + 28 * MM, width: s, height: s });
    const w = F.texto.widthOfTextAtSize(t.marca, 10);
    dibujarLunilla(p, cx - w / 2 - 6 * MM, b + 17.3 * MM, 9 * MM);
    p.drawText(t.marca, { x: cx - w / 2, y: b + 16 * MM, size: 10, font: F.texto, color: TERRACOTA });
  }
  // 2 · Dedicatoria
  {
    const p = nueva();
    adorno(p, cx, cy + 32 * MM);
    bloqueCentrado(p, e.cuento.dedicatoria, F.cursiva, cx, cy, anchoTexto - 10 * MM, 15, 70 * MM);
  }
  // 3 · «Este libro pertenece a»
  {
    const p = nueva();
    bloqueCentrado(p, t.pertenece, F.texto, cx, cy + 12 * MM, anchoTexto, 13, 20 * MM, TERRACOTA);
    bloqueCentrado(p, e.nombre, F.titulo, cx, cy - 6 * MM, anchoTexto, 34, 30 * MM, AZUL_NOCHE, 1.1);
    adorno(p, cx, cy - 24 * MM);
  }
  // 4 · Ficha «Así es…» con lo que ha contado la familia
  {
    const p = nueva();
    titular(p, x.ficha(nombreCa), b + corte - 30 * MM);
    adorno(p, cx, b + corte - 44 * MM);
    const c = x.campos;
    const filas: [string, string][] = [
      [c.edad, x.anos(d.edad)],
      [c.ciudad, d.ciudad],
      [c.compa, `${d.mascota} (${companero(d.companero).etiqueta[e.idioma].toLowerCase()})`],
      [c.aficion, aficion(d.aficion).etiqueta[e.idioma]],
      [c.color, colorFav(d.color).etiqueta[e.idioma]],
      ...(d.amigo ? [[c.amigo, d.amigo] as [string, string]] : []),
      [c.arropa, arropa(d.arropa).etiqueta[e.idioma]],
      ...(d.rasgo ? [[c.rasgo, d.rasgo] as [string, string]] : []),
    ];
    let y = b + corte - 62 * MM;
    const xe = b + 26 * MM, xv = b + 80 * MM, anchoV = corte - 80 * MM - 24 * MM;
    for (const [k, v] of filas) {
      p.drawText(k, { x: xe, y, size: 13, font: F.negrita, color: TERRACOTA });
      const lineas = partirLineas(v, F.texto, 15, anchoV).slice(0, 3);
      lineas.forEach((l, i) => p.drawText(l, { x: xv, y: y - i * 19, size: 15, font: F.texto, color: TINTA }));
      y -= Math.max(1, lineas.length) * 19 + 14;
    }
    dibujarLunilla(p, b + corte - 28 * MM, b + 24 * MM, 16 * MM);
    numero(p, 4);
  }
  // 5… · El cuento: ilustración apaisada a sangre arriba, texto debajo
  const peques = N <= 18;
  e.cuento.paginas.forEach((texto, i) => {
    const p = nueva();
    p.drawImage(imgs[i + 1], { x: 0, y: lado - altoIlu, width: lado, height: altoIlu });
    // Borde ondulado suave entre la ilustración y el papel
    const yb = lado - altoIlu;
    p.drawSvgPath(`M0 0 Q ${lado / 4} 7 ${lado / 2} 0 T ${lado} 0 L ${lado} -9 L 0 -9 Z`, { x: 0, y: yb, color: CREMA });
    const altoTexto = yb - b - 14 * MM;
    bloqueCentrado(p, texto, F.texto, cx, b + 12 * MM + altoTexto / 2, corte - 2 * 18 * MM, peques ? 21 : 17, altoTexto, TINTA, 1.4);
    numero(p, 5 + i);
  });
  // «Fin»
  {
    const p = nueva();
    dibujarLunilla(p, cx, cy + 25 * MM, 34 * MM);
    bloqueCentrado(p, t.fin, F.titulo, cx, cy - 10 * MM, anchoTexto, 34, 20 * MM, AZUL_NOCHE);
    adorno(p, cx, cy - 26 * MM);
  }
  // Páginas para la familia hasta completar las 28 (con 22 páginas de cuento no queda hueco)
  const huecos = LIBRO.paginas - (4 + N + 1 + 1);
  const extras: ((p: PDFPage) => void)[] = [
    (p) => {
      p.drawRectangle({ x: b + 14 * MM, y: b + 14 * MM, width: corte - 28 * MM, height: corte - 28 * MM, borderColor: AMARILLO, borderWidth: 3 });
      p.drawRectangle({ x: b + 18 * MM, y: b + 18 * MM, width: corte - 36 * MM, height: corte - 36 * MM, borderColor: AZUL_NOCHE, borderWidth: 0.8 });
      bloqueCentrado(p, x.diploma, F.titulo, cx, b + corte - 45 * MM, anchoTexto, 36, 20 * MM, AZUL_NOCHE);
      bloqueCentrado(p, e.nombre, F.titulo, cx, cy + 12 * MM, anchoTexto, 30, 18 * MM, TERRACOTA);
      bloqueCentrado(p, x.diplomaTexto(d.coleccion, nombreCa, d.genero === "f"), F.cursiva, cx, cy - 12 * MM, anchoTexto, 14, 30 * MM);
      dibujarLunilla(p, cx + 30 * MM, b + 42 * MM, 16 * MM);
      p.drawLine({ start: { x: cx - 50 * MM, y: b + 36 * MM }, end: { x: cx + 12 * MM, y: b + 36 * MM }, thickness: 0.6, color: TINTA });
      p.drawText(x.firma, { x: cx - 50 * MM, y: b + 30 * MM, size: 9, font: F.texto, color: TERRACOTA });
    },
    (p) => {
      titular(p, x.dibujo(nombreCa), b + corte - 26 * MM);
      marco(p, b + 22 * MM, corte - 62 * MM);
      dibujarLunilla(p, b + corte - 30 * MM, b + 30 * MM, 12 * MM);
    },
    (p) => {
      titular(p, x.foto(deNombre, d.edad), b + corte - 26 * MM);
      marco(p, b + 44 * MM, corte - 84 * MM);
      p.drawText(x.fecha, { x: b + 22 * MM, y: b + 30 * MM, size: 11, font: F.negrita, color: TERRACOTA });
      p.drawLine({ start: { x: b + 40 * MM, y: b + 30 * MM }, end: { x: b + 110 * MM, y: b + 30 * MM }, thickness: 0.6, color: TINTA });
    },
    (p) => {
      titular(p, x.notas(e.nombre), b + corte - 26 * MM);
      for (let y = b + corte - 50 * MM; y > b + 26 * MM; y -= 11 * MM)
        p.drawLine({ start: { x: b + 22 * MM, y }, end: { x: b + corte - 22 * MM, y }, thickness: 0.5, color: hex("#C9BFAE") });
      dibujarLunilla(p, cx, b + 16 * MM, 9 * MM);
    },
  ];
  for (let k = 0; k < huecos; k++) {
    const p = nueva();
    extras[k % extras.length](p);
    numero(p, 4 + N + 2 + k);
  }
  // 28 · Colofón
  {
    const p = nueva();
    dibujarLunilla(p, cx, cy + 30 * MM, 20 * MM);
    bloqueCentrado(p, t.colofon(e.nombre), F.texto, cx, cy - 10 * MM, anchoTexto, 9.5, 50 * MM, TINTA, 1.45);
  }
  if (!imprenta) {
    const p = nueva();
    bloqueCentrado(p, e.cuento.contraportada, F.cursiva, cx, cy + 10 * MM, anchoTexto, 16, 40 * MM);
    dibujarLunilla(p, cx, cy - 18 * MM, 18 * MM);
    bloqueCentrado(p, WEB(), F.titulo, cx, cy - 34 * MM, anchoTexto, 14, 10 * MM, TERRACOTA);
  }
  const total = doc.getPageCount();
  const esperado = LIBRO.paginas + (imprenta ? 0 : 2);
  if (total !== esperado) throw new Error(`El interior tiene ${total} páginas y debería tener ${esperado}`);
  return doc.save();
}

interface Rect { x: number; y: number; w: number; h: number }

/** Portada: la ilustración cubre `img` (con sangrado/solapas) y el título se coloca dentro de `vis` (lo que se ve). */
function dibujarFrontal(p: PDFPage, imagen: PDFImage, titulo: string, marca: string, F: Fuentes, img: Rect, vis: Rect = img) {
  p.drawImage(imagen, { x: img.x, y: img.y, width: img.w, height: img.h });
  // Banda del título en el tercio superior de la parte visible (las ilustraciones de portada dejan ese hueco).
  const lado = Math.min(vis.w, vis.h);
  const bandaAlto = lado * 0.24;
  const margen = lado * 0.07;
  // La banda deja libre la esquina superior derecha: ahí vive Lunilla en todas las portadas.
  const bandaAncho = (vis.w - 2 * margen) * 0.7;
  const yBanda = vis.y + vis.h - margen - bandaAlto;
  p.drawRectangle({ x: vis.x + margen, y: yBanda, width: bandaAncho, height: bandaAlto, color: CREMA, opacity: 0.9 });
  const cxBanda = vis.x + margen + bandaAncho / 2;
  bloqueCentrado(p, titulo, F.titulo, cxBanda, yBanda + bandaAlto * 0.58, bandaAncho - 20, lado / 17, bandaAlto * 0.62, AZUL_NOCHE, 1.1);
  const tam = lado / 55;
  const w = F.texto.widthOfTextAtSize(marca, tam);
  p.drawText(marca, { x: cxBanda - w / 2, y: yBanda + bandaAlto * 0.1, size: tam, font: F.texto, color: TERRACOTA });
}

export interface DimensionesCubierta {
  anchoMm: number; // ancho total del pliego (contra + lomo + tapa + envolturas)
  altoMm: number;
  lomoMm: number;
  envolturaMm: number; // lo que se dobla por dentro de la tapa (incluye sangrado)
}

// Reserva hasta leer la API: tapa dura 200×200 con 28 págs. (estimación, se verifica con la API)
export const CUBIERTA_RESERVA: DimensionesCubierta = { anchoMm: 2 * 200 + 6 + 2 * 18, altoMm: 200 + 2 * 18, lomoMm: 6, envolturaMm: 18 };

/** Pliego de cubierta para tapa dura: contraportada | lomo | portada. */
export async function generarCubierta(e: Omit<EntradaPdf, "modo">, dim: DimensionesCubierta = CUBIERTA_RESERVA): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${e.cuento.titulo} · cubierta`);
  const F = await cargarFuentes(doc);
  const W = dim.anchoMm * MM, H = dim.altoMm * MM, env = dim.envolturaMm * MM, lomo = dim.lomoMm * MM;
  const tapa = (W - lomo - 2 * env) / 2;
  const p = doc.addPage([W, H]);
  p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREMA });
  const px = Math.round((((tapa + env) / MM) / 25.4) * LIBRO.dpi);
  const img = await doc.embedJpg(await sharp(e.imagenes[0]).resize(px, Math.round((H / MM / 25.4) * LIBRO.dpi), { fit: "cover" }).jpeg({ quality: 92 }).toBuffer());
  // Portada (derecha), a sangre hasta el borde exterior
  const xFront = env + tapa + lomo;
  dibujarFrontal(p, img, e.cuento.titulo, TEXTOS[e.idioma].marca, F, { x: xFront, y: 0, w: W - xFront, h: H }, { x: xFront, y: env, w: tapa, h: H - 2 * env });
  // Contraportada (izquierda)
  const cxBack = env + tapa / 2;
  bloqueCentrado(p, e.cuento.contraportada, F.cursiva, cxBack, H / 2 + 15 * MM, tapa - 40 * MM, 15, 50 * MM);
  dibujarLunilla(p, cxBack, env + 42 * MM, 20 * MM);
  bloqueCentrado(p, `Lunilla · ${WEB()}`, F.titulo, cxBack, env + 25 * MM, tapa - 40 * MM, 12, 10 * MM, TERRACOTA);
  bloqueCentrado(p, TEXTOS[e.idioma].colofon(e.nombre).split("\n")[1], F.texto, cxBack, env + 12 * MM, tapa - 50 * MM, 6.5, 12 * MM, TINTA, 1.35);
  // Lomo
  p.drawRectangle({ x: env + tapa, y: 0, width: lomo, height: H, color: AZUL_NOCHE });
  if (lomo >= 5 * MM) {
    const tam = Math.min(lomo * 0.55, 10);
    const txt = e.cuento.titulo.length > 48 ? `${e.cuento.titulo.slice(0, 45)}…` : e.cuento.titulo;
    const w = F.titulo.widthOfTextAtSize(txt, tam);
    p.drawText(txt, { x: env + tapa + lomo / 2 + tam * 0.35, y: H / 2 - w / 2, size: tam, font: F.titulo, color: CREMA, rotate: degrees(90) });
  }
  p.setTrimBox(env, env, W - 2 * env, H - 2 * env);
  return doc.save();
}
