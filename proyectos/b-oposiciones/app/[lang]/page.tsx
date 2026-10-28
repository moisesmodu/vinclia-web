import Link from 'next/link';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { banco, oposiciones, pais, marca, totalPreguntas, precioTexto } from '@/lib/datos';
import { alternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  const titulo = lang === 'ca' ? 'Tests d\'oposicions de Catalunya gratis: Generalitat, Mossos, Bombers, ICS i ajuntaments' : 'Tests de oposiciones de Cataluña gratis: Generalitat, Mossos, Bombers, ICS y ayuntamientos';
  return { title: { absolute: `${titulo} · ${marca.nombre}` }, description: t(lang).heroTexto, alternates: alternates(lang, '') };
}

const corta = (r: string) => { const x = r.split(',')[0]; return x.length > 70 ? x.slice(0, 67) + '…' : x; };

export default async function Inicio({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const d = t(lang);
  const ops = oposiciones();
  const mensual = pais.planes.find((p) => p.id === 'mensual')!;
  return (
    <>
      <section className="bg-gradient-to-b from-marca-claro/60 to-slate-50">
        <div className="contenedor py-12 sm:py-16">
          <p className="etiqueta">{totalPreguntas()} {d.preguntas} · {d.verificadas}</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{d.heroTitulo}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">{d.heroTexto}</p>
          <p className="mt-3 text-sm font-medium text-slate-600">{d.gratisN(pais.gratisPorOposicion)} · {precioTexto(mensual.importe, lang)}{d.porMes}</p>
        </div>
      </section>
      <section className="contenedor -mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ops.map((o) => {
          const b = banco(o.slug)!;
          return (
            <article key={o.slug} className="tarjeta flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{o.administracion}</p>
              <h2 className="mt-1 text-lg font-bold">
                <Link href={`/${lang}/${o.slug}`} className="no-underline hover:text-marca">{o.nombre[lang]}</Link>
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {b.resumen.total} {d.preguntas} · {o.temas.length} {d.temas} · {o.examen.preguntas} {d.preguntas} / {o.examen.minutos} {d.minutos}
              </p>
              <p className="mt-1 text-xs text-slate-500">{d.convocatoria}: {corta(o.convocatoria.referencia)}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link href={`/${lang}/practicar/${o.slug}`} className="boton flex-1">{d.testGratis}</Link>
                <Link href={`/${lang}/${o.slug}`} className="boton-sec">{d.temario}</Link>
              </div>
            </article>
          );
        })}
      </section>
      <section className="contenedor mt-14">
        <h2 className="text-2xl font-bold">{d.porQue}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([['v1t', 'v1'], ['v2t', 'v2'], ['v3t', 'v3'], ['v4t', 'v4'], ['v5t', 'v5'], ['v6t', 'v6']] as const).map(([a, b]) => (
            <div key={a} className="tarjeta">
              <h3 className="font-bold text-marca">{d[a]}</h3>
              <p className="mt-1 text-sm text-slate-700">{d[b]}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/${lang}/convocatorias`} className="boton-sec">{d.convocatoriasTitulo}</Link>
          <Link href={`/${lang}/precios`} className="boton-sec">{d.precios}</Link>
        </div>
      </section>
    </>
  );
}
