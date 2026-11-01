import type { Metadata } from "next";
import { LectorMuestra } from "@/components/LectorMuestra";
import { meta } from "@/lib/meta";
import { CUENTOS_MUESTRA } from "@/lib/muestras-contenido";
export function generateStaticParams() { return Object.keys(CUENTOS_MUESTRA).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = CUENTOS_MUESTRA[slug];
  if (!c) return {};
  return meta({
    idioma: "ca", es: `/muestras/${slug}`, ca: `/ca/muestras/${slug}`, imagen: `/muestras/${slug}/00.webp`,
    title: `${c.titulo} · conte de mostra sencer`, description: c.contraportada,
  });
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LectorMuestra slug={slug} idioma="ca" />;
}
