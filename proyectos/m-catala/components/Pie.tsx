import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca, nivellsActius } from '@/lib/datos';
import Logo from './Logo';

export default function Pie({ idioma }: { idioma: Idioma }) {
  const d = t(idioma);
  const l = (s: string) => `/${idioma}${s}`;
  return (
    <footer className="mt-16 border-t border-[#EADFCF] bg-white">
      <div className="contenedor grid gap-8 py-10 text-sm sm:grid-cols-3">
        <div>
          <Logo alto={28} />
          <p className="mt-2 text-suave">{d.pie.ia}</p>
          <p className="mt-3 inline-block rounded-lg bg-ocre-claro px-2.5 py-1 text-xs font-semibold text-ocre-oscuro">{marca.sello[idioma]}</p>
        </div>
        <div>
          <ul className="space-y-1">
            {nivellsActius().map((n) => <li key={n}><Link className="text-suave hover:text-marca" href={l(`/guia/examen-${n.toLowerCase()}-catala-2027${n === 'C1' ? '-model' : n === 'B2' ? '-prova' : ''}`)}>{idioma === 'ca' ? `Examen ${n} de català 2027` : `Examen ${n} de catalán 2027`}</Link></li>)}
            <li><Link className="text-suave hover:text-marca" href={l('/convocatories')}>{d.nav.convocatories}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/guia')}>{d.pie.guies}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/preus')}>{d.nav.preus}</Link></li>
          </ul>
        </div>
        <div>
          <ul className="space-y-1">
            <li><Link className="text-suave hover:text-marca" href={l('/legal/avis-legal')}>{d.pie.avis}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/legal/privadesa')}>{d.pie.privadesa}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/legal/galetes')}>{d.pie.galetes}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/legal/condicions')}>{d.pie.condicions}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/contacte')}>{d.pie.contacte}</Link></li>
            <li><Link className="text-suave hover:text-marca" href={l('/validesa')}>{d.pie.validesa}</Link></li>
          </ul>
          <p className="mt-4 text-xs text-suave">© {new Date().getFullYear()} {marca.nombre} · {process.env.LEGAL_EMAIL || 'hola@numimates.com'}</p>
        </div>
      </div>
    </footer>
  );
}
