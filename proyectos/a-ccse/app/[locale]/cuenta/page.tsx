import { Suspense } from 'react';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { Cuenta } from '@/components/Cuenta';
export const metadata = { robots: { index: false } };
export default async function Pagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = traductor((await params).locale);
  return (
    <div className="mx-auto grid max-w-md gap-4">
      <h1 className="text-2xl font-black">{t('cuenta.h1')}</h1>
      <Suspense><Cuenta /></Suspense>
    </div>
  );
}
