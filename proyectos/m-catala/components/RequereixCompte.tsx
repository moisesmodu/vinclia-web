'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { pais } from '@/lib/datos';
import Volat from './Volat';

type Yo = { usuari: { acces?: { tipus: 'prova' | 'premium' | 'gratis'; diesProva: number } } | null; db?: boolean };

/** Porta d'entrada: el diagnòstic és obert; per guardar el pla i fer servir l'app cal un compte (7 dies de tot gratis, sense targeta).
 *  Sense base de dades (demo local) no hi ha porta. Mentre no se sap, mostra els fills perquè la pantalla no salti. */
export default function RequereixCompte({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  const [yo, setYo] = useState<Yo | null>(null);
  const ruta = usePathname() || `/${idioma}/avui`;
  useEffect(() => { fetch('/api/yo').then((r) => r.json()).then(setYo).catch(() => setYo({ usuari: null, db: false })); }, []);
  if (!yo || yo.usuari || !yo.db) return <>{children}</>;
  const n = t(idioma).nou; const dies = (pais as { provaDies?: number }).provaDies ?? 7;
  const seguent = encodeURIComponent(ruta);
  return (
    <div className="contenedor py-10">
      <div className="flex items-start gap-4">
        <Volat mida={56} postura="content" aterra className="shrink-0" />
        <div>
          <h1>{n.portaTitol}</h1>
          <p className="mt-3 max-w-[46ch] text-[17px] leading-relaxed text-secundari">{n.portaText(dies)}</p>
        </div>
      </div>
      <ul className="mt-6 max-w-[46ch] space-y-2 text-[16px]">
        {n.portaLlista.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true" className="text-boli">✓</span>{x}</li>)}
      </ul>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Link href={`/${idioma}/entrar?mode=crear&seguent=${seguent}`} className="boton-primari text-[18px]">{n.portaCrear}</Link>
        <Link href={`/${idioma}/entrar?seguent=${seguent}`} className="boton-sec">{n.portaEntrar}</Link>
      </div>
      <p className="mt-3 text-[13px] text-terciari">{n.portaNota}</p>
    </div>
  );
}
