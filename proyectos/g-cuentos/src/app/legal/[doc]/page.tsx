import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { legal } from "@/lib/contenido";
import { meta } from "@/lib/meta";
export function generateStaticParams() { return legal("es").map((d) => ({ doc: d.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = legal("es").find((x) => x.slug === doc);
  if (!d) return {};
  return meta({ idioma: "es", es: `/legal/${doc}`, ca: `/ca/legal/${doc}`, title: d.titulo, description: `${d.titulo} · Lunilla, cuentos infantiles personalizados.` });
}
export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  return <Legal idioma="es" doc={doc} />;
}
