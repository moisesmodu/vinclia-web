import type { Metadata } from "next";
import { IndiceSeo } from "@/components/PaginaSeoVista";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({
  idioma: "es", es: "/cuentos", ca: "/ca/contes",
  title: "Ideas de regalo y cuentos personalizados para niños",
  description: "Ideas de regalo para Navidad, Reyes y cumpleaños, y cuentos personalizados para cada momento: dormir sin miedo, un hermanito nuevo, valores y su ciudad.",
});
export default function Page() { return <IndiceSeo idioma="es" />; }
