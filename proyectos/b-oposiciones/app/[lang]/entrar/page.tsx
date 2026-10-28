import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import FormularioEntrar from '@/components/FormularioEntrar';

export const metadata: Metadata = { robots: { index: false } };

export default async function Entrar({ params, searchParams }: { params: Promise<{ lang: Idioma }>; searchParams: Promise<{ siguiente?: string }> }) {
  const { lang } = await params;
  const { siguiente } = await searchParams;
  const destino = siguiente && siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : `/${lang}/cuenta`;
  return (
    <div className="contenedor py-10">
      <h1 className="text-2xl font-bold">{t(lang).login.titulo}</h1>
      <FormularioEntrar idioma={lang} siguiente={destino} />
    </div>
  );
}
