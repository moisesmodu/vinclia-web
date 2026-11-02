import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, marca, pais, urlBase } from '@/lib/datos';
import { alternates, jsonLd, imagenOg } from '@/lib/seo';
import {
  type Conv, convocatorias, convocatoria, visible, indexable, tituloSeo, fecha, ciudadesAuxiliar, slugCiudad,
  OPOSICION_AUX_AJUNTAMENTS, RUTA_AUX_AJUNTAMENT,
} from '@/lib/convocatorias';
import { FichaConvocatoria, TemarioBanco, CtaTests } from '@/components/FichaConvocatoria';

type P = { params: Promise<{ lang: Idioma; id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => IDIOMAS.flatMap((lang) => convocatorias().map((c) => ({ lang, id: c.id })));

function descripcion(c: Conv, l: Idioma) {
  const ca = l === 'ca';
  const partes: string[] = [];
  if (visible(c, 'plazas')) partes.push(ca ? `${c.plazas!.toLocaleString(l)} places` : `${c.plazas!.toLocaleString(l)} plazas`);
  if (visible(c, 'diario') && visible(c, 'fechaPublicacion')) partes.push(ca ? `publicada al ${c.diario} el ${fecha(c.fechaPublicacion, l)}` : `publicada en el ${c.diario} el ${fecha(c.fechaPublicacion, l)}`);
  if (visible(c, 'plazoHasta')) partes.push(ca ? `inscripció fins al ${fecha(c.plazoHasta, l)}` : `inscripción hasta el ${fecha(c.plazoHasta, l)}`);
  const cola = banco(c.oposicion ?? '') ? (ca ? 'Requisits, temari i tests gratis.' : 'Requisitos, temario y tests gratis.') : (ca ? 'Requisits, dates i font oficial.' : 'Requisitos, fechas y fuente oficial.');
  const base = `${c.organismo}: ${c.cuerpo[l]}.`;
  return partes.length ? `${base} ${partes.join(', ').replace(/^./, (x) => x.toUpperCase())}. ${cola}` : `${base} ${ca ? 'Referència i enllaç a la font oficial.' : 'Referencia y enlace a la fuente oficial.'} ${cola}`;
}

function preguntas(c: Conv, l: Idioma) {
  const ca = l === 'ca';
  const n = c.nombreCorto[l];
  const faq: { q: string; a: string }[] = [];
  if (visible(c, 'plazas')) {
    faq.push({
      q: ca ? `Quantes places hi ha a les oposicions de ${n}?` : `¿Cuántas plazas hay en las oposiciones de ${n}?`,
      a: `${c.plazas!.toLocaleString(l)} ${ca ? 'places' : 'plazas'}${visible(c, 'referencia') ? (ca ? `, segons la ${c.referencia}` : `, según la ${c.referencia}`) : ''}.`,
    });
  }
  if (visible(c, 'diario') && visible(c, 'fechaPublicacion')) {
    faq.push({
      q: ca ? 'On i quan es va publicar la convocatòria?' : '¿Dónde y cuándo se publicó la convocatoria?',
      a: ca ? `Al ${c.diario} el ${fecha(c.fechaPublicacion, l)}${visible(c, 'referencia') ? ` (${c.referencia})` : ''}.` : `En el ${c.diario} el ${fecha(c.fechaPublicacion, l)}${visible(c, 'referencia') ? ` (${c.referencia})` : ''}.`,
    });
  }
  if (visible(c, 'plazoHasta')) {
    faq.push({
      q: ca ? "Fins quan es podia presentar la sol·licitud?" : '¿Hasta cuándo se podía presentar la solicitud?',
      a: ca ? `El termini d'inscripció acabava el ${fecha(c.plazoHasta, l)}.` : `El plazo de inscripción terminaba el ${fecha(c.plazoHasta, l)}.`,
    });
  }
  if (visible(c, 'fechaExamen')) {
    const mes = /^\d{4}-\d{2}$/.test(c.fechaExamen!);
    faq.push({
      q: ca ? `Quan és l'examen de ${n}?` : `¿Cuándo es el examen de ${n}?`,
      a: ca ? `${mes ? 'La prova és del mes de' : 'La prova és del'} ${fecha(c.fechaExamen, l)}, segons la font oficial.` : `${mes ? 'La prueba es del mes de' : 'La prueba es del'} ${fecha(c.fechaExamen, l)}, según la fuente oficial.`,
    });
  }
  if (c.comprobado?.requisitos?.length) {
    faq.push({
      q: ca ? 'Quins requisits demanen?' : '¿Qué requisitos piden?',
      a: c.comprobado.requisitos.map((r) => r[l]).join(' '),
    });
  }
  const b = banco(c.oposicion ?? '');
  if (b) {
    const comun = c.oposicion === OPOSICION_AUX_AJUNTAMENTS;
    faq.push({
      q: ca ? 'Quin temari entra i com el puc practicar?' : '¿Qué temario entra y cómo lo puedo practicar?',
      a: ca
        ? `${comun ? `Cada ajuntament publica el seu temari a les bases; el temari comú d'auxiliar d'ajuntaments que fem servir a ${marca.nombre} té` : `El temari de ${b.oposicion.nombreCorto.ca} té`} ${b.oposicion.temas.length} temes i ${b.resumen.total} preguntes tipus test amb l'article de la llei a cada resposta. ${pais.gratisPorOposicion} són gratis i sense registre.`
        : `${comun ? `Cada ayuntamiento publica su temario en las bases; el temario común de auxiliar de ayuntamientos que usamos en ${marca.nombre} tiene` : `El temario de ${b.oposicion.nombreCorto.es} tiene`} ${b.oposicion.temas.length} temas y ${b.resumen.total} preguntas tipo test con el artículo de la ley en cada respuesta. ${pais.gratisPorOposicion} son gratis y sin registro.`,
    });
  }
  return faq;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, id } = await params;
  const c = convocatoria(id);
  if (!c) return {};
  const titulo = tituloSeo(c, lang);
  const desc = descripcion(c, lang);
  return {
    title: { absolute: titulo },
    description: desc,
    alternates: alternates(lang, `/convocatorias/${c.id}`),
    // Sin datos verificados que enseñar, la página existe (enlaces internos) pero no se indexa.
    ...(indexable(c) ? {} : { robots: { index: false, follow: true } }),
    openGraph: { images: imagenOg(lang), title: titulo, description: desc, siteName: marca.nombre, type: 'website' },
  };
}

export default async function PaginaConvocatoria({ params }: P) {
  const { lang, id } = await params;
  const c = convocatoria(id);
  if (!c) notFound();
  const d = t(lang);
  const ca = lang === 'ca';
  const b = banco(c.oposicion ?? '');
  const faq = preguntas(c, lang);
  const base = urlBase();
  const relacionadas = convocatorias().filter((x) => x.id !== c.id && x.oposicion && x.oposicion === c.oposicion);
  const ciudadAux = c.oposicion === OPOSICION_AUX_AJUNTAMENTS ? ciudadesAuxiliar().find((x) => x.slug === slugCiudad(c.organismo.replace(/^Ajuntament de /, ''))) : undefined;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: marca.nombre, item: `${base}/${lang}` },
        { '@type': 'ListItem', position: 2, name: d.convocatorias, item: `${base}/${lang}/convocatorias` },
        { '@type': 'ListItem', position: 3, name: c.nombreCorto[lang], item: `${base}/${lang}/convocatorias/${c.id}` },
      ] },
      ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
    ],
  };
  return (
    <div className="contenedor pt-8 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav aria-label={ca ? 'Ruta' : 'Ruta'} className="text-xs text-slate-500">
        <Link href={`/${lang}`}>{marca.nombre}</Link> › <Link href={`/${lang}/convocatorias`}>{d.convocatorias}</Link> › {c.nombreCorto[lang]}
      </nav>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{tituloSeo(c, lang)}</h1>
      <p className="mt-2 max-w-3xl text-slate-700">{c.organismo} · {c.cuerpo[lang]}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {b ? <Link href={`/${lang}/practicar/${b.oposicion.slug}`} className="boton">{d.testGratis}</Link> : null}
        {b ? <Link href={`/${lang}/${b.oposicion.slug}`} className="boton-sec">{ca ? `Temari i tests de ${b.oposicion.nombreCorto.ca}` : `Temario y tests de ${b.oposicion.nombreCorto.es}`}</Link> : <Link href={`/${lang}/convocatorias`} className="boton-sec">{ca ? 'Totes les convocatòries' : 'Todas las convocatorias'}</Link>}
      </div>

      <div className="mt-8"><FichaConvocatoria c={c} lang={lang} titulo={ca ? 'Dades de la convocatòria' : 'Datos de la convocatoria'} /></div>
      {c.agrupa ? <p className="mt-3 text-sm text-slate-600">{ca ? 'Convocatòria que agrupa diversos cossos: les places de cada cos surten també per separat a la llista de convocatòries.' : 'Convocatoria que agrupa varios cuerpos: las plazas de cada cuerpo salen también por separado en la lista de convocatorias.'}</p> : null}
      {ciudadAux ? (
        <p className="mt-4 text-sm">
          <Link href={`/${lang}${RUTA_AUX_AJUNTAMENT}/${ciudadAux.slug}`} className="font-semibold text-marca underline">
            {ca ? `Auxiliar administratiu de l'Ajuntament de ${ciudadAux.nombre}: totes les convocatòries` : `Auxiliar administrativo del Ayuntamiento de ${ciudadAux.nombre}: todas las convocatorias`}
          </Link>
        </p>
      ) : null}

      {b ? (
        <TemarioBanco
          slug={b.oposicion.slug}
          lang={lang}
          nota={c.oposicion === OPOSICION_AUX_AJUNTAMENTS
            ? (ca ? "Temari comú d'auxiliar administratiu d'ajuntaments de Catalunya. Cada ajuntament fixa el seu temari a les bases: comprova-hi els temes específics." : 'Temario común de auxiliar administrativo de ayuntamientos de Cataluña. Cada ayuntamiento fija su temario en las bases: comprueba en ellas los temas específicos.')
            : undefined}
        />
      ) : null}

      <CtaTests slug={b?.oposicion.slug} lang={lang} />

      {faq.length ? (
        <>
          <h2 className="mt-10 text-2xl font-bold">{ca ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
          <div className="prosa mt-2">{faq.map((f) => (<div key={f.q}><h3>{f.q}</h3><p>{f.a}</p></div>))}</div>
        </>
      ) : null}

      {relacionadas.length ? (
        <>
          <h2 className="mt-10 text-xl font-bold">{ca ? 'Altres convocatòries de la mateixa oposició' : 'Otras convocatorias de la misma oposición'}</h2>
          <ul className="mt-3 grid gap-2">
            {relacionadas.map((x) => (
              <li key={x.id}><Link href={`/${lang}/convocatorias/${x.id}`} className="text-marca underline">{x.organismo}: {x.cuerpo[lang]}</Link></li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-8 text-xs text-slate-500">
        {ca ? 'Només mostrem dades comprovades al diari oficial o a la web de l\'organisme convocant. ' : 'Solo mostramos datos comprobados en el diario oficial o en la web del organismo convocante. '}
        <Link href={`/${lang}/erratas`} className="underline">{ca ? "Has vist un error? Avisa'ns" : '¿Has visto un error? Avísanos'}</Link>
      </p>
    </div>
  );
}
