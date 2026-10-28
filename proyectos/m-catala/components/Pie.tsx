import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca, nivellsActius } from '@/lib/datos';
import Logo from './Logo';

export default function Pie({ idioma }: { idioma: Idioma }) {
  const d = t(idioma);
  const l = (s: string) => `/${idioma}${s}`;
  const slug = (n: string) => `/guia/examen-${n.toLowerCase()}-catala-2027${n === 'C1' ? '-model' : n === 'B2' ? '-prova' : ''}`;
  return (
    <footer className="linia mt-20 pb-20 sm:pb-0">
      <div className="contenedor grid gap-8 py-10 text-[15px] sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo alto={26} />
          <p className="mt-3 leading-relaxed text-secundari">{d.pie.ia}</p>
          <p className="mt-4 text-[13px] font-semibold text-ocre-fosc">{marca.sello[idioma]}</p>
        </div>
        <ul className="space-y-2">
          {nivellsActius().map((n) => <li key={n}><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l(slug(n))}>{idioma === 'ca' ? `Examen ${n} 2027` : `Examen ${n} 2027`}</Link></li>)}
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/convocatories')}>{d.nav.convocatories}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/guia')}>{d.pie.guies}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/preus')}>{d.nav.preus}</Link></li>
        </ul>
        <ul className="space-y-2">
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/legal/avis-legal')}>{d.pie.avis}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/legal/privadesa')}>{d.pie.privadesa}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/legal/galetes')}>{d.pie.galetes}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/legal/condicions')}>{d.pie.condicions}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/contacte')}>{d.pie.contacte}</Link></li>
          <li><Link className="text-secundari no-underline hover:text-nit hover:underline" href={l('/validesa')}>{d.pie.validesa}</Link></li>
          <li className="pt-2 text-[13px] text-terciari">© {new Date().getFullYear()} {marca.nombre} · {process.env.LEGAL_EMAIL || 'hola@numimates.com'}</li>
        </ul>
      </div>
    </footer>
  );
}
