import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { Repaso } from '@/components/Repaso';
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  return { robots: { index: false }, alternates: { canonical: `/${(await params).locale}/repaso` } };
}
export default async function Pagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = traductor((await params).locale);
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-black">{t('rep.h1')}</h1>
      <p className="text-suave">{t('rep.intro')}</p>
      <Repaso />
    </div>
  );
}
