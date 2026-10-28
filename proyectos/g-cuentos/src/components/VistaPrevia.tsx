import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais, euros } from "@/lib/config";
import type { Cuento } from "@/lib/cuento";
import { db } from "@/lib/db";
import { imagenVistaPrevia } from "@/lib/ilustraciones";
import { pref, t } from "@/i18n/textos";
import { Comprar } from "./Comprar";
import { Pagina } from "./Marco";

export async function VistaPrevia({ id, idioma }: { id: string; idioma: Idioma }) {
  const p = await db.pedido.findUnique({ where: { id } });
  if (!p) notFound();
  const x = t(idioma);
  const c = configPais();
  const cuento = p.cuento as unknown as Cuento;
  const col = p.coleccion as "dormir";
  const g = p.genero as "m" | "f";
  const portada = imagenVistaPrevia(col, g, 0);
  const pagado = p.estado !== "borrador";
  return (
    <Pagina idioma={idioma}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-primario font-bold">{x.vista.titulo}</p>
        <h1 className="text-3xl sm:text-4xl mt-1 mb-2">{cuento.titulo}</h1>
        <p className="text-suave mb-6">{x.vista.aviso}</p>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
          <div className="space-y-6">
            <figure className="tarjeta p-3">
              <div className="relative marca-agua rounded-xl overflow-hidden">
                <Image src={portada.url} alt="" width={1200} height={1200} className="w-full" priority />
                <div className="absolute top-[6%] inset-x-[8%] bg-crema/90 rounded-xl p-3 text-center">
                  <p className="titulo text-xl sm:text-3xl">{cuento.titulo}</p>
                </div>
              </div>
              <figcaption className="text-xs text-suave mt-2">{x.vista.ilustracionMuestra}</figcaption>
            </figure>
            <div className="tarjeta p-8 text-center italic whitespace-pre-line text-lg">{cuento.dedicatoria}</div>
            {[0, 1, 2].map((i) => {
              const img = imagenVistaPrevia(col, g, i + 1);
              return (
                <div key={i} className="tarjeta grid sm:grid-cols-2 overflow-hidden">
                  <p className="p-6 sm:p-8 text-lg leading-relaxed self-center">{cuento.paginas[i]}</p>
                  <div className="relative marca-agua"><Image src={img.url} alt="" width={1200} height={1200} className="w-full h-full object-cover" /></div>
                </div>
              );
            })}
            <p className="text-center text-suave text-lg">{x.vista.restantes}</p>
          </div>
          <div className="lg:sticky lg:top-24 space-y-3">
            {pagado ? (
              <Link href={`${pref(idioma)}/pedido/${p.id}`} className="boton w-full">{x.pedido.titulo}</Link>
            ) : (
              <Comprar idioma={idioma} pedidoId={p.id} precios={{ pdf: euros(c.precios.pdf, idioma), tapaDura: euros(c.precios.tapaDura, idioma) }} textos={{ envio: x.precios.envio }} />
            )}
            <Link href={`${pref(idioma)}/crear?coleccion=${p.coleccion}`} className="block text-center text-sm text-suave underline">{x.vista.cambiar}</Link>
          </div>
        </div>
      </div>
    </Pagina>
  );
}
