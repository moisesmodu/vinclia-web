import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca, urlBase } from '@/lib/datos';
import { alternates, jsonLd } from '@/lib/seo';
import { articulo, articulos } from '@/lib/blog';
import { fechaLarga } from '@/components/Convocatoria';

type P = { params: Promise<{ lang: Idioma; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => IDIOMAS.flatMap((lang) => articulos().map((a) => ({ lang, slug: a.slug })));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  const a = articulo(slug);
  if (!a) return {};
  return {
    title: { absolute: `${a.titulo[lang]} · ${marca.nombre}` },
    description: a.descripcion[lang],
    keywords: [a.palabraClave[lang]],
    alternates: alternates(lang, `/blog/${slug}`),
    openGraph: { title: a.titulo[lang], description: a.descripcion[lang], type: 'article', publishedTime: a.publicado, modifiedTime: a.actualizado, locale: lang === 'ca' ? 'ca_ES' : 'es_ES' },
  };
}

/** Enlaces Markdown [texto](url) dentro de un párrafo; el resto se escapa. */
function Parrafo({ texto }: { texto: string }) {
  const partes = texto.split(/(\[[^\]]+\]\((?:\/|https?:)[^)\s]+\))/g);
  return (
    <p>
      {partes.map((x, i) => {
        const m = x.match(/^\[([^\]]+)\]\(((?:\/|https?:)[^)\s]+)\)$/);
        if (!m) return <span key={i}>{x}</span>;
        return m[2].startsWith('http') ? <a key={i} href={m[2]} target="_blank" rel="noopener">{m[1]}</a> : <Link key={i} href={m[2]}>{m[1]}</Link>;
      })}
    </p>
  );
}

export default async function Articulo({ params }: P) {
  const { lang, slug } = await params;
  const a = articulo(slug);
  if (!a) notFound();
  const d = t(lang);
  const b = urlBase();
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: marca.nombre, item: `${b}/${lang}` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${b}/${lang}/blog` },
        { '@type': 'ListItem', position: 3, name: a.h1[lang], item: `${b}/${lang}/blog/${a.slug}` },
      ] },
      { '@type': 'Article', headline: a.titulo[lang], description: a.descripcion[lang], inLanguage: lang, datePublished: a.publicado, dateModified: a.actualizado,
        mainEntityOfPage: `${b}/${lang}/blog/${a.slug}`, author: { '@type': 'Organization', name: marca.nombre, url: `${b}/${lang}` }, publisher: { '@type': 'Organization', name: marca.nombre, url: `${b}/${lang}` } },
      { '@type': 'FAQPage', mainEntity: a.faq[lang].map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  return (
    <article className="contenedor py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav className="text-xs text-slate-500"><Link href={`/${lang}`}>{marca.nombre}</Link> › <Link href={`/${lang}/blog`}>Blog</Link> › {a.h1[lang]}</nav>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{a.h1[lang]}</h1>
      <p className="mt-2 text-xs text-slate-500">{d.actualizado} {fechaLarga(a.actualizado, lang)}</p>
      <div className="prosa mt-4 max-w-3xl"><Parrafo texto={a.intro[lang]} /></div>
      {a.oposicion ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/${lang}/practicar/${a.oposicion}?modo=simulacro`} className="boton">{d.app.simulacro}</Link>
          <Link href={`/${lang}/${a.oposicion}`} className="boton-sec">{d.testGratis}</Link>
        </div>
      ) : null}
      <div className="prosa mt-6 max-w-3xl">
        {a.secciones[lang].map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {s.parrafos.map((p, i) => <Parrafo key={i} texto={p} />)}
            {s.lista?.length ? <ul>{s.lista.map((x, i) => <li key={i}>{x}</li>)}</ul> : null}
          </section>
        ))}
        <h2>{lang === 'ca' ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
        {a.faq[lang].map((f) => (<div key={f.q}><h3>{f.q}</h3><Parrafo texto={f.a} /></div>))}
        {a.nota?.[lang] ? <p className="text-sm text-slate-500">{a.nota[lang]}</p> : null}
      </div>
    </article>
  );
}
