import Link from 'next/link';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, bancoPublico, oposiciones, pais, marca, totalPreguntas, precioTexto, urlBase } from '@/lib/datos';
import { alternates, jsonLd, imagenOg } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  const titulo = lang === 'ca' ? 'Tests d\'oposicions de Catalunya gratis: Generalitat, Mossos, Bombers, ICS i ajuntaments' : 'Tests de oposiciones de Cataluña gratis: Generalitat, Mossos, Bombers, ICS y ayuntamientos';
  return { title: { absolute: `${titulo} · ${marca.nombre}` }, description: t(lang).heroTexto, alternates: alternates(lang, ''), openGraph: { images: imagenOg(lang), title: titulo, description: t(lang).heroTexto } };
}

const corta = (r: string) => { const x = r.split(',')[0]; return x.length > 70 ? x.slice(0, 67) + '…' : x; };

export default async function Inicio({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const ca = lang === 'ca';
  const d = t(lang);
  const ops = oposiciones();
  const mensual = pais.planes.find((p) => p.id === 'mensual')!;
  const anual = pais.planes.find((p) => p.id === 'anual');
  const nf = (n: number) => n.toLocaleString(ca ? 'ca-ES' : 'es-ES', { useGrouping: 'always' } as Intl.NumberFormatOptions);
  const total = totalPreguntas();
  const temas = ops.reduce((s, o) => s + o.temas.length, 0);
  const literal = ops.reduce((s, o) => s + (banco(o.slug)?.resumen.verificadasLiteral ?? 0), 0);

  // Pregunta real del banco gratuito (con cita literal) para enseñar cómo es cada pregunta.
  let muestra: { op: string; slug: string; p: NonNullable<ReturnType<typeof bancoPublico>>['gratis'][number] } | null = null;
  for (const o of ['mossos-esquadra', ...ops.map((x) => x.slug)]) {
    const b = bancoPublico(o);
    const p = b?.gratis.find((q) => q.cita && q.fuente?.url);
    if (b && p) { muestra = { op: b.oposicion.nombreCorto[lang], slug: o, p }; break; }
  }

  const pasos = ca
    ? [
        ['Tria la teva oposició', `Fes ${pais.gratisPorOposicion} preguntes gratis sense registre i sense targeta.`],
        ['Corregeix amb la llei', 'Cada resposta porta l\'explicació, l\'article i el fragment literal de la norma.'],
        ['Entrena com a l\'examen', 'Amb la subscripció: tot el banc, simulacres amb el temps i la penalització reals i repàs espaiat.'],
      ]
    : [
        ['Elige tu oposición', `Haz ${pais.gratisPorOposicion} preguntas gratis sin registro y sin tarjeta.`],
        ['Corrige con la ley', 'Cada respuesta lleva la explicación, el artículo y el fragmento literal de la norma.'],
        ['Entrena como en el examen', 'Con la suscripción: todo el banco, simulacros con el tiempo y la penalización reales y repaso espaciado.'],
      ];

  const faq = ca
    ? [
        ['És gratis?', `Sí: ${pais.gratisPorOposicion} preguntes de cada oposició, amb la correcció completa, sense registre. La subscripció (${precioTexto(mensual.importe, lang)}/mes, IVA inclòs) desbloqueja totes les preguntes i els simulacres de totes les oposicions.`],
        ['Les preguntes són oficials?', 'No són d\'exàmens anteriors. Estan generades amb IA a partir del text legal vigent de cada tema, comprovades contra la font i revisades una segona vegada. Cada resposta enllaça a l\'article perquè ho puguis comprovar tu.'],
        ['Puc cancel·lar quan vulgui?', 'Sí, amb un clic des del teu compte. Mantens l\'accés fins al final del període pagat i el teu historial no s\'esborra.'],
        ['És en català?', 'Sí. Tot està en català i en castellà, i pots canviar d\'idioma a cada pregunta.'],
      ]
    : [
        ['¿Es gratis?', `Sí: ${pais.gratisPorOposicion} preguntas de cada oposición, con la corrección completa, sin registro. La suscripción (${precioTexto(mensual.importe, lang)}/mes, IVA incluido) desbloquea todas las preguntas y los simulacros de todas las oposiciones.`],
        ['¿Las preguntas son oficiales?', 'No son de exámenes anteriores. Están generadas con IA a partir del texto legal vigente de cada tema, comprobadas contra la fuente y revisadas una segunda vez. Cada respuesta enlaza al artículo para que lo compruebes tú.'],
        ['¿Puedo cancelar cuando quiera?', 'Sí, con un clic desde tu cuenta. Mantienes el acceso hasta el final del periodo pagado y tu historial no se borra.'],
        ['¿Está en catalán?', 'Sí. Todo está en catalán y en castellano, y puedes cambiar de idioma en cada pregunta.'],
      ];

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${urlBase()}/#org`, name: marca.nombre, url: urlBase(), logo: `${urlBase()}/icons/icon-512.png` },
      { '@type': 'WebSite', '@id': `${urlBase()}/#web`, name: marca.nombre, url: `${urlBase()}/${lang}`, inLanguage: ca ? 'ca' : 'es', publisher: { '@id': `${urlBase()}/#org` } },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <section className="fondo-cuadricula border-b border-[#E4E4EF]">
        <div className="contenedor grid items-center gap-10 pt-10 pb-14 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20">
          <div>
            <p className="text-sm font-semibold text-marca">{ca ? 'Oposicions de Catalunya · en català i en castellà' : 'Oposiciones de Cataluña · en catalán y en castellano'}</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">{d.heroTitulo}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-suave">{d.heroTexto}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#oposicions" className="boton px-6">{ca ? 'Tria la teva oposició' : 'Elige tu oposición'}</a>
              <Link href={`/${lang}/precios`} className="boton-sec">{d.precios}</Link>
            </div>
            <p className="mt-3 text-sm text-suave">{d.gratisN(pais.gratisPorOposicion)} {ca ? 'Després,' : 'Después,'} {precioTexto(mensual.importe, lang)}{d.porMes}{anual ? ` ${ca ? 'o' : 'o'} ${precioTexto(anual.porMes, lang)}${d.porMes} ${ca ? 'en el pla anual' : 'en el plan anual'}` : ''}.</p>
          </div>

          {muestra ? (
            <figure className="relative">
              <div className="absolute -inset-3 -z-0 rotate-[-1.5deg] rounded-3xl bg-marca-claro" aria-hidden="true" />
              <div className="relative rounded-2xl border border-[#E4E4EF] bg-white p-5 shadow-[0_18px_40px_-20px_rgba(20,20,43,0.35)]">
                <figcaption className="flex items-center justify-between gap-2 text-xs text-suave">
                  <span className="font-semibold text-marca">{muestra.op} · {d.tema} {muestra.p.tema}</span>
                  <span>{ca ? 'Pregunta real del banc' : 'Pregunta real del banco'}</span>
                </figcaption>
                <p className="mt-3 font-semibold leading-snug">{muestra.p[lang].enunciado}</p>
                <ol className="mt-3 space-y-1.5 text-sm">
                  {muestra.p[lang].opciones.map((o, i) => (
                    <li key={i} className={`flex gap-2 rounded-lg border-2 px-3 py-2 ${i === muestra!.p.correcta ? 'border-ok bg-green-50 font-semibold' : 'border-slate-200 text-slate-600'}`}>
                      <span className="font-bold text-slate-400">{'abcd'[i]})</span><span>{o}</span>
                      {i === muestra!.p.correcta ? <span className="ml-auto text-ok" aria-label={d.app.correcta}>✓</span> : null}
                    </li>
                  ))}
                </ol>
                <blockquote className="mt-3 border-l-4 border-marca bg-papel px-3 py-2 text-xs text-slate-600">
                  <a href={muestra.p.fuente.url} target="_blank" rel="noopener nofollow" className="font-semibold text-marca underline">{muestra.p.fuente.norma.split(',')[0]}{muestra.p.fuente.articulo ? `, art. ${muestra.p.fuente.articulo}` : ''}</a>
                  <span className="mt-1 block italic">«{muestra.p.cita!.length > 170 ? muestra.p.cita!.slice(0, 167) + '…' : muestra.p.cita}»</span>
                </blockquote>
              </div>
            </figure>
          ) : null}
        </div>
      </section>

      <section aria-label={ca ? 'El banc en xifres' : 'El banco en cifras'} className="border-b border-[#E4E4EF] bg-white">
        <dl className="sello-dato contenedor grid grid-cols-2 gap-y-5 py-6 sm:grid-cols-4">
          <div className="flex flex-col-reverse"><dt>{d.preguntas} {ca ? 'al banc' : 'en el banco'}</dt><dd>{nf(total)}</dd></div>
          <div className="flex flex-col-reverse"><dt>{ca ? 'amb cita literal comprovada per màquina' : 'con cita literal comprobada por máquina'}</dt><dd>{nf(literal)}</dd></div>
          <div className="flex flex-col-reverse"><dt>{ca ? 'oposicions amb simulacre propi' : 'oposiciones con simulacro propio'}</dt><dd>{ops.length}</dd></div>
          <div className="flex flex-col-reverse"><dt>{ca ? 'temes del temari oficial' : 'temas del temario oficial'}</dt><dd>{temas}</dd></div>
        </dl>
      </section>

      <section id="oposicions" className="contenedor scroll-mt-20 pt-14">
        <h2 className="text-2xl font-bold sm:text-3xl">{ca ? 'Per a quina oposició estudies?' : '¿Para qué oposición estudias?'}</h2>
        <p className="mt-2 max-w-2xl text-suave">{ca ? 'Cada oposició té el seu temari, el seu simulacre amb el format de la convocatòria i les seves preguntes.' : 'Cada oposición tiene su temario, su simulacro con el formato de la convocatoria y sus preguntas.'}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ops.map((o) => {
            const b = banco(o.slug)!;
            return (
              <article key={o.slug} className="tarjeta group flex flex-col transition hover:border-marca hover:shadow-md">
                <p className="text-xs font-semibold text-suave">{o.administracion}</p>
                <h3 className="mt-1 text-lg font-bold leading-snug">
                  <Link href={`/${lang}/${o.slug}`} className="no-underline group-hover:text-marca">{o.nombre[lang]}</Link>
                </h3>
                <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <li className="etiqueta num">{nf(b.resumen.total)} {d.preguntas}</li>
                  <li className="etiqueta num">{o.temas.length} {d.temas}</li>
                  {o.convocatoria.plazas ? <li className="etiqueta num">{nf(o.convocatoria.plazas)} {d.plazas}</li> : null}
                </ul>
                <p className="mt-3 text-sm text-suave">{ca ? 'Examen' : 'Examen'}: {o.examen.preguntas} {d.preguntas} · {o.examen.minutos} {d.minutos}{o.examen.penalizacion ? ` · ${d.penaliza} ${o.examen.penalizacion === 0.25 ? '1/4' : o.examen.penalizacion}` : ''}</p>
                <p className="mt-1 text-xs text-slate-500">{d.convocatoria}: {corta(o.convocatoria.referencia)}</p>
                <div className="mt-auto flex gap-2 pt-5">
                  <Link href={`/${lang}/practicar/${o.slug}`} className="boton flex-1">{d.testGratis}</Link>
                  <Link href={`/${lang}/${o.slug}`} className="boton-sec" aria-label={`${d.temario}: ${o.nombreCorto[lang]}`}>{d.temario.split(' ')[0]}</Link>
                </div>
              </article>
            );
          })}
          <article className="flex flex-col justify-center rounded-2xl border-2 border-dashed border-slate-300 p-5 text-sm">
            <p className="font-semibold">{ca ? 'La teva oposició no hi és?' : '¿Tu oposición no está?'}</p>
            <p className="mt-1 text-suave">{ca ? 'Afegim oposicions noves segons el que ens demaneu. Digues-nos quina preparés.' : 'Añadimos oposiciones nuevas según lo que nos pedís. Dinos cuál preparas.'}</p>
            <Link href={`/${lang}/contacto`} className="mt-3 font-semibold text-marca">{ca ? 'Demana-la →' : 'Pídela →'}</Link>
          </article>
        </div>
      </section>

      <section className="contenedor mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{ca ? 'Com funciona' : 'Cómo funciona'}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {pasos.map(([titulo, texto], i) => (
            <li key={titulo} className="border-t-2 border-tinta pt-4">
              <span className="font-titulos text-sm font-bold text-marca">0{i + 1}</span>
              <h3 className="mt-1 text-lg font-bold">{titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-suave">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="contenedor mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{d.porQue}</h2>
          <p className="mt-3 text-suave">{ca ? 'Les grans plataformes se centren en les oposicions estatals. Nosaltres comencem per les de Catalunya, en català, i amb la font a cada resposta.' : 'Las grandes plataformas se centran en las oposiciones estatales. Nosotros empezamos por las de Cataluña, en catalán, y con la fuente en cada respuesta.'}</p>
          <p className="mt-4 text-sm text-suave">{ca ? 'Has trobat una errada?' : '¿Has encontrado un error?'} <Link href={`/${lang}/erratas`} className="font-semibold text-marca">{ca ? 'Fe d\'errates pública' : 'Fe de erratas pública'}</Link></p>
        </div>
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {([['v1t', 'v1'], ['v2t', 'v2'], ['v3t', 'v3'], ['v4t', 'v4'], ['v5t', 'v5'], ['v6t', 'v6']] as const).map(([a, b]) => (
            <div key={a}>
              <dt className="font-bold">{d[a]}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-suave">{d[b]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="contenedor mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">{ca ? 'Preguntes freqüents' : 'Preguntas frecuentes'}</h2>
        <div className="mt-4 divide-y divide-[#E4E4EF] border-y border-[#E4E4EF]">
          {faq.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}<span className="text-marca transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-suave">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="contenedor mt-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-tinta px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10">
          <div>
            <p className="font-titulos text-2xl font-bold">{ca ? 'Totes les oposicions, una sola subscripció.' : 'Todas las oposiciones, una sola suscripción.'}</p>
            <p className="mt-1 text-sm text-white/75">{precioTexto(mensual.importe, lang)}{d.porMes} · {d.ivaIncluido} · {ca ? 'cancel·la amb un clic' : 'cancela en un clic'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#oposicions" className="boton bg-white text-tinta hover:bg-marca-claro">{d.testGratis}</a>
            <Link href={`/${lang}/precios`} className="inline-flex min-h-11 items-center px-2 font-semibold text-white underline">{d.precios}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
