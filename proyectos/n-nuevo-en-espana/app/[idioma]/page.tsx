import Link from "next/link";
import { dicc } from "@/lib/i18n";
import { resumen, slugsGuias } from "@/lib/contenido";
import { config, SITUACIONES } from "@/lib/config";
import PorDondeEmpiezo from "@/components/PorDondeEmpiezo";
import TarjetaGuia from "@/components/TarjetaGuia";

export default async function Inicio({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const guias = slugsGuias().map((s) => resumen(s, idioma)!).filter(Boolean);
  const titulos = Object.fromEntries(guias.map((g) => [g.slug, g.titulo]));
  return (
    <div className="space-y-10">
      <section className="pt-2">
        <Link href={`/${idioma}/guias/renovacion-residencia`} className="inline-block text-sm font-semibold bg-marca-claro text-marca-oscuro rounded-full px-3 py-1 mb-4">
          {d.inicio.novedad} →
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{d.inicio.titulo}</h1>
        <p className="mt-3 text-lg text-suave">{d.inicio.subtitulo}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/${idioma}/guias/${config.guiaGratis}`} className="boton boton-marca">{d.inicio.ctaGratis}</Link>
          <Link href={`/${idioma}#guias`} className="boton boton-borde">{d.inicio.ctaGuias}</Link>
        </div>
        <p className="mt-3 text-sm text-suave">{d.aviso.corto}</p>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        {d.inicio.puntos.map((p) => (
          <div key={p.titulo} className="tarjeta p-4">
            <h2 className="font-semibold">{p.titulo}</h2>
            <p className="text-sm text-suave mt-1">{p.texto}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">{d.inicio.empiezaTitulo}</h2>
        <p className="text-suave mb-3">{d.inicio.empiezaTexto}</p>
        <PorDondeEmpiezo idioma={idioma} situaciones={d.inicio.situaciones} orden={SITUACIONES} titulos={titulos} etiquetaOrden={d.inicio.ordenRecomendado} />
      </section>

      <section id="guias" className="scroll-mt-20">
        <h2 className="text-xl font-bold mb-3">{d.inicio.guiasTitulo}</h2>
        <div className="grid gap-3">
          {guias.map((g) => <TarjetaGuia key={g.slug} g={g} idioma={idioma} d={d} />)}
        </div>
      </section>

      <section className="tarjeta p-5 text-center">
        <h2 className="text-xl font-bold">{d.precios.titulo}</h2>
        <p className="text-suave mt-1">{d.precios.subtitulo}</p>
        <p className="mt-2 font-semibold">{config.precios.suscripcion.texto} · {config.precios.pack.texto}</p>
        <Link href={`/${idioma}/precios`} className="boton boton-marca mt-4">{d.guia.verPrecios}</Link>
      </section>
    </div>
  );
}
