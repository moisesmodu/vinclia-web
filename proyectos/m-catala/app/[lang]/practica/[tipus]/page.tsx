import { notFound } from 'next/navigation';
import Practica from '@/components/Practica';
import type { Metadata } from 'next';
import { esIdioma, t } from '@/lib/i18n';
import { meta } from '@/lib/meta';
import type { Idioma } from '@/lib/tipos';
const MODES = ['buits', 'transformacio', 'castellanismes', 'dictat', 'lexic', 'repas', 'mini', 'sessio'] as const;
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => MODES.map((tipus) => ({ lang, tipus })));
export async function generateMetadata({ params }: { params: Promise<{ lang: string; tipus: string }> }): Promise<Metadata> { const { lang, tipus } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(l); return meta(l, `/practica/${tipus}`, d.practica.tipus[tipus] ?? d.practica.titol, d.nou.sessioTitol, { noIndex: true }); }
export default async function Pagina({ params }: { params: Promise<{ lang: string; tipus: string }> }) { const { lang, tipus } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; if (!(MODES as readonly string[]).includes(tipus)) notFound(); return <Practica idioma={idioma} mode={tipus as (typeof MODES)[number]} />; }
