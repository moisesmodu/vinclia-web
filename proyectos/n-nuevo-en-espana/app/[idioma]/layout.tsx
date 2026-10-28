import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Outfit, Noto_Sans, Noto_Sans_Arabic, Noto_Sans_SC } from "next/font/google";
import { IDIOMAS, IDIOMAS_RTL, esIdioma, urlBase } from "@/lib/config";
import { dicc, LOCALE_BCP47 } from "@/lib/i18n";
import Cabecera from "@/components/Cabecera";
import Pie from "@/components/Pie";
import RegistroSW from "@/components/RegistroSW";

const titulo = Outfit({ subsets: ["latin", "latin-ext"], weight: ["700"], variable: "--font-titulo", display: "swap" });
const texto = Noto_Sans({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["400", "600"], variable: "--font-texto", display: "swap" });
const arabe = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-arabe", display: "swap", preload: false });
const chino = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-chino", display: "swap", preload: false });

export function generateStaticParams() {
  return IDIOMAS.map((idioma) => ({ idioma }));
}

export async function generateMetadata({ params }: { params: Promise<{ idioma: string }> }): Promise<Metadata> {
  const { idioma } = await params;
  const d = dicc(idioma);
  return {
    metadataBase: new URL(urlBase()),
    title: { default: d.meta.titulo, template: `%s · ${d.marca}` },
    description: d.meta.descripcion,
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/marca/icono.svg", type: "image/svg+xml" }, { url: "/iconos/favicon-32.png", sizes: "32x32" }], apple: "/iconos/icono-192.png" },
    alternates: {
      canonical: `/${idioma}`,
      languages: Object.fromEntries(IDIOMAS.map((i) => [LOCALE_BCP47[i], `/${i}`]))
    },
    openGraph: { title: d.meta.titulo, description: d.meta.descripcion, siteName: d.marca, locale: LOCALE_BCP47[idioma], type: "website" }
  };
}

export const viewport: Viewport = { themeColor: "#D9603B", width: "device-width", initialScale: 1 };

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const d = dicc(idioma);
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang={LOCALE_BCP47[idioma]} dir={IDIOMAS_RTL.has(idioma) ? "rtl" : "ltr"} className={[titulo.variable, texto.variable, idioma === "ar" ? arabe.variable : "", idioma === "zh" ? chino.variable : ""].join(" ")}>
      <body className="min-h-dvh flex flex-col">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-tarjeta">{d.comun.inicio}</a>
        <Cabecera idioma={idioma} d={d} />
        <main id="contenido" className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">{children}</main>
        <Pie idioma={idioma} d={d} />
        <RegistroSW />
        {plausible ? <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" /> : null}
      </body>
    </html>
  );
}
