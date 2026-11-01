import type { Metadata } from "next";
import { InfoAfiliados } from "@/components/PaginasAfiliados";
import { meta } from "@/lib/meta";
export const metadata: Metadata = meta({ idioma: "ca", es: "/afiliados", ca: "/ca/afiliades", title: "Programa d'afiliades (20 %)", description: "Recomana Lunilla al teu compte de maternitat o criança i guanya el 20 % de cada venda." });
export default function Page() { return <InfoAfiliados idioma="ca" />; }
