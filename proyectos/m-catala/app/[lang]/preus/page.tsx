import type { Metadata } from 'next';
import { meta } from '@/lib/meta';
import Preus from '@/components/Preus';
import { esIdioma, t } from '@/lib/i18n';
import { marca, pais } from '@/lib/datos';
import { esModoPrueba, modoPago } from '@/lib/pagos';
import type { Idioma } from '@/lib/tipos';
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; const l = (esIdioma(lang) ? lang : 'ca') as Idioma; return meta(l, '/preus', t(l).preus.titol, t(l).nou.unPreu); }
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma;
  return <div className="contenedor py-8"><Preus idioma={idioma} planes={pais.planes.filter((p) => p.activo)} modeProva={modoPago() !== 'stripe' || esModoPrueba()} /><p className="mt-8 text-[13px] font-semibold text-boli">{marca.sello[idioma]}</p></div>;
}
