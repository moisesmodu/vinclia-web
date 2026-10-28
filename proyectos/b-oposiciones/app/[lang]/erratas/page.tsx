import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { db, hayDb } from '@/lib/db';
import { alternates } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).pie.erratas, alternates: alternates(lang, '/erratas') };
}

/** Fe de erratas pública: qué preguntas se han corregido tras un aviso y cuándo. */
export default async function Erratas({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  const ca = lang === 'ca';
  const lista = hayDb()
    ? await db.errata.findMany({ where: { estado: 'resuelta', NOT: { oposicion: 'contacto' } }, orderBy: { fecha: 'desc' }, take: 200, select: { id: true, oposicion: true, preguntaId: true, fecha: true } }).catch(() => [])
    : [];
  return (
    <div className="contenedor max-w-3xl py-10">
      <h1 className="text-2xl font-extrabold">{t(lang).pie.erratas}</h1>
      <p className="mt-2 text-slate-700">{ca ? 'Cada avís d\'error es revisa en menys de 24 hores laborables. Aquí queden les preguntes corregides.' : 'Cada aviso de error se revisa en menos de 24 horas laborables. Aquí quedan las preguntas corregidas.'}</p>
      {lista.length ? (
        <ul className="mt-6 space-y-2 text-sm">
          {lista.map((e) => <li key={e.id} className="tarjeta flex justify-between p-3"><span className="font-mono">{e.preguntaId}</span><span className="text-slate-500">{e.oposicion} · {e.fecha.toISOString().slice(0, 10)}</span></li>)}
        </ul>
      ) : <p className="mt-6 text-sm text-slate-500">{ca ? 'Encara no hi ha cap correcció publicada.' : 'Aún no hay ninguna corrección publicada.'}</p>}
    </div>
  );
}
