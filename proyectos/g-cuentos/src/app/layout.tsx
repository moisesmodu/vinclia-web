import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Familia Lunilla: Baloo 2 (títulos) y Nunito (texto), dos pesos (MARCAS.md §3). Archivos estáticos en assets/fuentes
// porque el PDF usa los mismos.
const nunito = localFont({
  src: [
    { path: "../../assets/fuentes/Nunito-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fuentes/Nunito-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../assets/fuentes/Nunito-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-nunito",
  display: "swap",
});
const baloo = localFont({ src: "../../assets/fuentes/Baloo2-Bold.ttf", weight: "700", variable: "--font-baloo", display: "swap" });

const base = process.env.URL_BASE ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "Lunilla · Un cuento donde el protagonista eres tú", template: "%s · Lunilla" },
  description: "Cuentos infantiles personalizados con el nombre, la ciudad y la mascota de tu peque. 12 páginas ilustradas, PDF en menos de 2 horas o libro de tapa dura. En castellano y catalán.",
  applicationName: "Lunilla",
  openGraph: { siteName: "Lunilla", type: "website", locale: "es_ES", images: ["/muestras/leo-y-la-luz-de-la-luna/00.webp"] },
};
export const viewport: Viewport = { themeColor: "#2B3A67", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${baloo.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
