import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { legal } from "@/lib/contenido";
import { meta } from "@/lib/meta";
export function generateStaticParams() { return legal("ca").map((d) => ({ doc: d.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = legal("ca").find((x) => x.slug === doc);
  if (!d) return {};
  return meta({ idioma: "ca", es: `/legal/${doc}`, ca: `/ca/legal/${doc}`, title: d.titulo, description: `${d.titulo} · Lunilla, contes infantils personalitzats.` });
}
export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  return <Legal idioma="ca" doc={doc} />;
}
