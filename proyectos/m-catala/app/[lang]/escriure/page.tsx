import Link from 'next/link';
import { esIdioma, t } from '@/lib/i18n';
import { BANC, nivellsActius } from '@/lib/datos';
import type { Idioma } from '@/lib/tipos';
export default async function Pagina({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const idioma = (esIdioma(lang) ? lang : 'ca') as Idioma; const d = t(idioma).escriure;
  const tasques = Object.values(BANC.tasques);
  return <div className="contenedor py-6"><h1 className="text-2xl font-bold">{d.titol}</h1><p className="mt-1 text-sm text-suave">{d.text}</p>{nivellsActius().map((n) => <section key={n} className="mt-6"><h2 className="text-lg font-bold">{n}</h2><div className="mt-2 grid gap-2">{tasques.filter((x) => x.nivell === n).map((x) => <Link key={x.id} href={`/${idioma}/escriure/${x.id}`} className="tarjeta no-underline hover:border-nit"><p className="font-semibold">{x.titol}</p><p className="mt-1 text-xs text-suave">{x.tipus} · {x.paraulesMin}–{x.paraulesMax} {d.paraules} · {x.minuts} min</p></Link>)}</div></section>)}</div>;
}
