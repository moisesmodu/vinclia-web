import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais, euros } from "@/lib/config";
import type { Cuento } from "@/lib/cuento";
import { db } from "@/lib/db";
import { aspectoDe, aspectoPropio } from "@/lib/ilustracion-prompts";
import { imagenVistaPrevia } from "@/lib/ilustraciones";
import { BANDAS, bandaDe } from "@/lib/plantillas";
import type { DatosNino } from "@/lib/rellenar";
import { Avatar } from "./Avatar";
import { EditorCuento } from "./EditorCuento";
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
  const datos = p.datos as unknown as DatosNino;
  const edad = datos.edad;
  const B = BANDAS[bandaDe(edad)];
  const portada = imagenVistaPrevia(col, edad, g, 0);
  const pagado = p.estado !== "borrador";
  const propio = aspectoPropio(datos) || !!datos.color;
  const ca = idioma === "ca";
  return (
    <Pagina idioma={idioma}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-primario font-bold">{x.vista.titulo}</p>
        <h1 className="text-3xl sm:text-4xl mt-1 mb-2">{cuento.titulo}</h1>
        <p className="text-suave mb-6">{ca ? `Aquestes són les primeres pàgines. El conte complet té ${B.paginas} pàgines il·lustrades, pensades per a ${B.etiqueta.ca}.` : `Estas son las primeras páginas. El cuento completo tiene ${B.paginas} páginas ilustradas, pensadas para ${B.etiqueta.es}.`}</p>
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
            {propio && (
              <div className="tarjeta p-5 flex items-center gap-5 cielo-suave text-crema">
                <div className="flex-none rounded-2xl bg-crema/10 p-2"><Avatar aspecto={aspectoDe(datos)} genero={g} color={datos.color} tam={96} /></div>
                <p className="text-sm sm:text-base">
                  <b className="titulo text-lg block">{ca ? `Així serà ${datos.nombre} al conte` : `Así será ${datos.nombre} en su cuento`}</b>
                  {ca ? "Les il·lustracions de mostra són d'un altre protagonista. En el teu llibre, el taller pinta un personatge nou amb la pell, els cabells, el pentinat i el color que has triat, igual a totes les pàgines." : "Las ilustraciones de muestra son de otro protagonista. En tu libro, el taller pinta un personaje nuevo con la piel, el pelo, el peinado y el color que has elegido, igual en todas las páginas."}
                </p>
              </div>
            )}
            <div className="tarjeta p-8 text-center italic whitespace-pre-line text-lg">{cuento.dedicatoria}</div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[0, 1, 2].map((i) => {
                const img = imagenVistaPrevia(col, edad, g, i + 1);
                return (
                  <article key={i} className={`pagina-libro ${i === 0 ? "sm:col-span-2" : ""}`}>
                    {img.deBiblioteca ? (
                      <div className="ilu marca-agua"><Image src={img.url} alt="" width={1200} height={800} /></div>
                    ) : (
                      <div className="ilu cielo-suave grid place-items-center text-crema text-center p-4">
                        <div>
                          <div className="inline-block rounded-full bg-crema/10 p-2"><Avatar aspecto={aspectoDe(datos)} genero={g} color={datos.color} tam={i === 0 ? 120 : 84} pijama={col === "dormir"} /></div>
                          <p className="text-xs sm:text-sm opacity-80 mt-2">{ca ? "Aquí anirà la il·lustració d'aquesta pàgina, pintada per al seu conte." : "Aquí irá la ilustración de esta página, pintada para su cuento."}</p>
                        </div>
                      </div>
                    )}
                    <p className={`px-6 pb-6 pt-3 leading-relaxed ${B.paginas === 18 ? "text-xl" : "text-lg"}`}>{cuento.paginas[i]}</p>
                    <p className="text-center text-xs text-suave pb-3">{i + 5}</p>
                  </article>
                );
              })}
            </div>
            <p className="text-center text-suave text-lg">{ca ? `…i ${B.paginas - 3} pàgines més, amb la fitxa de ${datos.nombre}${B.paginas === 18 ? ", un diploma i pàgines per dibuixar i enganxar una foto" : ""}.` : `…y ${B.paginas - 3} páginas más, con la ficha de ${datos.nombre}${B.paginas === 18 ? ", un diploma y páginas para dibujar y pegar una foto" : ""}.`}</p>
            {!pagado && <EditorCuento id={p.id} idioma={idioma} titulo={cuento.titulo} dedicatoria={cuento.dedicatoria} paginas={cuento.paginas} max={B.maxCaracteres} />}
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
