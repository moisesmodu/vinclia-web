import { z } from "zod";
import { AFICIONES, COLECCIONES, COMPANEROS } from "./catalogo";
import type { DatosNino } from "./rellenar";

const limpio = (max: number) => z.string().trim().max(max).transform((s) => s.replace(/[<>{}|\\]/g, ""));

export const EsquemaDatos = z
  .object({
    nombre: limpio(24).pipe(z.string().min(1)),
    edad: z.coerce.number().int().min(1).max(10),
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
    } satisfies DatosNino;
  });
