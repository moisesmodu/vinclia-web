import type { Metadata } from "next";
import { InfoAfiliados } from "@/components/PaginasAfiliados";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({ idioma: "es", es: "/afiliados", ca: "/ca/afiliades", title: "Programa de afiliadas (20 %)", description: "Recomienda Lunilla en tu cuenta de maternidad o crianza y gana el 20 % de cada venta." });
export default function Page() { return <InfoAfiliados idioma="es" />; }
