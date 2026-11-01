import type { Metadata } from "next";
import { PaginaSeoVista } from "@/components/PaginaSeoVista";
import { rutaSeo, seo } from "@/lib/contenido";
import { meta } from "@/lib/meta";
export function generateStaticParams() { return seo("ca").map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = seo("ca").find((x) => x.slug === slug);
  if (!p) return {};
  const propia = `${rutaSeo("ca")}/${slug}`;
  const otra = p.alternativa ? `${rutaSeo("es")}/${p.alternativa}` : undefined;
  return meta({ idioma: "ca", ca: propia, es: otra, title: p.titulo, description: p.descripcion });
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaSeoVista idioma="ca" slug={slug} />;
}
