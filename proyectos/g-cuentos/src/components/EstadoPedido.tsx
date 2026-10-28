import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais } from "@/lib/config";
import type { Cuento } from "@/lib/cuento";
import { db } from "@/lib/db";
import { t } from "@/i18n/textos";
import { Pagina } from "./Marco";

const FINALES = ["entregado", "enviado", "enviado_imprenta", "incidencia", "borrador"];

export async function EstadoPedido({ id, idioma, ok }: { id: string; idioma: Idioma; ok: boolean }) {
  const p = await db.pedido.findUnique({ where: { id } });
  if (!p) notFound();
  const x = t(idioma);
  const cuento = p.cuento as unknown as Cuento;
  const final = FINALES.includes(p.estado);
  const pasos = p.formato === "tapaDura" ? ["pagado", "ilustrando", "maquetando", "enviado_imprenta", "enviado"] : ["pagado", "ilustrando", "maquetando", "entregado"];
  const actual = pasos.indexOf(p.estado === "imprenta" ? "maquetando" : p.estado);
  return (
    <Pagina idioma={idioma}>
      {!final && <meta httpEquiv="refresh" content="30" />}
      <div className="mx-auto max-w-2xl px-4 py-10">
        {ok && <p className="tarjeta p-4 mb-6 font-bold text-noche">{x.pedido.gracias}</p>}
        <h1 className="text-3xl mb-1">{x.pedido.titulo}</h1>
        <p className="text-suave mb-6">«{cuento.titulo}»</p>
        <ol className="space-y-3 mb-8">
          {pasos.map((e, i) => (
            <li key={e} className={`tarjeta p-4 flex items-center gap-3 ${i <= actual ? "" : "opacity-50"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm ${i < actual || final ? "bg-salvia" : i === actual ? "bg-terracota" : "bg-[#d8cdb9]"}`}>{i + 1}</span>
              <span className="font-bold">{x.pedido.estados[e]}</span>
            </li>
          ))}
        </ol>
        {p.estado === "incidencia" && <p className="tarjeta p-4 mb-6">{x.pedido.estados.incidencia}</p>}
        {p.pdfUrl && <a href={p.pdfUrl} className="boton w-full text-lg">{x.pedido.descargar}</a>}
        {p.seguimientoUrl && <a href={p.seguimientoUrl} className="boton-sec w-full mt-3">📦</a>}
        <p className="text-sm text-suave mt-8">{x.pedido.soporte} <a className="underline" href={`mailto:${configPais().legal.email}`}>{configPais().legal.email}</a></p>
      </div>
    </Pagina>
  );
}
