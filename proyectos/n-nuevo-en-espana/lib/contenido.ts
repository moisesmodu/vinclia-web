import fs from "node:fs";
import path from "node:path";
import { config, PAIS } from "./config";

export type Guia = {
  slug: string;
  titulo: string;
  resumen: string;
  paraQuien: string;
  actualizado: string;
  datosClave: { etiqueta: string; valor: string }[];
  pasos: { titulo: string; texto: string }[];
  documentos: { nombre: string; nota?: string }[];
  plazos: { texto: string }[];
  tasas: { concepto: string; importe: string; modelo?: string; nota?: string }[];
  errores: string[];
  checklist: { id: string; texto: string }[];
  recordatorio: { pregunta: string; avisos: { dias: number; texto: string }[] };
  variantes?: { titulo: string; texto: string }[];
  fuentes: { nombre: string; url: string; consultado: string }[];
};

// Lo que se publica gratis de una guía de pago (va al HTML estático).
export type ResumenGuia = Pick<Guia, "slug" | "titulo" | "resumen" | "paraQuien" | "actualizado" | "datosClave" | "fuentes"> & {
  gratis: boolean;
  idiomaContenido: string;
};

export type Pregunta = {
  slug: string;
  idioma: string;
  pregunta: string;
  descripcion: string;
  respuestaCorta: string;
  secciones: { titulo: string; texto: string }[];
  faq: { p: string; r: string }[];
  guia: string;
  actualizado: string;
  fuentes: { nombre: string; url: string; consultado: string }[];
};

const RAIZ = path.join(process.cwd(), "content", PAIS);

function leer<T>(ruta: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Devuelve la guía en el idioma pedido o, si no existe, en castellano. */
export function guia(slug: string, idioma: string): { guia: Guia; idiomaContenido: string } | null {
  for (const i of [idioma, config.idiomaPorDefecto]) {
    const g = leer<Guia>(path.join(RAIZ, i, "guias", `${slug}.json`));
    if (g) return { guia: g, idiomaContenido: i };
  }
  return null;
}

export function slugsGuias(): string[] {
  return config.ordenGuias.filter((s) => fs.existsSync(path.join(RAIZ, config.idiomaPorDefecto, "guias", `${s}.json`)));
}

export function esGratis(slug: string): boolean {
  return slug === config.guiaGratis;
}

export function resumen(slug: string, idioma: string): ResumenGuia | null {
  const r = guia(slug, idioma);
  if (!r) return null;
  const { guia: g, idiomaContenido } = r;
  return {
    slug: g.slug, titulo: g.titulo, resumen: g.resumen, paraQuien: g.paraQuien, actualizado: g.actualizado,
    datosClave: g.datosClave, fuentes: g.fuentes, gratis: esGratis(slug), idiomaContenido
  };
}

export function preguntas(idioma?: string): Pregunta[] {
  const out: Pregunta[] = [];
  const idiomas = idioma ? [idioma] : fs.existsSync(RAIZ) ? fs.readdirSync(RAIZ) : [];
  for (const i of idiomas) {
    const dir = path.join(RAIZ, i, "preguntas");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const p = leer<Pregunta>(path.join(dir, f));
      if (p) out.push({ ...p, idioma: i });
    }
  }
  return out;
}

export function pregunta(idioma: string, slug: string): Pregunta | null {
  const p = leer<Pregunta>(path.join(RAIZ, idioma, "preguntas", `${slug}.json`));
  return p ? { ...p, idioma } : null;
}
