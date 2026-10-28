import type { Metadata } from "next";
import { PaginaSeoVista } from "@/components/PaginaSeoVista";
import { rutaSeo, seo } from "@/lib/contenido";
export function generateStaticParams() { return seo("es").map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = seo("es").find((x) => x.slug === slug);
  if (!p) return {};
  const otro = (("es" as string) === "ca" ? "es" : "ca") as "es" | "ca";
  return {
    title: p.titulo, description: p.descripcion,
    alternates: { canonical: `${rutaSeo("es")}/${slug}`, languages: p.alternativa ? { [otro]: `${rutaSeo(otro)}/${p.alternativa}` } : undefined },
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaSeoVista idioma="es" slug={slug} />;
}
