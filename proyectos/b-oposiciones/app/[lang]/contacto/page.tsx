import type { Metadata } from 'next';
import type { Idioma } from '@/lib/tipos';
import { t } from '@/lib/i18n';
import { alternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: Idioma }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).pie.contacto, alternates: alternates(lang, '/contacto') };
}

export default async function Contacto({ params, searchParams }: { params: Promise<{ lang: Idioma }>; searchParams: Promise<{ enviado?: string }> }) {
  const { lang } = await params;
  const { enviado } = await searchParams;
  const ca = lang === 'ca';
  return (
    <div className="contenedor max-w-xl py-10">
      <h1 className="text-2xl font-bold">{t(lang).pie.contacto}</h1>
      <p className="mt-2 text-slate-700">{ca ? 'Responem en català o castellà en menys de 24 hores laborables.' : 'Respondemos en catalán o castellano en menos de 24 horas laborables.'}</p>
      {enviado ? <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-ok">✓ {ca ? 'Missatge rebut.' : 'Mensaje recibido.'}</p> : null}
      <form action="/api/contacto" method="post" className="tarjeta mt-6 space-y-3">
        <input type="hidden" name="idioma" value={lang} />
        <label className="block text-sm">{t(lang).login.email}<input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <label className="block text-sm">{ca ? 'Missatge' : 'Mensaje'}<textarea name="texto" required minLength={5} rows={5} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5" /></label>
        <button className="boton">{t(lang).app.enviar}</button>
      </form>
    </div>
  );
}
