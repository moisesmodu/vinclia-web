import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Centro de control · La cartera', robots: { index: false, follow: false } };

const secciones = [
  ['/control/', 'Resumen'],
  ['/control/usuarios/', 'Usuarios'],
  ['/control/pagos/', 'Pagos'],
  ['/control/suscripciones/', 'Suscripciones'],
  ['/control/visitas/', 'Visitas'],
] as const;

export default function LayoutControl({ children }: { children: React.ReactNode }) {
  return (
    <div className="ctl">
      <div className="ctl-cab">
        <div>
          <p className="volver"><Link href="/">Panel</Link></p>
          <h1>Centro de control</h1>
          <p className="nota">Datos en vivo de las bases de datos (solo lectura) y de Stripe. Hora de Madrid.</p>
        </div>
        <nav className="ctl-nav" aria-label="Secciones del centro de control">
          {secciones.map(([href, texto]) => <Link key={href} href={href}>{texto}</Link>)}
        </nav>
      </div>
      {children}
    </div>
  );
}
