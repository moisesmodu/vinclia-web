import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, marca, pais, urlBase } from '@/lib/datos';
import { alternates, jsonLd, imagenOg } from '@/lib/seo';
import { type Ciudad, ciudadesAuxiliar, ciudad, indexable, visible, anio, fecha, ordenar, OPOSICION_AUX_AJUNTAMENTS, RUTA_AUX_AJUNTAMENT } from '@/lib/convocatorias';
import { FichaConvocatoria, TemarioBanco, CtaTests } from '@/components/FichaConvocatoria';

type P = { params: Promise<{ lang: Idioma; ciutat: string }> };

export const dynamicParams = false;
// Solo ayuntamientos con al menos una convocatoria de auxiliar con datos verificados (lib/convocatorias.ts).
export const generateStaticParams = () => IDIOMAS.flatMap((lang) => ciudadesAuxiliar().map((c) => ({ lang, ciutat: c.slug })));

const verificadas = (x: Ciudad) => ordenar(x.convocatorias.filter(indexable));
const anioCiudad = (x: Ciudad) => verificadas(x).map(anio).filter(Boolean).sort().at(-1) ?? null;

function titulo(x: Ciudad, l: Idioma) {
  const a = anioCiudad(x);
  return l === 'ca'
    ? `Oposicions auxiliar administratiu Ajuntament de ${x.nombre}${a ? ` ${a}` : ''}: places, requisits i temari`
    : `Oposiciones auxiliar administrativo Ayuntamiento de ${x.nombre}${a ? ` ${a}` : ''}: plazas, requisitos y temario`;
}

function descripcion(x: Ciudad, l: Idioma) {
  const ca = l === 'ca';
  const v = verificadas(x);
  const places = v.filter((c) => visible(c, 'plazas')).map((c) => c.plazas!);
  const p = places.length ? (ca ? `${places.join(' i ')} places` : `${places.join(' y ')} plazas`) : '';
  return ca
    ? `Convocatòries d'auxiliar administratiu de l'Ajuntament de ${x.nombre}${p ? `: ${p}` : ''}, amb la referència al diari oficial. Temari comú i ${pais.gratisPorOposicion} preguntes gratis.`
    : `Convocatorias de auxiliar administrativo del Ayuntamiento de ${x.nombre}${p ? `: ${p}` : ''}, con la referencia al diario oficial. Temario común y ${pais.gratisPorOposicion} preguntas gratis.`;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, ciutat } = await params;
  const x = ciudad(ciutat);
  if (!x) return {};
  const tt = titulo(x, lang);
  const desc = descripcion(x, lang);
  return { title: { absolute: tt }, description: desc, alternates: alternates(lang, `${RUTA_AUX_AJUNTAMENT}/${x.slug}`), openGraph: { images: imagenOg(lang), title: tt, description: desc, siteName: marca.nombre, type: 'website' } };
}

export default async function PaginaAuxiliarCiudad({ params }: P) {
  const { lang, ciutat } = await params;
  const x = ciudad(ciutat);
  if (!x) notFound();
  const d = t(lang);
  const ca = lang === 'ca';
  const b = banco(OPOSICION_AUX_AJUNTAMENTS);
  const v = verificadas(x);
  const pendientes = x.convocatorias.filter((c) => !indexable(c));
  const base = urlBase();
  const ruta = `${RUTA_AUX_AJUNTAMENT}/${x.slug}`;

  const faq: { q: string; a: string }[] = [];
  for (const c of v) {
    const suf = v.length > 1 ? ` (${c.cuerpo[lang]})` : '';
    if (visible(c, 'plazas')) {
      faq.push({
        q: ca ? `Quantes places d'auxiliar administratiu convoca l'Ajuntament de ${x.nombre}${suf}?` : `¿Cuántas plazas de auxiliar administrativo convoca el Ayuntamiento de ${x.nombre}${suf}?`,
        a: `${c.plazas} ${ca ? 'places' : 'plazas'}${visible(c, 'referencia') ? (ca ? `, segons ${c.referencia}` : `, según ${c.referencia}`) : ''}${visible(c, 'diario') && visible(c, 'fechaPublicacion') ? ` (${c.diario}, ${fecha(c.fechaPublicacion, lang)})` : ''}.`,
      });
    }
    if (c.comprobado?.requisitos?.length) faq.push({ q: ca ? `Quins requisits demana l'Ajuntament de ${x.nombre}${suf}?` : `¿Qué requisitos pide el Ayuntamiento de ${x.nombre}${suf}?`, a: c.comprobado.requisitos.map((r) => r[lang]).join(' ') });
    if (visible(c, 'plazoHasta')) faq.push({ q: ca ? `Fins quan es podia presentar la sol·licitud${suf}?` : `¿Hasta cuándo se podía presentar la solicitud${suf}?`, a: ca ? `Fins al ${fecha(c.plazoHasta, lang)}.` : `Hasta el ${fecha(c.plazoHasta, lang)}.` });
  }
  if (b) {
    faq.push({
      q: ca ? 'Quin temari he d\'estudiar?' : '¿Qué temario tengo que estudiar?',
      a: ca
        ? `El que fixen les bases de l'Ajuntament de ${x.nombre}. Per a les matèries comunes (Constitució, Estatut, règim local, procediment administratiu, hisenda local…) pots practicar amb el temari comú d'auxiliar d'ajuntaments de ${marca.nombre}: ${b.oposicion.temas.length} temes i ${b.resumen.total} preguntes amb l'article de la llei a cada resposta.`
        : `El que fijan las bases del Ayuntamiento de ${x.nombre}. Para las materias comunes (Constitución, Estatuto, régimen local, procedimiento administrativo, hacienda local…) puedes practicar con el temario común de auxiliar de ayuntamientos de ${marca.nombre}: ${b.oposicion.temas.length} temas y ${b.resumen.total} preguntas con el artículo de la ley en cada respuesta.`,
    });
  }
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: marca.nombre, item: `${base}/${lang}` },
        ...(b ? [{ '@type': 'ListItem', position: 2, name: b.oposicion.nombreCorto[lang], item: `${base}/${lang}/${b.oposicion.slug}` }] : []),
        { '@type': 'ListItem', position: b ? 3 : 2, name: x.nombre, item: `${base}/${lang}${ruta}` },
      ] },
      ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
    ],
  };
  const otras = ciudadesAuxiliar().filter((c) => c.slug !== x.slug);
  return (
    <div className="contenedor pt-8 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav aria-label="Ruta" className="text-xs text-slate-500">
        <Link href={`/${lang}`}>{marca.nombre}</Link>
        {b ? <> › <Link href={`/${lang}/${b.oposicion.slug}`}>{b.oposicion.nombreCorto[lang]}</Link></> : null} › {x.nombre}
      </nav>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{titulo(x, lang)}</h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        {ca
          ? `Convocatòries d'auxiliar administratiu/iva (subgrup C2) de l'Ajuntament de ${x.nombre} amb les dades comprovades al diari oficial, i el temari comú per preparar-les.`
          : `Convocatorias de auxiliar administrativo/a (subgrupo C2) del Ayuntamiento de ${x.nombre} con los datos comprobados en el diario oficial, y el temario común para prepararlas.`}
      </p>
      {b ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/${lang}/practicar/${b.oposicion.slug}`} className="boton">{d.testGratis}</Link>
          <Link href={`/${lang}/${b.oposicion.slug}`} className="boton-sec">{ca ? 'Temari comú i tests' : 'Temario común y tests'}</Link>
        </div>
      ) : null}

      <h2 className="mt-10 text-2xl font-bold">{ca ? 'Convocatòries' : 'Convocatorias'}</h2>
      <div className="mt-4 grid gap-4">
        {v.map((c) => (
          <div key={c.id}>
            <FichaConvocatoria c={c} lang={lang} />
            <p className="mt-2 text-sm"><Link href={`/${lang}/convocatorias/${c.id}`} className="text-marca underline">{ca ? 'Fitxa de la convocatòria' : 'Ficha de la convocatoria'}</Link></p>
          </div>
        ))}
      </div>
      {pendientes.length ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>{ca ? 'També hi ha aquestes convocatòries, que encara no hem pogut comprovar al diari oficial (per això no en mostrem places ni dates):' : 'También hay estas convocatorias, que aún no hemos podido comprobar en el diario oficial (por eso no mostramos plazas ni fechas):'}</p>
          <ul className="mt-2 list-disc pl-5">{pendientes.map((c) => <li key={c.id}><Link href={`/${lang}/convocatorias/${c.id}`} className="underline">{c.cuerpo[lang]}</Link></li>)}</ul>
        </div>
      ) : null}

      {b ? <TemarioBanco slug={b.oposicion.slug} lang={lang} nota={ca ? `Temari comú d'auxiliar administratiu d'ajuntaments de Catalunya. Les bases de l'Ajuntament de ${x.nombre} fixen el temari exacte: comprova-hi els temes específics.` : `Temario común de auxiliar administrativo de ayuntamientos de Cataluña. Las bases del Ayuntamiento de ${x.nombre} fijan el temario exacto: comprueba en ellas los temas específicos.`} /> : null}

      <CtaTests slug={b?.oposicion.slug} lang={lang} />

      {faq.length ? (
        <>
          <h2 className="mt-10 text-2xl font-bold">{ca ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
          <div className="prosa mt-2">{faq.map((f) => (<div key={f.q}><h3>{f.q}</h3><p>{f.a}</p></div>))}</div>
        </>
      ) : null}

      {otras.length ? (
        <>
          <h2 className="mt-10 text-xl font-bold">{ca ? "Auxiliar administratiu a altres ajuntaments" : 'Auxiliar administrativo en otros ayuntamientos'}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{otras.map((o) => <li key={o.slug}><Link href={`/${lang}${RUTA_AUX_AJUNTAMENT}/${o.slug}`} className="etiqueta no-underline">{o.nombre}</Link></li>)}</ul>
        </>
      ) : null}
      <p className="mt-8 text-xs text-slate-500">
        <Link href={`/${lang}/convocatorias`} className="underline">{ca ? 'Totes les convocatòries de Catalunya' : 'Todas las convocatorias de Cataluña'}</Link>
      </p>
    </div>
  );
}
