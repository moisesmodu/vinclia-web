import {
  aficion,
  arropa,
  colorFav,
  companero,
  lugaresDe,
  tema,
  type ColeccionId,
  type Genero,
  type Idioma,
} from "./catalogo";

export interface DatosNino {
  nombre: string;
  edad: number;
  genero: Genero; // protagonista elegido: niño (m) o niña (f)
  ciudad: string;
  companero: string; // id de COMPANEROS
  mascota: string; // nombre de la mascota o del peluche
  mascotaDescripcion?: string; // "naranja con patas blancas"
  aficion: string; // id de AFICIONES
  coleccion: ColeccionId;
  tema: string; // id del tema dentro de la colección
  idioma: Idioma;
  bebe?: string; // nombre del hermanito (colección hermanito)
  bebeGenero?: Genero;
  dedicatoria?: string;
  deParteDe?: string;
  // Detalles de su mundo (opcionales; si faltan, la plantilla usa valores neutros)
  arropa?: string; // id de ARROPA: quién le da las buenas noches
  color?: string; // id de COLORES
  amigo?: string; // nombre de su mejor amigo o amiga
  amigoGenero?: Genero;
  rasgo?: string; // texto libre: algo único (lo teje la IA, no la plantilla)
  deseo?: string; // texto libre: un sueño o una idea para el cuento (lo teje la IA)
  aspecto?: Aspecto; // cómo es el protagonista en las ilustraciones
}

export interface Aspecto {
  piel: "clara" | "media" | "morena" | "oscura";
  pelo: "rubio" | "castano" | "pelirrojo" | "negro";
  peinado: "corto" | "rizado" | "largo" | "coletas";
  gafas: boolean;
  pecas: boolean;
}

const VOCAL = /^[aeiouàáèéíïòóúüh]/i;

/** Artículo personal catalán: "en Pau", "la Martina", "l'Oriol", "l'Anna", "la Isabel". */
export function articuloCa(nombre: string, genero: Genero): string {
  const n = nombre.trim();
  // h muda seguida de vocal también apostrofa (l'Helena); "l'" solo ante vocal
  if (VOCAL.test(n) && !/^h[^aeiouàáèéíïòóúü]/i.test(n)) {
    // «la» no se apostrofa ante i/u átonas: la Isabel, la Irene, la Inés, la Ivet (pero l'Irma, l'Úrsula)
    if (genero === "f" && /^h?[iuïü]/i.test(n) && !iniciaTonica(n)) return `la ${n}`;
    return `l'${n}`;
  }
  return genero === "m" ? `en ${n}` : `la ${n}`;
}

/** ¿La primera vocal del nombre es la tónica? (reglas de acentuación del catalán, para nombres sueltos) */
function iniciaTonica(n: string): boolean {
  const w = n.toLowerCase().split(/[\s-]/)[0];
  const tilde = w.search(/[àáèéíòóú]/);
  if (tilde >= 0) return tilde <= 1; // Íngrid, Úrsula → tónica; Inés → átona
  // Grupos vocálicos (la i/u entre vocales o tras otra vocal hace de semiconsonante)
  const grupos = w.match(/[aeiouïü]+/g) ?? [];
  if (grupos.length <= 1) return true; // monosílabo: Ian, Iu
  // Agudas: acaban en consonante que no sea -s, -en, -in → tónica la última; llanas: la penúltima
  const aguda = /[^aeiousn]$/.test(w) || (/n$/.test(w) && !/(en|in)$/.test(w));
  const tonica = aguda ? grupos.length - 1 : grupos.length - 2;
  return tonica === 0;
}

function preposicionDeCa(nombre: string, genero: Genero): string {
  const art = articuloCa(nombre, genero);
  if (art.startsWith("en ")) return `d'${art}`; // d'en Pau
  return `de ${art}`; // de la Martina, de l'Oriol
}

function deCiudad(ciudad: string, idioma: Idioma): string {
  if (idioma === "ca" && VOCAL.test(ciudad.trim())) return `d'${ciudad.trim()}`;
  return `de ${ciudad.trim()}`;
}

/** «su amiga Lucía» / «el seu amic Pau»; sin nombre, «sus amigos del cole». Solo sin concordancia verbal. */
function amigoFrase(d: DatosNino): string {
  const n = d.amigo?.trim();
  const ca = d.idioma === "ca";
  if (!n) return ca ? "els seus amics de l'escola" : "sus amigos del cole";
  const f = d.amigoGenero === "f";
  return ca ? `${f ? "la seva amiga" : "el seu amic"} ${n}` : `${f ? "su amiga" : "su amigo"} ${n}`;
}

const mayus = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function variables(d: DatosNino): Record<string, string> {
  const ca = d.idioma === "ca";
  const comp = companero(d.companero);
  const af = aficion(d.aficion);
  const lug = lugaresDe(d.ciudad);
  const elnom = ca ? articuloCa(d.nombre, d.genero) : d.nombre;
  const bebeNombre = d.bebe?.trim();
  const bebeG = d.bebeGenero ?? "m";
  const bebe = bebeNombre
    ? ca
      ? articuloCa(bebeNombre, bebeG)
      : bebeNombre
    : ca
      ? "el nadó"
      : "el bebé";
  const v: Record<string, string> = {
    nombre: ca ? elnom : d.nombre, // en catalán, {nombre} siempre lleva artículo
    nombrePelado: d.nombre,
    elnom,
    Elnom: mayus(elnom),
    delnom: ca ? preposicionDeCa(d.nombre, d.genero) : `de ${d.nombre}`,
    edad: String(d.edad),
    ciudad: d.ciudad.trim(),
    deciudad: deCiudad(d.ciudad, d.idioma),
    mascota: d.mascota.trim(),
    compa: `${comp.posesivo[d.idioma]} ${d.mascota.trim()}`,
    Compa: mayus(`${comp.posesivo[d.idioma]} ${d.mascota.trim()}`),
    aficion: af.frase[d.idioma],
    objeto: af.objeto[d.idioma],
    forma: af.forma[d.idioma],
    bebe,
    Bebe: mayus(bebe),
    bebeVoc: bebeNombre ?? (ca ? (bebeG === "m" ? "petitó" : "petitona") : bebeG === "m" ? "pequeñín" : "pequeñina"),
    arropa: arropa(d.arropa).texto[d.idioma],
    color: colorFav(d.color).texto[d.idioma],
    amigo: amigoFrase(d),
    lugarPlaza: lug.plaza[d.idioma],
    lugarAgua: lug.agua[d.idioma],
    lugarParque: lug.parque[d.idioma],
    lugarAlto: lug.alto[d.idioma],
  };
  const t = tema(d.coleccion, d.tema);
  for (const [k, val] of Object.entries(t.campos)) v[`tema.${k}`] = val[d.idioma];
  return v;
}

/**
 * Sustituye {variable} y {masculino|femenino}. Las variables pueden contener a su vez
 * marcadores (los campos de tema llevan {nombre} y {a|b}), así que se itera hasta estabilizar.
 * En una frase que empieza por {nombre} en catalán se usa el artículo en mayúscula.
 */
export function rellenar(texto: string, d: DatosNino, genero: Genero = d.genero): string {
  const v = variables(d);
  let s = texto;
  const gBebe = d.bebeGenero ?? "m";
  for (let i = 0; i < 4; i++) {
    const antes = s;
    s = s.replace(/\{b:([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (gBebe === "m" ? m : f));
    s = s.replace(/\{([^{}|]+)\|([^{}|]*)\}/g, (_, m, f) => (genero === "m" ? m : f));
    s = s.replace(/\{([A-Za-z.]+)\}/g, (todo, k: string) => (k in v ? v[k] : todo));
    if (s === antes) break;
  }
  // Los nombres propios no se contraen («de El Mehdi», no «del Mehdi»): se apartan antes de contraer.
  const nombres = [d.nombre, d.mascota, d.bebe, d.amigo].map((x) => x?.trim()).filter((x): x is string => !!x && /^els?\s/i.test(x));
  const guardados: string[] = [];
  for (const n of nombres) {
    const re = new RegExp(`(?<![\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "gu");
    s = s.replace(re, () => `\u0001${guardados.push(n) - 1}\u0002`);
  }
  s = contracciones(s, d.idioma);
  s = s.replace(/\u0001(\d+)\u0002/g, (_, i) => guardados[Number(i)]);
  // Mayúscula tras inicio de frase (catalán: "en Pau" al principio → "En Pau").
  s = s.replace(/(^|[.!?…]\s+|—|«)(en|la|l')(\s?)(?=\p{Lu})/gu, (_, pre, art, esp) => pre + mayus(art) + esp);
  return s;
}

/**
 * "de el" → "del", "a el" → "al"; en catalán también "dels", "als", "pel", "pels".
 * Límites de palabra Unicode (\b de JS no ve las vocales acentuadas: «hacía el» no es «a el»)
 * y respeta la mayúscula inicial («A el mercat» → «Al mercat»).
 */
export function contracciones(s: string, idioma: Idioma): string {
  const reglas: [string, string, string][] =
    idioma === "es"
      ? [["de", "el", "del"], ["a", "el", "al"]]
      : [["de", "en", "d'en"], ["de", "els", "dels"], ["de", "el", "del"], ["a", "els", "als"], ["a", "el", "al"], ["per", "els", "pels"], ["per", "el", "pel"]];
  for (const [p, art, c] of reglas) {
    const re = new RegExp(`(?<![\\p{L}'’])(${p}) ${art}(?![\\p{L}'’])`, "giu");
    s = s.replace(re, (_, pp: string) => (pp[0] === pp[0].toUpperCase() ? c[0].toUpperCase() + c.slice(1) : c));
  }
  return s;
}

export function quedanMarcadores(s: string): boolean {
  return /\{[^}]*\}/.test(s);
}
