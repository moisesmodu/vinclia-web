import type { Metadata } from "next";
import { InfoAfiliados } from "@/components/PaginasAfiliados";
export const metadata: Metadata = { title: "Programa d'afiliades (20 %)", description: "Recomana Lunilla al teu compte de maternitat o criança i guanya el 20 % de cada venda." };
export default function Page() { return <InfoAfiliados idioma="ca" />; }
