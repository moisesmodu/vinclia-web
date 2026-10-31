import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { esIdioma } from '@/lib/i18n';
import { meta } from '@/lib/meta';
import { DOCS, legal, type DocLegal } from '@/lib/legal';
import type { Idioma } from '@/lib/tipos';
export const revalidate = 86400;
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => DOCS.map((doc) => ({ lang, doc })));
export async function generateMetadata({ params }: { params: Promise<{ lang: string; doc: string }> }): Promise<Metadata> { const { lang, doc } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; if (!(DOCS as readonly string[]).includes(doc)) return {}; const d = legal(doc as DocLegal, l); return meta(l, `/legal/${doc}`, d.titulo, d.secciones[0]?.p[0] ?? d.titulo); }
export default async function Pagina({ params }: { params: Promise<{ lang: string; doc: string }> }) {
  const { lang, doc } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; if (!(DOCS as readonly string[]).includes(doc)) notFound();
  const d = legal(doc as DocLegal, idioma);
  return <div className="contenedor prosa max-w-2xl py-8"><h1>{d.titulo}</h1>{d.secciones.map((s) => <section key={s.h}><h2>{s.h}</h2>{s.p.map((p, i) => <p key={i}>{p}</p>)}</section>)}</div>;
}
