import Link from 'next/link';
import { esIdioma, t } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).practica;
  const tipus = ['repas', 'buits', 'transformacio', 'castellanismes', 'dictat', 'lexic'];
  return <div className="contenedor py-6"><h1 className="text-2xl font-bold">{d.titol}</h1><div className="mt-4 grid gap-2 sm:grid-cols-2">{tipus.map((k) => <Link key={k} href={`/${idioma}/practica/${k}`} className="tarjeta no-underline hover:border-nit"><p className="font-semibold">{d.tipus[k]}</p><p className="mt-1 text-sm text-suave">{d.tipusText[k]}</p></Link>)}<Link href={`/${idioma}/practica/mini`} className="tarjeta border-ocre no-underline"><p className="font-semibold">{t(idioma).avui.mini}</p></Link></div></div>;
}
