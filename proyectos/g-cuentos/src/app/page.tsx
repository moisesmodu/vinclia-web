import type { Metadata } from "next";
import { Inicio } from "@/components/Inicio";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({
  idioma: "es", es: "/", ca: "/ca", xDefault: true, absoluto: true,
  title: "Cuento personalizado para niños con su nombre · Lunilla",
  description: "Cuento infantil personalizado con el nombre, la ciudad y la mascota de tu peque. Vista previa gratis, PDF en menos de 2 horas (7,90 €) o libro de tapa dura con envío incluido (36,90 €). En castellano y catalán.",
});
export default function Page() { return <Inicio idioma="es" />; }
