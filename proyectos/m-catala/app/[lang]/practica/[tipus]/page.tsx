import { notFound } from 'next/navigation';
import Practica from '@/components/Practica';
import { esIdioma } from '@/lib/i18n';
import type { Idioma } from '@/lib/tipos';
const MODES = ['buits', 'transformacio', 'castellanismes', 'dictat', 'lexic', 'repas', 'mini', 'sessio'] as const;
export const generateStaticParams = () => ['ca', 'es'].flatMap((lang) => MODES.map((tipus) => ({ lang, tipus })));
export default async function Pagina({ params }: { params: Promise<{ lang: string; tipus: string }> }) { const { lang, tipus } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; if (!(MODES as readonly string[]).includes(tipus)) notFound(); return <Practica idioma={idioma} mode={tipus as (typeof MODES)[number]} />; }
