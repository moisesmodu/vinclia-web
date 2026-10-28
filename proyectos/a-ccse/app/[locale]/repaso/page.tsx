import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { Repaso } from '@/components/Repaso';
export const metadata = { robots: { index: false } };
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
