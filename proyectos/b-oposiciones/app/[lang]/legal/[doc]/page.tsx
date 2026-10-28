import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { DOCS, legal, type DocLegal } from '@/lib/legal';
import { alternates } from '@/lib/seo';

type P = { params: Promise<{ lang: Idioma; doc: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => IDIOMAS.flatMap((lang) => DOCS.map((doc) => ({ lang, doc })));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, doc } = await params;
  return DOCS.includes(doc as DocLegal) ? { title: legal(doc as DocLegal, lang).titulo, alternates: alternates(lang, `/legal/${doc}`) } : {};
}

export default async function Legal({ params }: P) {
  const { lang, doc } = await params;
  if (!DOCS.includes(doc as DocLegal)) notFound();
  const d = legal(doc as DocLegal, lang);
  return (
    <article className="contenedor prosa max-w-3xl py-10">
      <h1 className="text-3xl font-bold">{d.titulo}</h1>
      {d.secciones.map((s) => (<section key={s.h}><h2>{s.h}</h2>{s.p.map((x, i) => <p key={i}>{x}</p>)}</section>))}
      <p className="mt-8 text-xs text-slate-500">{lang === 'ca' ? 'Darrera actualització' : 'Última actualización'}: 2026-10-28</p>
    </article>
  );
}
