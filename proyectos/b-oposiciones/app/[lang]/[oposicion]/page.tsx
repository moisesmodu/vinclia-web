import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, bancoPublico, oposiciones, pais, marca, urlBase } from '@/lib/datos';
import { alternates, jsonLd } from '@/lib/seo';
import Convocatoria from '@/components/Convocatoria';
import PreguntaMuestra from '@/components/PreguntaMuestra';

type P = { params: Promise<{ lang: Idioma; oposicion: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => IDIOMAS.flatMap((lang) => oposiciones().map((o) => ({ lang, oposicion: o.slug })));

const anio = () => new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, oposicion } = await params;
  const b = banco(oposicion);
  if (!b) return {};
  const o = b.oposicion;
  const titulo = lang === 'ca'
    ? `Test ${o.nombre.ca} gratis ${anio()}: ${b.resumen.total} preguntes`
    : `Test ${o.nombre.es} gratis ${anio()}: ${b.resumen.total} preguntas`;
  const desc = lang === 'ca'
    ? `Tests per tema i simulacres de ${o.nombreCorto.ca} amb el format de la ${o.convocatoria.referencia}. ${pais.gratisPorOposicion} preguntes gratis, explicació i article de la llei a cada resposta.`
    : `Tests por tema y simulacros de ${o.nombreCorto.es} con el formato de la ${o.convocatoria.referencia}. ${pais.gratisPorOposicion} preguntas gratis, explicación y artículo de la ley en cada respuesta.`;
  return { title: { absolute: `${titulo} · ${marca.nombre}` }, description: desc, alternates: alternates(lang, `/${oposicion}`), openGraph: { title: titulo, description: desc } };
}

export default async function PaginaOposicion({ params }: P) {
  const { lang, oposicion } = await params;
  const b = bancoPublico(oposicion);
  if (!b) notFound();
  const o = b.oposicion;
  const d = t(lang);
  const bloques = [...new Set(o.temas.map((x) => x.bloque?.[lang] ?? ''))];
  const muestras = b.gratis.slice(0, 3);
  const faq = [
    {
      q: lang === 'ca' ? `Quantes preguntes té l'examen de ${o.nombreCorto.ca}?` : `¿Cuántas preguntas tiene el examen de ${o.nombreCorto.es}?`,
      a: lang === 'ca'
        ? `${o.examen.preguntas} preguntes tipus test de ${o.examen.opciones} opcions en ${o.examen.minutos} minuts${o.examen.penalizacion ? `; cada error resta ${o.examen.penalizacion === 0.25 ? "1/4" : o.examen.penalizacion} d'encert` : ', sense penalització'}, segons la ${o.convocatoria.referencia}.`
        : `${o.examen.preguntas} preguntas tipo test de ${o.examen.opciones} opciones en ${o.examen.minutos} minutos${o.examen.penalizacion ? `; cada error resta ${o.examen.penalizacion === 0.25 ? "1/4" : o.examen.penalizacion} de acierto` : ', sin penalización'}, según la ${o.convocatoria.referencia}.`,
    },
    {
      q: lang === 'ca' ? 'Quants temes té el temari?' : '¿Cuántos temas tiene el temario?',
      a: lang === 'ca' ? `${o.temas.length} temes. Els tens tots a sota, amb la llei de cada un.` : `${o.temas.length} temas. Los tienes todos abajo, con la ley de cada uno.`,
    },
    {
      q: lang === 'ca' ? 'Les preguntes són oficials?' : '¿Las preguntas son oficiales?',
      a: lang === 'ca'
        ? `Les preguntes estan generades amb IA a partir del text legal de cada tema i verificades contra la font: cada resposta porta l'article i el fragment literal que la justifica.${b.resumen.examenOficial ? ` ${b.resumen.examenOficial} són d'exàmens oficials anteriors.` : ''}`
        : `Las preguntas están generadas con IA a partir del texto legal de cada tema y verificadas contra la fuente: cada respuesta lleva el artículo y el fragmento literal que la justifica.${b.resumen.examenOficial ? ` ${b.resumen.examenOficial} son de exámenes oficiales anteriores.` : ''}`,
    },
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: marca.nombre, item: `${urlBase()}/${lang}` },
        { '@type': 'ListItem', position: 2, name: o.nombre[lang], item: `${urlBase()}/${lang}/${o.slug}` },
      ] },
      { '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  return (
    <div className="contenedor py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <nav className="text-xs text-slate-500"><Link href={`/${lang}`}>{marca.nombre}</Link> › {o.nombreCorto[lang]}</nav>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
        {lang === 'ca' ? `Test ${o.nombre.ca} gratis` : `Test ${o.nombre.es} gratis`}
      </h1>
      {o.cuerpo?.[lang] ? <p className="mt-1 text-slate-600">{o.cuerpo[lang]}</p> : null}
      <p className="mt-3 flex flex-wrap gap-2">
        <span className="etiqueta">{b.resumen.total} {d.preguntas}</span>
        <span className="etiqueta">{b.resumen.verificadasLiteral} {d.verificadas}</span>
        <span className="etiqueta">{d.actualizado} {b.actualizado}</span>
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/${lang}/practicar/${o.slug}`} className="boton">{d.testGratis}</Link>
        <Link href={`/${lang}/practicar/${o.slug}?modo=simulacro`} className="boton-sec">{d.app.simulacro}</Link>
      </div>
      <p className="mt-2 text-sm text-slate-500">{d.gratisN(pais.gratisPorOposicion)} {d.sinTarjeta}.</p>

      <div className="mt-8"><Convocatoria o={o} idioma={lang} /></div>

      <h2 className="mt-10 text-2xl font-bold">{d.temario}</h2>
      {bloques.map((bl) => (
        <div key={bl} className="mt-4">
          {bl ? <h3 className="mb-2 font-semibold text-slate-600">{bl}</h3> : null}
          <ol className="grid gap-2">
            {o.temas.filter((x) => (x.bloque?.[lang] ?? '') === bl).map((x) => (
              <li key={x.n}>
                <Link href={`/${lang}/${o.slug}/${x.slug}`} className="tarjeta flex items-start gap-3 p-4 no-underline hover:border-marca">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-marca-claro text-sm font-bold text-marca-oscuro">{x.n}</span>
                  <span className="flex-1 text-sm font-medium text-tinta">{x.titulo[lang]}</span>
                  <span className="shrink-0 text-xs text-slate-500">{b.resumen.porTema[x.n] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {muestras.length ? (
        <>
          <h2 className="mt-10 text-2xl font-bold">{lang === 'ca' ? 'Preguntes d\'exemple' : 'Preguntas de ejemplo'}</h2>
          <div className="mt-4 grid gap-4">{muestras.map((p) => <PreguntaMuestra key={p.id} p={p} idioma={lang} conRespuesta />)}</div>
        </>
      ) : null}

      <h2 className="mt-10 text-2xl font-bold">{lang === 'ca' ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
      <div className="prosa mt-2">
        {faq.map((f) => (<div key={f.q}><h3>{f.q}</h3><p>{f.a}</p></div>))}
      </div>
    </div>
  );
}
