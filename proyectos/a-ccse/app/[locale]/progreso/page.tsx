import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { PanelProgreso } from '@/components/Progreso';
export const metadata = { robots: { index: false } };
export default async function Pagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = traductor((await params).locale);
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <h1 className="text-2xl font-black">{t('prog.h1')}</h1>
      <PanelProgreso />
    </div>
  );
}
