import Link from 'next/link';
import { precioTexto, type Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { FUENTE } from '@/lib/preguntas';
import { Logo } from './Logo';

export function Pie({ locale }: { locale: Locale }) {
  const t = traductor(locale);
  const producto: [string, string][] = [
    [`/${locale}/temas`, t('nav.temas')],
    [`/${locale}/simulacro`, t('nav.simulacro')],
    [`/${locale}/examen`, t('nav.examen')],
    [`/${locale}/guia`, t('pie.guias')],
    ['/es/preguntas', t('pie.preguntas')],
    [`/${locale}/precio`, `${t('nav.precioCorto')} · ${precioTexto(locale)}`],
  ];
  const legal: [string, string][] = [
    [`/${locale}/legal/aviso-legal`, t('pie.legal')],
    [`/${locale}/legal/privacidad`, t('pie.privacidad')],
    [`/${locale}/legal/cookies`, t('pie.cookies')],
    [`/${locale}/legal/condiciones`, t('pie.condiciones')],
  ];
  return (
    <footer className="mt-20 border-t border-[#EADFCD] bg-white pb-24 pt-10 text-sm text-suave sm:pb-10">
      <div className="contenedor grid grid-cols-2 gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="col-span-2 grid content-start gap-3 md:col-span-1">
          <Logo por={t('marcaPor')} />
          <p className="max-w-sm">{t('lema')}</p>
          <p className="titulos font-bold text-tinta">{t('sello')}</p>
        </div>
        <nav aria-label={t('pie.guias')} className="grid content-start gap-2">
          {producto.map(([h, l]) => <Link key={h} href={h} className="w-fit hover:text-tinta hover:underline">{l}</Link>)}
        </nav>
        <nav aria-label={t('pie.legal')} className="grid content-start gap-2">
          {legal.map(([h, l]) => <Link key={h} href={h} className="w-fit hover:text-tinta hover:underline">{l}</Link>)}
        </nav>
      </div>
      <div className="contenedor mt-8 grid gap-2 border-t border-[#F1E8DA] pt-6 text-xs leading-relaxed">
        <p>
          {t('inicio.fuente')}: <a className="underline" href={FUENTE.url} rel="noopener" target="_blank">{FUENTE.titulo}</a>, {FUENTE.autor}.
        </p>
        <p>{t('pie.noOficial')}</p>
        <p>© {new Date().getFullYear()} {t('marca')} · {t('marcaPor')}</p>
      </div>
    </footer>
  );
}
