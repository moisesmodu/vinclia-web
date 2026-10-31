import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { esIdioma, t } from '@/lib/i18n';
import { BANC, paginaSeo, urlBase } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
import { md } from '@/lib/md';
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => BANC.seo.map((p) => ({ lang, slug: p.slug })));
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const p = paginaSeo(slug); if (!p) return {};
  return { title: p.titol[l], description: p.descripcio[l], keywords: p.paraulesClau[l], alternates: { canonical: `${urlBase()}/${l}/guia/${slug}`, languages: { ca: `${urlBase()}/ca/guia/${slug}`, es: `${urlBase()}/es/guia/${slug}`, 'x-default': `${urlBase()}/ca/guia/${slug}` } }, openGraph: { title: p.titol[l], description: p.descripcio[l], locale: l === 'ca' ? 'ca_ES' : 'es_ES', type: 'article' } };
}
export default async function Pagina({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const p = paginaSeo(slug); if (!p) notFound();
  const faq = p.faq?.[idioma] ?? [];
  const jsonLd = faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.p, acceptedAnswer: { '@type': 'Answer', text: f.r } })) } : null;
  const relacionades = BANC.seo.filter((x) => x.slug !== slug && (x.nivell === p.nivell || x.tipus === p.tipus)).slice(0, 6);
  return (
    <article className="contenedor prosa max-w-2xl py-8">
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      
      <h1>{p.titol[idioma]}</h1>
      <p className="mt-3 text-[19px] leading-relaxed text-secundari">{p.descripcio[idioma]}</p>
      <div className="regla my-6"><p className="font-semibold">{p.cta?.[idioma]}</p><Link href={`/${idioma}/comencar`} className="boton-primari mt-3">{t(idioma).hero.cta}</Link></div>
      {p.seccions[idioma].map((s, i) => <section key={i}><h2>{s.h2}</h2><div dangerouslySetInnerHTML={{ __html: md(s.text) }} /></section>)}
      {faq.length ? <section><h2>FAQ</h2>{faq.map((f, i) => <details key={i} className="mb-2 rounded-[6px] border border-linia bg-paper p-3"><summary className="cursor-pointer font-semibold">{f.p}</summary><p className="mt-2">{f.r}</p></details>)}</section> : null}
      {relacionades.length ? <section><h2>{idioma === 'ca' ? 'Relacionat' : 'Relacionado'}</h2><ul>{relacionades.map((r) => <li key={r.slug}><Link href={`/${idioma}/guia/${r.slug}`}>{r.titol[idioma]}</Link></li>)}</ul></section> : null}
      <p className="mt-8 text-[13px] text-terciari">{idioma === 'ca' ? 'Dates previstes pendents de la resolució oficial al DOGC; es revisen cada setmana.' : 'Fechas previstas pendientes de la resolución oficial en el DOGC; se revisan cada semana.'}</p>
    </article>
  );
}
