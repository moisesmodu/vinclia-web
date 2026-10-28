import { dicc } from "@/lib/i18n";
import Gracias from "@/components/Gracias";

export const metadata = { robots: { index: false } };

export default async function Pagina({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  return <Gracias idioma={idioma} textos={d.acceso} irGuias={d.inicio.ctaGuias} />;
}
