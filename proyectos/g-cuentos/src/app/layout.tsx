import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const andika = localFont({
  src: [
    { path: "../../assets/fuentes/Andika-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fuentes/Andika-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../assets/fuentes/Andika-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-andika",
  display: "swap",
});
const sniglet = localFont({ src: "../../assets/fuentes/Sniglet-ExtraBold.ttf", variable: "--font-sniglet", display: "swap" });

const base = process.env.URL_BASE ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "Lunilla · Cuentos personalizados con nombre", template: "%s · Lunilla" },
  description: "Cuentos infantiles personalizados con el nombre, la ciudad y la mascota de tu peque. 12 páginas ilustradas, PDF en menos de 2 horas o libro de tapa dura. En castellano y catalán.",
  applicationName: "Lunilla",
  openGraph: { siteName: "Lunilla", type: "website", locale: "es_ES", images: ["/muestras/leo-y-la-luz-de-la-luna/00.webp"] },
};
export const viewport: Viewport = { themeColor: "#29395f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${andika.variable} ${sniglet.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
