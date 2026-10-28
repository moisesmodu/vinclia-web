import type { Metadata } from "next";
import { LectorMuestra } from "@/components/LectorMuestra";
import { CUENTOS_MUESTRA } from "@/lib/muestras-contenido";
export function generateStaticParams() { return Object.keys(CUENTOS_MUESTRA).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CUENTOS_MUESTRA[slug];
  return { title: c?.titulo, description: c?.contraportada, openGraph: { images: [`/muestras/${slug}/00.webp`] } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LectorMuestra slug={slug} idioma="es" />;
}
