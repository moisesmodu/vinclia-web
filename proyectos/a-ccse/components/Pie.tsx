import Link from 'next/link';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { FUENTE } from '@/lib/preguntas';

export function Pie({ locale }: { locale: Locale }) {
  const t = traductor(locale);
  return (
    <footer className="mt-16 border-t border-[#EADFCD] bg-white py-8 text-sm text-suave">
      <div className="contenedor grid gap-4">
        <p className="titulos text-base font-bold text-tinta">{t('sello')}</p>
        <p>
          {t('inicio.fuente')}: <a className="underline" href={FUENTE.url} rel="noopener" target="_blank">{FUENTE.titulo}</a>, {FUENTE.autor}.
        </p>
        <p>{t('pie.noOficial')}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href={`/${locale}/legal/aviso-legal`}>{t('pie.legal')}</Link>
          <Link href={`/${locale}/legal/privacidad`}>{t('pie.privacidad')}</Link>
          <Link href={`/${locale}/legal/cookies`}>{t('pie.cookies')}</Link>
          <Link href={`/${locale}/legal/condiciones`}>{t('pie.condiciones')}</Link>
          <Link href="/es/preguntas">{t('pie.preguntas')}</Link>
          <Link href={`/${locale}/guia`}>{t('pie.guias')}</Link>
        </nav>
        <p>© {new Date().getFullYear()} {t('marca')} · {t('marcaPor')}</p>
      </div>
    </footer>
  );
}
