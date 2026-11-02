import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { BarraTabs, Lateral } from '@/components/mando/Navegacion';
import './mando.css';

// Fuentes servidas desde el propio despliegue (sin pedirlas a Google en el build).
const display = localFont({
  src: '../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  weight: '200 800', variable: '--fuente-display', display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Panel de mando', template: '%s · Panel de mando' },
  description: 'Centro de mando de la cartera: ingresos, usuarios, visitas, salud de las webs, tareas y marketing.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Mando', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#0b0c0f', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function LayoutMando({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="armazon">
          <Lateral />
          <main className="principal">
            <header className="cabeza-movil">
              <Link href="/" className="marca-mando"><i aria-hidden="true">M</i>Panel de mando</Link>
            </header>
            {children}
          </main>
          <BarraTabs />
        </div>
      </body>
    </html>
  );
}
