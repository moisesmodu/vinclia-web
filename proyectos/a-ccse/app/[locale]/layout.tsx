import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { LOCALES, RTL, SITE_URL, esLocale, type Locale } from '@/lib/config';
import { mensajes, traductor } from '@/lib/i18n';
import { EstadoProvider } from '@/components/Estado';
import { Cabecera } from '@/components/Cabecera';
import { Pie } from '@/components/Pie';
import { RegistrarSW } from '@/components/RegistrarSW';

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
    title: { default: t('inicio.h1'), template: `%s · ${t('marca')}` },
    description: t('inicio.sub'),
    applicationName: t('marca'),
    manifest: '/manifest.webmanifest',
    icons: { icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192' }], apple: '/icons/apple-touch-icon.png' },
    openGraph: { siteName: t('marca'), type: 'website', locale },
    appleWebApp: { capable: true, title: 'CCSE' },
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!esLocale(locale)) notFound();
  const l = locale as Locale;
  const umami = process.env.NEXT_PUBLIC_UMAMI_SRC;
  return (
    <html lang={l} dir={RTL.includes(l) ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Familia Nuevo en España: Outfit (títulos) y Noto Sans (texto); árabe y chino con su Noto. */}
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Noto+Sans:wght@400;700${l === 'ar' ? '&family=Noto+Sans+Arabic:wght@400;700' : ''}${l === 'zh' ? '&family=Noto+Sans+SC:wght@400;700' : ''}&display=swap`}
        />
      </head>
      <body className="min-h-dvh">
        <EstadoProvider locale={l} mensajes={mensajes(l)}>
          <Cabecera locale={l} />
          <main className="contenedor py-6">{children}</main>
          <Pie locale={l} />
        </EstadoProvider>
        <RegistrarSW />
        {umami && <script defer src={umami} data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID} />}
      </body>
    </html>
  );
}
