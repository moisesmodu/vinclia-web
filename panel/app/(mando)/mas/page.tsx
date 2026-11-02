import Link from 'next/link';
import { ArrowsClockwise, BookOpen, CaretRight, Compass, CurrencyEur, GameController, Users } from '@phosphor-icons/react/dist/ssr';
import { Caja } from '@/components/mando/Piezas';

export const metadata = { title: 'Más' };

const ENLACES = [
  { href: '/ventas/', texto: 'Ventas', sub: 'Cobros, reembolsos y disputas con CSV', Icono: CurrencyEur },
  { href: '/usuarios/', texto: 'Usuarios', sub: 'Altas de los cinco proyectos, búsqueda y CSV', Icono: Users },
  { href: '/suscripciones/', texto: 'Suscripciones', sub: 'MRR, renovaciones, pruebas y cancelaciones', Icono: ArrowsClockwise },
  { href: '/juegos/', texto: 'Juegos y portales', sub: '18 juegos en itch.io, GameDistribution, GameMonetize, CrazyGames y Poki', Icono: GameController },
];

export default function Mas() {
  return (
    <>
      <header className="cab entra"><div><h1>Más</h1></div></header>
      <Caja className="entra entra-2">
        <nav className="menu-mas" aria-label="Más secciones">
          {ENLACES.map(({ href, texto, sub, Icono }) => (
            <Link key={href} href={href}><Icono aria-hidden="true" weight="light" /><span className="crece"><b>{texto}</b><small>{sub}</small></span><CaretRight aria-hidden="true" /></Link>
          ))}
          <a href="/cartera/"><Compass aria-hidden="true" weight="light" /><span className="crece"><b>La cartera</b><small>Plan, objetivos, juicio y fichas de estrategia</small></span><CaretRight aria-hidden="true" /></a>
          <a href="/docs/marketing-para-moises/"><BookOpen aria-hidden="true" weight="light" /><span className="crece"><b>Documentos</b><small>PARA-MOISES, calendario, plan y despliegues</small></span><CaretRight aria-hidden="true" /></a>
        </nav>
      </Caja>
    </>
  );
}
