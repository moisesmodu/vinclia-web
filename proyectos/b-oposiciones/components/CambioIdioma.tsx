'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';

export default function CambioIdioma({ idioma }: { idioma: Idioma }) {
  const ruta = usePathname() || `/${idioma}`;
  const otro: Idioma = idioma === 'ca' ? 'es' : 'ca';
  const destino = ruta.replace(/^\/(ca|es)(?=\/|$)/, `/${otro}`);
  return (
    <Link href={destino} hrefLang={otro} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold uppercase text-slate-700 no-underline hover:border-marca hover:text-marca" aria-label={otro === 'ca' ? 'Català' : 'Castellano'}>
      {otro}
    </Link>
  );
}
