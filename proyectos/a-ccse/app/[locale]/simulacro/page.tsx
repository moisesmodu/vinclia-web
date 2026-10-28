import type { Metadata } from 'next';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { Simulacro } from '@/components/Simulacro';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = traductor((await params).locale);
  return { title: t('sim.h1'), description: t('sim.intro') };
}
export default async function Pagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = traductor((await params).locale);
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-black">{t('sim.h1')}</h1>
      <Simulacro />
    </div>
  );
}
