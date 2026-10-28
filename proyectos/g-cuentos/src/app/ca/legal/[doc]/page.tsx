import { Legal } from "@/components/Legal";
import { legal } from "@/lib/contenido";
export function generateStaticParams() { return legal("ca").map((d) => ({ doc: d.slug })); }
export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  return <Legal idioma="ca" doc={doc} />;
}
