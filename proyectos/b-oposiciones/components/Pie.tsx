import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { marca, oposiciones } from '@/lib/datos';
import Logo from './Logo';

export default function Pie({ idioma }: { idioma: Idioma }) {
  const d = t(idioma);
  const l = (s: string) => `/${idioma}${s}`;
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="contenedor grid gap-8 py-10 text-sm sm:grid-cols-3">
        <div>
          <Logo alto={28} />
          <p className="mt-2 text-slate-600">{d.pie.ia}</p>
          <p className="mt-3 inline-block rounded-lg bg-marca-claro px-2.5 py-1 text-xs font-semibold text-marca-oscuro">{marca.sello[idioma]}</p>
        </div>
        <div>
          <p className="font-semibold">{d.oposiciones}</p>
          <ul className="mt-2 space-y-1">
            {oposiciones().map((o) => (
              <li key={o.slug}><Link className="text-slate-600 hover:text-marca" href={l(`/${o.slug}`)}>{o.nombreCorto[idioma]}</Link></li>
            ))}
            <li><Link className="text-slate-600 hover:text-marca" href={l('/convocatorias')}>{d.convocatoriasTitulo}</Link></li>
          </ul>
        </div>
        <div>
          <ul className="space-y-1">
            <li><Link className="text-slate-600 hover:text-marca" href={l('/legal/aviso-legal')}>{d.pie.aviso}</Link></li>
            <li><Link className="text-slate-600 hover:text-marca" href={l('/legal/privacidad')}>{d.pie.privacidad}</Link></li>
            <li><Link className="text-slate-600 hover:text-marca" href={l('/legal/cookies')}>{d.pie.cookies}</Link></li>
            <li><Link className="text-slate-600 hover:text-marca" href={l('/legal/condiciones')}>{d.pie.condiciones}</Link></li>
            <li><Link className="text-slate-600 hover:text-marca" href={l('/contacto')}>{d.pie.contacto}</Link></li>
            <li><Link className="text-slate-600 hover:text-marca" href={l('/erratas')}>{d.pie.erratas}</Link></li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} {marca.nombre}</p>
        </div>
      </div>
    </footer>
  );
}
