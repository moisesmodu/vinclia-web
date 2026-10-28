import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import FormularioRecuperar from '@/components/FormularioRecuperar';

export const metadata: Metadata = { robots: { index: false } };

export default async function Recuperar({ params, searchParams }: { params: Promise<{ lang: Idioma }>; searchParams: Promise<{ t?: string }> }) {
  const { lang } = await params;
  const { t } = await searchParams;
  return (
    <div className="contenedor py-10">
      <h1 className="text-2xl font-extrabold">{lang === 'ca' ? 'Recuperar la contrasenya' : 'Recuperar la contraseña'}</h1>
      <FormularioRecuperar idioma={lang} token={t} />
    </div>
  );
}
