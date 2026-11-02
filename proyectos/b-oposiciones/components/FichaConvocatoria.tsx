import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, pais, precioTexto } from '@/lib/datos';
import { type Conv, visible, indexable, fecha, primaria } from '@/lib/convocatorias';

/**
 * Ficha de una convocatoria con SOLO los datos verificados (fuente primaria o campo comprobado en el diario oficial).
 * Lo que no está verificado no se enseña: se dice que está pendiente y se enlaza la fuente.
 */
export function FichaConvocatoria({ c, lang, titulo }: { c: Conv; lang: Idioma; titulo?: React.ReactNode }) {
  const d = t(lang);
  const ca = lang === 'ca';
  const filas: [string, string][] = [];
  if (visible(c, 'plazas')) filas.push([ca ? 'Places' : 'Plazas', c.plazas!.toLocaleString(lang)]);
  if (visible(c, 'grupo') && c.grupo !== 'varios') filas.push([ca ? 'Grup' : 'Grupo', c.grupo!]);
  if (visible(c, 'diario') && visible(c, 'fechaPublicacion')) filas.push([ca ? 'Publicació' : 'Publicación', `${c.diario}, ${fecha(c.fechaPublicacion, lang)}`]);
  else if (visible(c, 'fechaPublicacion')) filas.push([ca ? 'Publicació' : 'Publicación', fecha(c.fechaPublicacion, lang)]);
  if (visible(c, 'plazoHasta')) filas.push([ca ? 'Inscripció fins' : 'Inscripción hasta', fecha(c.plazoHasta, lang)]);
  if (visible(c, 'fechaExamen')) filas.push([ca ? 'Examen' : 'Examen', fecha(c.fechaExamen, lang)]);
  if (visible(c, 'estado')) filas.push([ca ? 'Estat' : 'Estado', d.estado[c.estado] ?? c.estado]);
  const ref = visible(c, 'referencia') || c.referencia ? c.referencia : null;
  const fuentes = c.comprobado?.fuentes ?? [];
  return (
    <section className="tarjeta">
      {titulo ? <h2 className="text-lg font-bold">{titulo}</h2> : null}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.organismo}</p>
      <p className="mt-1 font-semibold">{c.cuerpo[lang]}</p>
      {filas.length ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          {filas.map(([k, v]) => (<div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>))}
        </dl>
      ) : null}
      {c.comprobado?.datos?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">{c.comprobado.datos.map((x) => <li key={x[lang]}>{x[lang]}</li>)}</ul>
      ) : null}
      {ref ? (
        <p className="mt-3 text-sm">
          <span className="text-slate-500">{visible(c, 'referencia') ? (ca ? 'Referència oficial: ' : 'Referencia oficial: ') : (ca ? 'Referència (pendent de comprovar): ' : 'Referencia (pendiente de comprobar): ')}</span>
          {c.url && (visible(c, 'url') || !indexable(c)) ? <a href={c.url} target="_blank" rel="noopener" className="break-words text-marca underline">{ref}</a> : <span className="break-words">{ref}</span>}
        </p>
      ) : null}
      {fuentes.length ? (
        <p className="mt-2 text-xs text-slate-600">
          {ca ? `Comprovat el ${fecha(c.comprobado!.fecha, lang)} a: ` : `Comprobado el ${fecha(c.comprobado!.fecha, lang)} en: `}
          {fuentes.map((f, i) => (<span key={f.url}>{i ? ' · ' : ''}<a href={f.url} target="_blank" rel="noopener" className="text-marca underline">{f.nombre}</a></span>))}
        </p>
      ) : null}
      {!primaria(c) && !c.comprobado ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          {ca
            ? "Encara no hem pogut comprovar les places, els terminis ni les dates d'aquesta convocatòria al diari oficial, i per això no les mostrem. Consulta-les a la font oficial o a la web de l'organisme convocant."
            : 'Aún no hemos podido comprobar las plazas, los plazos ni las fechas de esta convocatoria en el diario oficial, y por eso no las mostramos. Consúltalas en la fuente oficial o en la web del organismo convocante.'}
        </p>
      ) : null}
    </section>
  );
}

/** Temario del banco (si existe) enlazado tema a tema. */
export function TemarioBanco({ slug, lang, nota }: { slug: string; lang: Idioma; nota?: string }) {
  const b = banco(slug);
  if (!b) return null;
  const o = b.oposicion;
  const d = t(lang);
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{d.temario}: {o.nombreCorto[lang]}</h2>
      {nota ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{nota}</p> : null}
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {o.temas.map((x) => (
          <li key={x.n}>
            <Link href={`/${lang}/${o.slug}/${x.slug}`} className="tarjeta flex h-full items-start gap-3 p-3 no-underline hover:border-marca">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-marca-claro text-xs font-bold text-marca-oscuro">{x.n}</span>
              <span className="flex-1 text-sm font-medium text-tinta">{x.titulo[lang]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Llamada a los tests gratis y a la suscripción. Sin banco propio, lleva a la portada (todas las oposiciones). */
export function CtaTests({ slug, lang }: { slug?: string | null; lang: Idioma }) {
  const d = t(lang);
  const b = slug ? banco(slug) : undefined;
  const ca = lang === 'ca';
  const mensual = pais.planes.find((p) => p.id === 'mensual');
  return (
    <section className="mt-10 grid gap-5 rounded-3xl bg-tinta p-6 text-white sm:grid-cols-[1.4fr_1fr] sm:items-center sm:p-8">
      <div>
        <p className="font-titulos text-2xl font-bold">
          {b
            ? (ca ? `Prepara-la amb ${b.resumen.total} preguntes de ${b.oposicion.nombreCorto.ca}` : `Prepárala con ${b.resumen.total} preguntas de ${b.oposicion.nombreCorto.es}`)
            : (ca ? 'Tests i simulacres per a oposicions de Catalunya' : 'Tests y simulacros para oposiciones de Cataluña')}
        </p>
        <p className="mt-2 text-sm text-white/75">{d.gratisN(pais.gratisPorOposicion)} {ca ? 'La subscripció inclou totes les oposicions, simulacres i repàs de les que falles.' : 'La suscripción incluye todas las oposiciones, simulacros y repaso de las que fallas.'}</p>
      </div>
      <div className="sm:text-right">
        {mensual ? <p><span className="font-titulos text-3xl font-bold">{precioTexto(mensual.importe, lang)}</span><span className="text-white/75">{d.porMes}</span></p> : null}
        <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
          <Link href={b ? `/${lang}/practicar/${b.oposicion.slug}` : `/${lang}`} className="boton bg-white text-tinta hover:bg-marca-claro">{d.testGratis}</Link>
          <Link href={`/${lang}/precios`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-white underline">{d.precios}</Link>
        </div>
      </div>
    </section>
  );
}
