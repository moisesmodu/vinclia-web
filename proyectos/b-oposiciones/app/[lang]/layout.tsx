import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { esIdioma } from '@/lib/i18n';
import { IDIOMAS } from '@/lib/tipos';
import { marca, urlBase } from '@/lib/datos';
import Cabecera from '@/components/Cabecera';
import Pie from '@/components/Pie';
import RegistroSW from '@/components/RegistroSW';

export const generateStaticParams = () => IDIOMAS.map((lang) => ({ lang }));
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = esIdioma(lang) ? lang : 'ca';
  return {
    metadataBase: new URL(urlBase()),
    title: { default: `${marca.nombre} · ${marca.lema[l]}`, template: `%s · ${marca.nombre}` },
    description: marca.lema[l],
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
    appleWebApp: { capable: true, title: marca.nombre, statusBarStyle: 'default' },
  };
}

export const viewport: Viewport = { themeColor: marca.color, width: 'device-width', initialScale: 1 };

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  return (
    <html lang={lang}>
      <body className="flex min-h-dvh flex-col">
        <Cabecera idioma={lang} />
        <main className="flex-1">{children}</main>
        <Pie idioma={lang} />
        <RegistroSW />
      </body>
    </html>
  );
}
