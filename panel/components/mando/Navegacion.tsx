'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowsClockwise, CheckCircle, Compass, CurrencyEur, DotsThreeCircle, GameController, Megaphone, SquaresFour, SunHorizon, Users,
} from '@phosphor-icons/react';

const PRINCIPALES = [
  { href: '/', texto: 'Hoy', Icono: SunHorizon },
  { href: '/proyectos/', texto: 'Proyectos', Icono: SquaresFour },
  { href: '/tareas/', texto: 'Tareas', Icono: CheckCircle },
  { href: '/marketing/', texto: 'Marketing', Icono: Megaphone },
];
const SECUNDARIAS = [
  { href: '/ventas/', texto: 'Ventas', Icono: CurrencyEur },
  { href: '/usuarios/', texto: 'Usuarios', Icono: Users },
  { href: '/suscripciones/', texto: 'Suscripciones', Icono: ArrowsClockwise },
  { href: '/juegos/', texto: 'Juegos y portales', Icono: GameController },
];

const activo = (ruta: string, href: string) => (href === '/' ? ruta === '/' : ruta.startsWith(href.replace(/\/$/, '')));

export function Lateral() {
  const ruta = usePathname();
  return (
    <aside className="lateral" aria-label="Navegación">
      <Link href="/" className="marca-mando"><i aria-hidden="true">M</i>Panel de mando</Link>
      <nav>
        {PRINCIPALES.map(({ href, texto, Icono }) => (
          <Link key={href} href={href} aria-current={activo(ruta, href) ? 'page' : undefined}><Icono weight={activo(ruta, href) ? 'fill' : 'light'} aria-hidden="true" />{texto}</Link>
        ))}
        <div className="separa" />
        {SECUNDARIAS.map(({ href, texto, Icono }) => (
          <Link key={href} href={href} aria-current={activo(ruta, href) ? 'page' : undefined}><Icono weight={activo(ruta, href) ? 'fill' : 'light'} aria-hidden="true" />{texto}</Link>
        ))}
        <div className="separa" />
        <a href="/cartera/"><Compass weight="light" aria-hidden="true" />La cartera (plan)</a>
      </nav>
      <p className="pie-lateral">Datos en vivo. Hora de Madrid.</p>
    </aside>
  );
}

export function BarraTabs() {
  const ruta = usePathname();
  const enMas = SECUNDARIAS.some((s) => activo(ruta, s.href)) || ruta.startsWith('/mas');
  return (
    <nav className="barra-tabs" aria-label="Secciones">
      {PRINCIPALES.map(({ href, texto, Icono }) => (
        <Link key={href} href={href} aria-current={activo(ruta, href) ? 'page' : undefined}><Icono weight={activo(ruta, href) ? 'fill' : 'regular'} aria-hidden="true" />{texto}</Link>
      ))}
      <Link href="/mas/" aria-current={enMas ? 'page' : undefined}><DotsThreeCircle weight={enMas ? 'fill' : 'regular'} aria-hidden="true" />Más</Link>
    </nav>
  );
}
