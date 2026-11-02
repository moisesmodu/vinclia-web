import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import { BarraTabs, Lateral } from '@/components/mando/Navegacion';
import './mando.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--fuente-display', display: 'swap' });
const texto = Geist({ subsets: ['latin'], variable: '--fuente-texto', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--fuente-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Panel de mando', template: '%s · Panel de mando' },
  description: 'Centro de mando de la cartera: ingresos, usuarios, visitas, salud de las webs, tareas y marketing.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Mando', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = { themeColor: '#0b0c0f', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function LayoutMando({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${texto.variable} ${mono.variable}`}>
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
