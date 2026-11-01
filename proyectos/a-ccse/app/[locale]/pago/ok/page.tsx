import { Suspense } from 'react';
import { PagoOk } from '@/components/PagoOk';
import type { Locale } from '@/lib/config';
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  return { robots: { index: false }, alternates: { canonical: `/${(await params).locale}/pago/ok` } };
}
export default function Pagina() {
  return <div className="mx-auto max-w-md"><Suspense><PagoOk /></Suspense></div>;
}
