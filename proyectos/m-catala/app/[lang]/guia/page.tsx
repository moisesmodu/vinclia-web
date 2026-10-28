import Link from 'next/link';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { BANC } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; return { title: t(l).pie.guies }; }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma;
  const grups = ['examen', 'cos', 'guia', 'calendari'];
  const nom: Record<string, Record<string, string>> = { ca: { examen: 'Els exàmens', cos: 'Quin nivell demana cada cos', guia: 'Guies i errors freqüents', calendari: 'Calendari i inscripció' }, es: { examen: 'Los exámenes', cos: 'Qué nivel pide cada cuerpo', guia: 'Guías y errores frecuentes', calendari: 'Calendario e inscripción' } };
  return <div className="contenedor py-6"><h1>{t(idioma).pie.guies}</h1>{grups.map((g) => { const ps = BANC.seo.filter((p) => p.tipus === g); if (!ps.length) return null; return <section key={g} className="mt-6"><h2 className="text-[20px]">{nom[idioma][g]}</h2><ul className="mt-2 grid gap-2 sm:grid-cols-2">{ps.map((p) => <li key={p.slug}><Link href={`/${idioma}/guia/${p.slug}`} className="full block py-3 no-underline hover:border-tinta"><p className="font-semibold">{p.titol[idioma]}</p><p className="mt-1 text-[13px] text-terciari">{p.descripcio[idioma]}</p></Link></li>)}</ul></section>; })}</div>;
}
