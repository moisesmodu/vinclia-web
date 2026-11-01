import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Outfit, Noto_Sans } from 'next/font/google';
import '../globals.css';
import { LOCALES, RTL, SITE_URL, esLocale, type Locale } from '@/lib/config';
import { mensajes, traductor } from '@/lib/i18n';
import { EstadoProvider } from '@/components/Estado';
import { Cabecera } from '@/components/Cabecera';
import { Pie } from '@/components/Pie';
import { RegistrarSW } from '@/components/RegistrarSW';
import { AvisoRecuperacion } from '@/components/AvisoRecuperacion';
import { Analytics } from '@vercel/analytics/next';
import { HREFLANG } from '@/lib/seo';

// Fuentes de la familia Nuevo en España servidas desde el propio dominio (sin hoja de estilos externa que bloquee el render).
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], weight: ['600', '700'], variable: '--font-outfit', display: 'swap' });
const noto = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600', '700'], variable: '--font-noto', display: 'swap' });

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
export const viewport: Viewport = { themeColor: '#D9603B', width: 'device-width', initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!esLocale(locale)) return {};
  const t = traductor(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${t('seo.home.t')} | ${t('marca')}`, template: `%s | ${t('marca')}` },
    description: t('seo.home.d'),
    applicationName: t('marca'),
    manifest: '/manifest.webmanifest',
    icons: { icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192' }], apple: '/icons/apple-touch-icon.png' },
    openGraph: { siteName: t('marca'), type: 'website', locale: HREFLANG[locale].replace('-', '_'), title: `${t('marca')} · ${t('lema')}`, description: t('seo.home.d'), images: [{ url: `/og/${locale}.jpg`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [`/og/${locale}.jpg`] },
    appleWebApp: { capable: true, title: t('marca') },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!esLocale(locale)) notFound();
  const l = locale as Locale;
  const umami = process.env.NEXT_PUBLIC_UMAMI_SRC;
  return (
    <html lang={l} dir={RTL.includes(l) ? 'rtl' : 'ltr'} className={`${outfit.variable} ${noto.variable}`}>
      <head>
        {/* Árabe y chino: su Noto solo en esos idiomas (Outfit y Noto Sans van autoalojadas con next/font). */}
        {(l === 'ar' || l === 'zh') && (
          <>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${l === 'ar' ? 'Noto+Sans+Arabic' : 'Noto+Sans+SC'}:wght@400;700&display=swap`} />
          </>
        )}
      </head>
      <body className="min-h-dvh">
        <EstadoProvider locale={l} mensajes={mensajes(l)}>
          <a href="#contenido" className="saltar">{traductor(l)('a11y.saltar')}</a>
          <Cabecera locale={l} />
          <AvisoRecuperacion />
          <main id="contenido" tabIndex={-1} className="contenedor py-6 outline-none">{children}</main>
          <Pie locale={l} />
        </EstadoProvider>
        <RegistrarSW />
        {umami && <script defer src={umami} data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} />}
        {/* Vercel Web Analytics: sin cookies; recoge ruta y utm_* de cada pieza de marketing (marketing/MEDICION.md). */}
        <Analytics />
      </body>
    </html>
  );
}
