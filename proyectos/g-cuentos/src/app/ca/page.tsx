import type { Metadata } from "next";
import { Inicio } from "@/components/Inicio";
export const metadata: Metadata = { title: "Lunilla · Contes personalitzats amb nom", description: "Contes infantils personalitzats amb el nom, la ciutat i la mascota del teu petit. 18 o 22 pàgines il·lustrades segons l'edat, PDF en menys de 2 hores o llibre de tapa dura. En català i castellà.", alternates: { canonical: "/ca", languages: { es: "/", ca: "/ca" } } };
export default function Page() { return <Inicio idioma="ca" />; }
