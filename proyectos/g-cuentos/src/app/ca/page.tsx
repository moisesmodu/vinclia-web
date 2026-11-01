import type { Metadata } from "next";
import { Inicio } from "@/components/Inicio";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({
  idioma: "ca", es: "/", ca: "/ca", xDefault: true, absoluto: true,
  title: "Conte personalitzat per a nens i nenes amb el seu nom · Lunilla",
  description: "Conte infantil personalitzat amb el nom, la ciutat i la mascota del teu petit, escrit en català. Vista prèvia gratis, PDF en menys de 2 hores (7,90 €) o llibre de tapa dura amb enviament inclòs (36,90 €).",
  imagen: "/muestras/la-martina-i-els-secrets-de-lleida/00.webp",
});
export default function Page() { return <Inicio idioma="ca" />; }
