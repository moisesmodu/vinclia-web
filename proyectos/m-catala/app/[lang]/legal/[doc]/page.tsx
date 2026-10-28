import { notFound } from 'next/navigation';
import { esIdioma } from '@/lib/i18n';
import { DOCS, legal, type DocLegal } from '@/lib/legal';
import type { Idioma } from '@/lib/tipos';
export const dynamic = 'force-dynamic';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => DOCS.map((doc) => ({ lang, doc })));
export default async function Pagina({ params }: { params: Promise<{ lang: string; doc: string }> }) {
  const { lang, doc } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; if (!(DOCS as readonly string[]).includes(doc)) notFound();
  const d = legal(doc as DocLegal, idioma);
  return <div className="contenedor prosa max-w-2xl py-8"><h1 className="text-2xl font-bold">{d.titulo}</h1>{d.secciones.map((s) => <section key={s.h}><h2>{s.h}</h2>{s.p.map((p, i) => <p key={i}>{p}</p>)}</section>)}</div>;
}
