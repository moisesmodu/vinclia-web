import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { IDIOMAS } from '@/lib/tipos';
import { banco, oposiciones } from '@/lib/datos';
import { alternates } from '@/lib/seo';
import Practica from '@/components/Practica';

type P = { params: Promise<{ lang: Idioma; oposicion: string }>; searchParams: Promise<{ tema?: string; modo?: string }> };

export const generateStaticParams = () => IDIOMAS.flatMap((lang) => oposiciones().map((o) => ({ lang, oposicion: o.slug })));
export const dynamicParams = false;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, oposicion } = await params;
  const b = banco(oposicion);
  return b ? { title: `${lang === 'ca' ? 'Practicar' : 'Practicar'}: ${b.oposicion.nombreCorto[lang]}`, alternates: alternates(lang, `/practicar/${oposicion}`), robots: { index: false } } : {};
}

export default async function Pagina({ params, searchParams }: P) {
  const { lang, oposicion } = await params;
  const sp = await searchParams;
  const b = banco(oposicion);
  if (!b) notFound();
  return <Practica idioma={lang} op={b.oposicion} inicial={{ tema: sp.tema ? Number(sp.tema) : undefined, modo: sp.modo }} />;
}
