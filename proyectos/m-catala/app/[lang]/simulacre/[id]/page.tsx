import RequereixCompte from '@/components/RequereixCompte';
import { notFound } from 'next/navigation';
import Simulacre from '@/components/Simulacre';
import { esIdioma } from '@/lib/i18n';
import { BANC, examens, punts, convocatories } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => BANC.simulacres.map((s) => ({ lang, id: s.id })));
export default async function Pagina({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const sim = BANC.simulacres.find((s) => s.id === id); if (!sim) notFound();
  // Els ítems amb resposta no s'incrusten a la pàgina: el client els demana a /api/banc?simulacre= després d'un inici autoritzat (A7).
  return <RequereixCompte idioma={idioma}><div className="contenedor py-6"><Simulacre idioma={idioma} sim={sim} examen={examens[sim.nivell]} regles={BANC.regles} punts={punts} sons={BANC.oral.sons} convocatories={convocatories} /></div></RequereixCompte>;
}
