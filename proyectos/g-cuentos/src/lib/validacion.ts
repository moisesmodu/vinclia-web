import { z } from "zod";
import { AFICIONES, ARROPA, COLECCIONES, COLORES, COMPANEROS } from "./catalogo";
import type { DatosNino } from "./rellenar";

const limpio = (max: number) => z.string().trim().max(max).transform((s) => s.replace(/[<>{}|\\]/g, ""));

export const EsquemaDatos = z
  .object({
    nombre: limpio(24).pipe(z.string().min(1)),
    edad: z.coerce.number().int().min(2).max(8),
    genero: z.enum(["m", "f"]),
    ciudad: limpio(40).pipe(z.string().min(1)),
    companero: z.string().refine((v) => COMPANEROS.some((c) => c.id === v)),
    mascota: limpio(20).pipe(z.string().min(1)),
    mascotaDescripcion: limpio(80).optional(),
    aficion: z.string().refine((v) => AFICIONES.some((a) => a.id === v)),
    coleccion: z.enum(["dormir", "valores", "hermanito", "ciudad"]),
    tema: z.string(),
    idioma: z.enum(["es", "ca"]),
    bebe: limpio(20).optional(),
    bebeGenero: z.enum(["m", "f"]).optional(),
    dedicatoria: limpio(240).optional(),
    deParteDe: limpio(60).optional(),
    arropa: z.string().refine((v) => ARROPA.some((a) => a.id === v)).optional(),
    color: z.string().refine((v) => COLORES.some((c) => c.id === v)).optional(),
    amigo: limpio(24).optional(),
    amigoGenero: z.enum(["m", "f"]).optional(),
    rasgo: limpio(140).optional(),
    deseo: limpio(200).optional(),
    aspecto: z
      .object({
        piel: z.enum(["clara", "media", "morena", "oscura"]),
        pelo: z.enum(["rubio", "castano", "pelirrojo", "negro"]),
        peinado: z.enum(["corto", "rizado", "largo", "coletas"]),
        gafas: z.coerce.boolean(),
        pecas: z.coerce.boolean(),
      })
      .optional(),
  })
  .refine((d) => COLECCIONES.find((c) => c.id === d.coleccion)!.temas.some((t) => t.id === d.tema), { message: "tema no válido" })
  .transform((d) => {
    const vacio = (s?: string) => (s && s.length ? s : undefined);
    return {
      ...d,
      mascotaDescripcion: vacio(d.mascotaDescripcion),
      bebe: d.coleccion === "hermanito" ? vacio(d.bebe) : undefined,
      bebeGenero: d.coleccion === "hermanito" ? d.bebeGenero : undefined,
      dedicatoria: vacio(d.dedicatoria),
      deParteDe: vacio(d.deParteDe),
      amigo: vacio(d.amigo),
      amigoGenero: vacio(d.amigo) ? (d.amigoGenero ?? "m") : undefined,
      rasgo: vacio(d.rasgo),
      deseo: vacio(d.deseo),
    } satisfies DatosNino;
  });
