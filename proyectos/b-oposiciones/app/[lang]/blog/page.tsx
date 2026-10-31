import Link from 'next/link';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { marca } from '@/lib/datos';
import { alternates } from '@/lib/seo';
import { articulos } from '@/lib/blog';
import { fechaLarga } from '@/components/Convocatoria';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  const titulo = lang === 'ca' ? 'Blog: com són els exàmens de les oposicions catalanes' : 'Blog: cómo son los exámenes de las oposiciones catalanas';
  const desc = lang === 'ca'
    ? 'Guies sobre el format, la penalització i la preparació de cada oposició de Catalunya, amb les dades de la convocatòria.'
    : 'Guías sobre el formato, la penalización y la preparación de cada oposición de Cataluña, con los datos de la convocatoria.';
  return { title: { absolute: `${titulo} · ${marca.nombre}` }, description: desc, alternates: alternates(lang, '/blog') };
}

export default async function Blog({ params }: { params: Promise<{ lang: Idioma }> }) {
  const { lang } = await params;
  return (
    <div className="contenedor py-10">
      <nav className="text-xs text-slate-500"><Link href={`/${lang}`}>{marca.nombre}</Link> › Blog</nav>
      <h1 className="mt-2 text-3xl font-bold">{lang === 'ca' ? 'Com són els exàmens' : 'Cómo son los exámenes'}</h1>
      <p className="mt-2 max-w-3xl text-slate-700">
        {lang === 'ca'
          ? 'Una guia per oposició: format de la prova, penalització, temari i com practicar amb el rellotge real.'
          : 'Una guía por oposición: formato de la prueba, penalización, temario y cómo practicar con el reloj real.'}
      </p>
      <div className="mt-6 grid gap-3">
        {articulos().map((a) => (
          <article key={a.slug} className="tarjeta p-4">
            <p className="text-xs text-slate-500">{fechaLarga(a.actualizado, lang)}</p>
            <h2 className="mt-1 font-bold"><Link href={`/${lang}/blog/${a.slug}`} className="no-underline hover:text-marca">{a.h1[lang]}</Link></h2>
            <p className="mt-1 text-sm text-slate-700">{a.descripcion[lang]}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
