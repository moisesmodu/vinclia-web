import Link from 'next/link';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { alternates, jsonLd } from '@/lib/seo';
import { fechaLarga } from '@/components/Convocatoria';
import datos from '@/contenido/convocatorias.json';

type Conv = {
  id: string; organismo: string; cuerpo: Record<Idioma, string>; grupo?: string | null; plazas?: number | null; estado: string;
  referencia?: string | null; diario?: string | null; fechaPublicacion?: string | null; plazoHasta?: string | null; fechaExamen?: string | null;
  url?: string | null; oposicion?: string | null; verificado?: string; nota?: Record<Idioma, string>;
};

const ORDEN: Record<string, number> = { abierta: 0, 'en curso': 1, prevista: 2, cerrada: 3 };

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: { absolute: `${t(lang).convocatoriasTitulo}: ${lang === 'ca' ? 'places, terminis i dates d\'examen' : 'plazas, plazos y fechas de examen'}` }, description: t(lang).convocatoriasTexto, alternates: alternates(lang, '/convocatorias') };
}

const fecha = (f: string | null | undefined, l: Idioma) => (!f ? '—' : /^\d{4}-\d{2}$/.test(f) ? new Date(f + '-15').toLocaleDateString(l === 'ca' ? 'ca-ES' : 'es-ES', { month: 'long', year: 'numeric' }) : fechaLarga(f, l));

export default async function Convocatorias({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const d = t(lang);
  const lista = [...(datos.convocatorias as Conv[])].sort((a, b) => (ORDEN[a.estado] ?? 9) - (ORDEN[b.estado] ?? 9) || (b.plazas ?? 0) - (a.plazas ?? 0));
  const total = lista.reduce((s, c) => s + (c.plazas ?? 0), 0);
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: d.convocatoriasTitulo,
    itemListElement: lista.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `${c.organismo}: ${c.cuerpo[lang]}`, url: c.url ?? undefined })),
  };
  return (
    <div className="contenedor py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <h1 className="text-3xl font-bold">{d.convocatoriasTitulo}</h1>
      <p className="mt-2 max-w-3xl text-slate-700">{d.convocatoriasTexto}</p>
      <p className="mt-2 flex flex-wrap gap-2 text-sm"><span className="etiqueta">{lista.length} {lang === 'ca' ? 'processos' : 'procesos'}</span><span className="etiqueta">{total.toLocaleString(lang)} {d.plazas}</span><span className="etiqueta">{d.actualizado} {datos.actualizado}</span></p>
      <div className="mt-6 grid gap-3">
        {lista.map((c) => (
          <article key={c.id} className="tarjeta p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.organismo}{c.grupo ? ` · ${c.grupo}` : ''}</p>
                <h2 className="font-bold">{c.cuerpo[lang]}</h2>
              </div>
              <span className={`etiqueta ${c.estado === 'abierta' ? 'bg-green-100 text-ok' : ''}`}>{d.estado[c.estado] ?? c.estado}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-slate-500">{lang === 'ca' ? 'Places' : 'Plazas'}</dt><dd className="font-semibold">{c.plazas ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">{lang === 'ca' ? 'Publicació' : 'Publicación'}</dt><dd>{fecha(c.fechaPublicacion, lang)}</dd></div>
              <div><dt className="text-xs text-slate-500">{lang === 'ca' ? 'Inscripció fins' : 'Inscripción hasta'}</dt><dd>{fecha(c.plazoHasta, lang)}</dd></div>
              <div><dt className="text-xs text-slate-500">{lang === 'ca' ? 'Examen' : 'Examen'}</dt><dd>{fecha(c.fechaExamen, lang)}</dd></div>
            </dl>
            {c.nota?.[lang] ? <p className="mt-2 text-sm text-slate-600">{c.nota[lang]}</p> : null}
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {c.referencia ? (c.url ? <a href={c.url} target="_blank" rel="noopener" className="text-marca underline">{c.referencia}{c.diario && c.diario !== '—' ? ` (${c.diario})` : ''}</a> : <span className="text-slate-600">{c.referencia}</span>) : null}
              {c.oposicion ? <Link href={`/${lang}/${c.oposicion}`} className="boton-sec min-h-9 px-3 py-1 text-xs">{d.testGratis}</Link> : null}
              {c.verificado && /secundaria/.test(c.verificado) ? <span className="text-xs text-amber-700">{lang === 'ca' ? 'Font secundària: comprova-ho al diari oficial' : 'Fuente secundaria: compruébalo en el diario oficial'}</span> : null}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
