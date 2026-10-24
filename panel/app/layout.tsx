import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel de la cartera',
  description: 'Estado de los proyectos de ingresos recurrentes: rentabilidad, acciones, prompts y mejoras.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="cabecera">
          <Link href="/" className="marca">La cartera</Link>
          <nav className="nav">
            <Link href="/docs/cartera/">Plan</Link>
            <Link href="/docs/viabilidad/">Viabilidad</Link>
            <Link href="/docs/sesiones/">Reglas</Link>
            <Link href="/docs/prompts/">Prompts</Link>
            <Link href="/docs/juicio/">Juicio</Link>
          </nav>
        </header>
        <main className="contenido">{children}</main>
        <footer className="pie">Los datos salen del repositorio: cada sesión de proyecto los actualiza al terminar.</footer>
      </body>
    </html>
  );
}
