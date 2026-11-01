import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import FormularioEntrar from '@/components/FormularioEntrar';
import { pais, precioTexto } from '@/lib/datos';

export const metadata: Metadata = { robots: { index: false } };

export default async function Entrar({ params, searchParams }: { params: Promise<{ lang: Idioma }>; searchParams: Promise<{ siguiente?: string; plan?: string }> }) {
  const { lang } = await params;
  const { siguiente, plan } = await searchParams;
  const p = plan ? pais.planes.find((x) => x.id === plan && x.activo) : undefined;
  const d = t(lang);
  const planTexto = p ? `${d.planes[p.id]}: ${p.id === 'mensual' ? `${precioTexto(p.importe, lang)}${d.porMes}` : `${d.pagoUnico(precioTexto(p.importe, lang), d.cada[p.id])} (${precioTexto(p.porMes, lang)}${d.porMes})`}, ${d.ivaIncluido}.` : undefined;
  const destino = siguiente && siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : `/${lang}/cuenta`;
  return (
    <div className="contenedor py-10">
      <h1 className="text-2xl font-bold">{t(lang).login.titulo}</h1>
      <FormularioEntrar idioma={lang} siguiente={destino} plan={p?.id} planTexto={planTexto} />
    </div>
  );
}
