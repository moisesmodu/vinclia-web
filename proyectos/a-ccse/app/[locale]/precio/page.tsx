import { Suspense } from 'react';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/config';
import { traductor } from '@/lib/i18n';
import { Precio } from '@/components/Precio';
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = traductor((await params).locale);
  return { title: t('precio.h1') };
}
export default async function Pagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = traductor((await params).locale);
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <h1 className="text-2xl font-black">{t('precio.h1')}</h1>
      <Suspense><Precio /></Suspense>
    </div>
  );
}
