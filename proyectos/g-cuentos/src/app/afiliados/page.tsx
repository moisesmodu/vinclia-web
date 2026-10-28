import type { Metadata } from "next";
import { InfoAfiliados } from "@/components/PaginasAfiliados";
export const metadata: Metadata = { title: "Programa de afiliadas (20 %)", description: "Recomienda Lunilla en tu cuenta de maternidad o crianza y gana el 20 % de cada venta." };
export default function Page() { return <InfoAfiliados idioma="es" />; }
