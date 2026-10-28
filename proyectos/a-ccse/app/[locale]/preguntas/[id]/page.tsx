import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { traducciones } from '@/lib/banco';
import { traductor } from '@/lib/i18n';
import { POR_ID, PREGUNTAS, ES_GRATIS, deTarea, FUENTE } from '@/lib/preguntas';

export const dynamicParams = false;
export function generateStaticParams() {
  return PREGUNTAS.map((p) => ({ locale: 'es', id: String(p.id) }));
}
const LETRAS = ['a', 'b', 'c'];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = POR_ID.get(Number((await params).id));
  if (!p) return {};
  return {
    title: { absolute: `${p.texto.replace(/…$/, '...')} | Pregunta CCSE ${p.id}` },
    description: `Pregunta ${p.id} del examen CCSE 2026. Respuesta correcta: ${p.opciones[p.respuesta]} Explicación y test en tu idioma.`,
    alternates: { canonical: `/es/preguntas/${p.id}` },
  };
}

export default async function PaginaPregunta({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const p = POR_ID.get(Number(id));
  if (!p || locale !== 'es') notFound();
  const t = traductor('es');
  const gratis = ES_GRATIS.has(p.id);
  const ex = gratis ? traducciones('es')[p.id] : undefined;
  const hermanas = deTarea(p.tarea);
  const k = hermanas.findIndex((x) => x.id === p.id);
  const otras = [...hermanas.slice(k + 1, k + 6), ...hermanas.slice(0, Math.max(0, k + 6 - hermanas.length))].filter((x) => x.id !== p.id).slice(0, 5);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Quiz', name: `Pregunta CCSE ${p.id}`, inLanguage: 'es',
    hasPart: { '@type': 'Question', name: p.texto, eduQuestionType: 'Multiple choice',
      acceptedAnswer: { '@type': 'Answer', text: p.opciones[p.respuesta] },
      suggestedAnswer: p.opciones.filter((_, i) => i !== p.respuesta).map((o) => ({ '@type': 'Answer', text: o })) },
  };
  return (
    <article className="mx-auto max-w-2xl">
      <p className="text-sm text-suave"><Link className="underline" href="/es/preguntas">300 preguntas</Link> · {t('tarea.n', { n: p.tarea })}: {t(`tarea.${p.tarea}` as 'tarea.1')}</p>
      <h1 className="mt-2 text-2xl font-black">{p.texto}</h1>
      <ol className="mt-4 grid gap-2">
        {p.opciones.map((o, i) => (
          <li key={i} className={`rounded-xl border-2 p-3 ${i === p.respuesta ? 'border-ok bg-green-50 font-semibold' : 'border-[#EADFCD] bg-white'}`}>
            {LETRAS[i]}) {o} {i === p.respuesta && <span className="text-ok">✓ {t('preg.respuesta')}</span>}
          </li>
        ))}
      </ol>
      <div className="tarjeta mt-4 p-4">
        <h2 className="font-bold">{t('test.explicacion')}</h2>
        {ex?.explicacion ? <p className="mt-1">{ex.explicacion}</p> : <p className="mt-1 text-suave">{t('test.bloqueada')}</p>}
        {p.pagina && <p className="mt-2 text-sm text-suave">{t('test.manual', { p: p.pagina })} · <a className="underline" href={FUENTE.url}>{FUENTE.titulo}</a></p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="boton boton-1" href={`/es/temas/${p.tarea}`}>{t('preg.practicar')}</Link>
        <Link className="boton boton-2" href="/es/simulacro">{t('inicio.cta2')}</Link>
      </div>
      <h2 className="mt-8 font-bold">{t('preg.otras')}</h2>
      <ul className="mt-2 grid gap-1">{otras.map((o) => <li key={o.id}><Link className="underline" href={`/es/preguntas/${o.id}`}>{o.texto}</Link></li>)}</ul>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </article>
  );
}
