import {
  aficion,
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
}

const VOCAL = /^[aeiouàáèéíïòóúüh]/i;

/** Artículo personal catalán: "en Pau", "la Martina", "l'Oriol", "l'Anna". */
export function articuloCa(nombre: string, genero: Genero): string {
  const n = nombre.trim();
  // h muda seguida de vocal también apostrofa (l'Helena); "l'" solo ante vocal
  if (VOCAL.test(n) && !/^h[^aeiouàáèéíïòóúü]/i.test(n)) return `l'${n}`;
  return genero === "m" ? `en ${n}` : `la ${n}`;
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
  s = contracciones(s, d.idioma);
  // Mayúscula tras inicio de frase (catalán: "en Pau" al principio → "En Pau").
  s = s.replace(/(^|[.!?…]\s+|—|«)(en|la|l')(\s?)(?=\p{Lu})/gu, (_, pre, art, esp) => pre + mayus(art) + esp);
  return s;
}

/** "de el" → "del", "a el" → "al"; en catalán también "dels", "als", "pel", "pels". */
export function contracciones(s: string, idioma: Idioma): string {
  if (idioma === "es") return s.replace(/\b(de|a) el\b/g, (_, p) => (p === "de" ? "del" : "al"));
  return s
    .replace(/\bde els\b/g, "dels")
    .replace(/\bde el\b/g, "del")
    .replace(/\ba els\b/g, "als")
    .replace(/\ba el\b/g, "al")
    .replace(/\bper els\b/g, "pels")
    .replace(/\bper el\b/g, "pel");
}

export function quedanMarcadores(s: string): boolean {
  return /\{[^}]*\}/.test(s);
}
