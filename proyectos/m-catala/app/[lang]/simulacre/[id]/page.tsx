import { notFound } from 'next/navigation';
import Simulacre from '@/components/Simulacre';
import { esIdioma } from '@/lib/i18n';
import { BANC, examens, punts, convocatories } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => BANC.simulacres.map((s) => ({ lang, id: s.id })));
export default async function Pagina({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const sim = BANC.simulacres.find((s) => s.id === id); if (!sim) notFound();
  const ids = new Set(sim.arees.us?.items ?? []);
  return <div className="contenedor py-6"><Simulacre idioma={idioma} sim={sim} examen={examens[sim.nivell]} items={BANC.items.filter((i) => ids.has(i.id))} textos={BANC.textos} tasques={BANC.tasques} regles={BANC.regles} punts={punts} sons={BANC.oral.sons} convocatories={convocatories} /></div>;
}
