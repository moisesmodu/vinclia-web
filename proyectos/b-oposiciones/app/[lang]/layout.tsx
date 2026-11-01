import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '../globals.css';
import { esIdioma } from '@/lib/i18n';
import { IDIOMAS } from '@/lib/tipos';
import { marca, urlBase } from '@/lib/datos';
import Cabecera from '@/components/Cabecera';
import Pie from '@/components/Pie';
import RegistroSW from '@/components/RegistroSW';
import { Analytics } from '@vercel/analytics/next';
import Atribucion from '@/components/Atribucion';

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
    icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192' }], apple: '/icons/icon-192.png' },
    appleWebApp: { capable: true, title: marca.nombre, statusBarStyle: 'default' },
    applicationName: marca.nombre,
    openGraph: { type: 'website', siteName: marca.nombre, locale: l === 'ca' ? 'ca_ES' : 'es_ES', alternateLocale: l === 'ca' ? ['es_ES'] : ['ca_ES'] },
    twitter: { card: 'summary_large_image' },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export const viewport: Viewport = { themeColor: marca.color, width: 'device-width', initialScale: 1 };

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!esIdioma(lang)) notFound();
  return (
    <html lang={lang}>
      <body className="flex min-h-dvh flex-col">
        <a href="#contenido" className="saltar">{lang === 'ca' ? 'Ves al contingut' : 'Ir al contenido'}</a>
        <Cabecera idioma={lang} />
        <main id="contenido" className="flex-1">{children}</main>
        <Pie idioma={lang} />
        <RegistroSW />
        {/* Atribución sin cookies: gclid y utm_* de la URL → almacenamiento local 30 días → metadatos del pago (lib/atribucion.ts). */}
        <Atribucion />
        <Analytics />
      </body>
    </html>
  );
}
