import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/config';
import { leerDoc } from '@/lib/contenido';

const DOCS = ['aviso-legal', 'privacidad', 'cookies', 'condiciones'];
// Dinámica: los datos LEGAL_* se leen en cada petición (cambiar una variable en Vercel no exige recompilar).
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; doc: string }> }) {
  const { locale, doc } = await params;
  return { title: leerDoc(`legal/${doc}.md`, locale)?.meta.titulo, robots: { index: false } };
}
export default async function Legal({ params }: { params: Promise<{ locale: Locale; doc: string }> }) {
  const { locale, doc } = await params;
  const d = DOCS.includes(doc) ? leerDoc(`legal/${doc}.md`, locale) : null;
  if (!d) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">{d.meta.titulo}</h1>
      {locale !== 'es' && <p className="mt-2 text-sm text-suave">Texto legal en español (versión vinculante).</p>}
      <div className="prosa mt-4" dangerouslySetInnerHTML={{ __html: d.html }} />
    </article>
  );
}
