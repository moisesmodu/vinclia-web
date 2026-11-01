import type { Metadata } from "next";
import { IndiceSeo } from "@/components/PaginaSeoVista";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({
  idioma: "ca", es: "/cuentos", ca: "/ca/contes",
  title: "Idees de regal i contes personalitzats per a infants",
  description: "Idees de regal per a Nadal, el tió, Reis i aniversaris, i contes personalitzats en català per a cada moment: dormir sense por, un germanet, valors i la seva ciutat.",
  imagen: "/muestras/la-martina-i-els-secrets-de-lleida/00.webp",
});
export default function Page() { return <IndiceSeo idioma="ca" />; }
