import type { DatosNino } from "./rellenar";

// Los dos cuentos de muestra de la landing (datos inventados, ningún niño real).
export const MUESTRAS: { slug: string; datos: DatosNino }[] = [
  {
    slug: "leo-y-la-luz-de-la-luna",
    datos: {
      nombre: "Leo", edad: 4, genero: "m", ciudad: "Zaragoza", companero: "gato", mascota: "Bigotes",
      mascotaDescripcion: "a ginger tabby cat with white paws and a white chest",
      aficion: "dinosaurios", coleccion: "dormir", tema: "oscuridad", idioma: "es", deParteDe: "los abuelos Pilar y Antonio",
    },
  },
  {
    slug: "la-martina-i-els-secrets-de-lleida",
    datos: {
      nombre: "Martina", edad: 6, genero: "f", ciudad: "Lleida", companero: "perro", mascota: "Núvol",
      mascotaDescripcion: "a small fluffy white dog with floppy ears and a pink nose",
      aficion: "dibujar", coleccion: "ciudad", tema: "curiosidad", idioma: "ca", deParteDe: "els avis",
    },
  },
];
