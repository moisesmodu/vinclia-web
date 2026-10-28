import { Suspense } from 'react';
import { PagoOk } from '@/components/PagoOk';
export const metadata = { robots: { index: false } };
export default function Pagina() {
  return <div className="mx-auto max-w-md"><Suspense><PagoOk /></Suspense></div>;
}
