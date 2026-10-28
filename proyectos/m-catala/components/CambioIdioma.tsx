'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Idioma } from '@/lib/tipos';
import { otro, t } from '@/lib/i18n';

export default function CambioIdioma({ idioma }: { idioma: Idioma }) {
  const ruta = usePathname() || `/${idioma}`;
  const o = otro(idioma);
  const destino = ruta.replace(new RegExp(`^/${idioma}(?=/|$)`), `/${o}`);
  return <Link href={destino} className="rounded-lg px-2 py-2 text-sm text-secundari no-underline hover:text-nit" hrefLang={o} lang={o}>{t(idioma).comu.idioma}</Link>;
}
