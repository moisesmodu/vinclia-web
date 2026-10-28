import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { bancoPublico, oposiciones, marca, urlBase, tema as buscarTema } from '@/lib/datos';
import { alternates, jsonLd } from '@/lib/seo';
import PreguntaMuestra from '@/components/PreguntaMuestra';

type P = { params: Promise<{ lang: Idioma; oposicion: string; tema: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  IDIOMAS.flatMap((lang) => oposiciones().flatMap((o) => o.temas.map((x) => ({ lang, oposicion: o.slug, tema: x.slug }))));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, oposicion, tema } = await params;
  const r = buscarTema(oposicion, tema);
  if (!r) return {};
  const { b, t: x } = r;
  const n = b.resumen.porTema[x.n] ?? 0;
  const titulo = lang === 'ca'
    ? `Test tema ${x.n} ${b.oposicion.nombreCorto.ca}: ${x.titulo.ca}`
    : `Test tema ${x.n} ${b.oposicion.nombreCorto.es}: ${x.titulo.es}`;
  const desc = lang === 'ca'
    ? `${n} preguntes tipus test del tema ${x.n} (${x.titulo.ca}) de ${b.oposicion.nombre.ca}, amb explicació i l'article de la llei. Prova-ho gratis.`
    : `${n} preguntas tipo test del tema ${x.n} (${x.titulo.es}) de ${b.oposicion.nombre.es}, con explicación y el artículo de la ley. Pruébalo gratis.`;
  return { title: titulo.length > 70 ? titulo.slice(0, 67) + '…' : titulo, description: desc, alternates: alternates(lang, `/${oposicion}/${tema}`) };
}

export default async function PaginaTema({ params }: P) {
  const { lang, oposicion, tema } = await params;
  const b = bancoPublico(oposicion);
  const x = b?.oposicion.temas.find((y) => y.slug === tema);
  if (!b || !x) notFound();
  const o = b.oposicion;
  const d = t(lang);
  const i = o.temas.indexOf(x);
  const ant = o.temas[i - 1];
  const sig = o.temas[i + 1];
  const gratis = b.gratis.filter((p) => p.tema === x.n);
  const ejemplo = gratis.length ? null : b.ejemplos[x.n];
  const n = b.resumen.porTema[x.n] ?? 0;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: marca.nombre, item: `${urlBase()}/${lang}` },
      { '@type': 'ListItem', position: 2, name: o.nombreCorto[lang], item: `${urlBase()}/${lang}/${o.slug}` },
      { '@type': 'ListItem', position: 3, name: `${d.tema} ${x.n}`, item: `${urlBase()}/${lang}/${o.slug}/${x.slug}` },
    ],
  };
  return (
    <div className="contenedor py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav className="text-xs text-slate-500">
        <Link href={`/${lang}`}>{marca.nombre}</Link> › <Link href={`/${lang}/${o.slug}`}>{o.nombreCorto[lang]}</Link> › {d.tema} {x.n}
      </nav>
      <p className="mt-3 text-sm font-semibold text-marca">{o.nombre[lang]} · {d.tema} {x.n}</p>
      <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
        {lang === 'ca' ? 'Test del tema' : 'Test del tema'} {x.n}: {x.titulo[lang]}
      </h1>
      <p className="mt-3 flex flex-wrap gap-2">
        <span className="etiqueta">{n} {d.preguntas}</span>
        {x.bloque?.[lang] ? <span className="etiqueta">{x.bloque[lang]}</span> : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/${lang}/practicar/${o.slug}?tema=${x.n}`} className="boton">{lang === 'ca' ? 'Practica aquest tema' : 'Practica este tema'}</Link>
        <Link href={`/${lang}/${o.slug}`} className="boton-sec">{d.temario}</Link>
      </div>

      <h2 className="mt-8 text-xl font-bold">{d.fuentes}</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {x.fuentes.map((f, k) => (
          <li key={k} className="tarjeta p-4">
            {f.url || f.id ? (
              <a href={f.url ?? `https://www.boe.es/buscar/act.php?id=${f.id}`} target="_blank" rel="noopener" className="font-semibold text-marca underline">{f.norma}</a>
            ) : <span className="font-semibold">{f.norma}</span>}
            {f.articulos ? <span className="block text-slate-600">{lang === 'ca' ? 'Articles' : 'Artículos'}: {f.articulos}</span> : null}
          </li>
        ))}
      </ul>

      {gratis.length || ejemplo ? (
        <>
          <h2 className="mt-8 text-xl font-bold">{d.ejemplo}</h2>
          <div className="mt-3 grid gap-4">
            {gratis.map((p) => <PreguntaMuestra key={p.id} p={p} idioma={lang} conRespuesta />)}
            {ejemplo ? <PreguntaMuestra p={ejemplo} idioma={lang} conRespuesta={false} /> : null}
          </div>
        </>
      ) : null}

      <nav className="mt-10 grid gap-3 sm:grid-cols-2">
        {ant ? <Link href={`/${lang}/${o.slug}/${ant.slug}`} className="tarjeta p-4 text-sm no-underline hover:border-marca">← {d.tema} {ant.n}: {ant.titulo[lang]}</Link> : <span />}
        {sig ? <Link href={`/${lang}/${o.slug}/${sig.slug}`} className="tarjeta p-4 text-right text-sm no-underline hover:border-marca">{d.tema} {sig.n}: {sig.titulo[lang]} →</Link> : null}
      </nav>
    </div>
  );
}
