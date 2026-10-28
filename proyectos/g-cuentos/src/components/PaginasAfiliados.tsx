import { notFound } from "next/navigation";
import type { Idioma } from "@/lib/catalogo";
import { configPais, euros, URL_BASE } from "@/lib/config";
import { panelAfiliado } from "@/lib/afiliados";
import { FormAfiliada } from "./Afiliados";
import { Pagina } from "./Marco";

export function InfoAfiliados({ idioma }: { idioma: Idioma }) {
  const ca = idioma === "ca";
  const c = configPais();
  const pdf = (c.precios.pdf * c.afiliados.comisionPorcentaje) / 100;
  const libro = (c.precios.tapaDura * c.afiliados.comisionPorcentaje) / 100;
  return (
    <Pagina idioma={idioma} alternativa={ca ? "/afiliados" : "/ca/afiliades"}>
      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-8 md:grid-cols-2 items-start">
        <div className="prosa">
          <h1 className="text-3xl sm:text-4xl mb-4">{ca ? "Programa d'afiliades de Lunilla" : "Programa de afiliadas de Lunilla"}</h1>
          <p className="text-lg">{ca ? `Si tens un compte de maternitat, criança o llibres infantils, recomana Lunilla i guanya el ${c.afiliados.comisionPorcentaje} % de cada venda.` : `Si tienes una cuenta de maternidad, crianza o libros infantiles, recomienda Lunilla y gana el ${c.afiliados.comisionPorcentaje} % de cada venta.`}</p>
          <ul>
            <li>{ca ? `${euros(pdf, idioma)} per cada conte en PDF i ${euros(libro, idioma)} per cada llibre de tapa dura.` : `${euros(pdf, idioma)} por cada cuento en PDF y ${euros(libro, idioma)} por cada libro de tapa dura.`}</li>
            <li>{ca ? `L'enllaç dura ${c.afiliados.cookieDias} dies des del clic (si la visitant accepta la galeta).` : `El enlace dura ${c.afiliados.cookieDias} días desde el clic (si la visitante acepta la cookie).`}</li>
            <li>{ca ? `Panell amb clics, vendes i comissió. Pagament per transferència a partir de ${euros(c.afiliados.pagoMinimoCents, idioma)}, el dia 5 de cada mes.` : `Panel con clics, ventas y comisión. Pago por transferencia a partir de ${euros(c.afiliados.pagoMinimoCents, idioma)}, el día 5 de cada mes.`}</li>
            <li>{ca ? "Et regalem un conte personalitzat per al teu fill perquè el puguis ensenyar." : "Te regalamos un cuento personalizado para tu peque para que puedas enseñarlo."}</li>
            <li>{ca ? "Prohibit fer anuncis de pagament amb la marca Lunilla i el correu brossa." : "Prohibido hacer anuncios de pago con la marca Lunilla y el spam."}</li>
          </ul>
          <p className="text-sm text-suave">{ca ? "Les comissions es paguen sobre vendes no reemborsades. Has de poder emetre factura o rebut segons la teva situació fiscal." : "Las comisiones se pagan sobre ventas no reembolsadas. Debes poder emitir factura o recibo según tu situación fiscal."}</p>
        </div>
        <FormAfiliada idioma={idioma} />
      </div>
    </Pagina>
  );
}

export async function PanelAfiliado({ token, idioma }: { token?: string; idioma: Idioma }) {
  if (!token) notFound();
  const d = await panelAfiliado(token);
  if (!d) notFound();
  const ca = idioma === "ca";
  const enlace = `${URL_BASE()}/r/${d.afiliado.codigo}`;
  return (
    <Pagina idioma={idioma}>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <h1 className="text-3xl">{ca ? "El meu panell" : "Mi panel"} · {d.afiliado.nombre}</h1>
        <div className="tarjeta p-5"><p className="etiqueta">{ca ? "El teu enllaç" : "Tu enlace"}</p><p className="font-mono break-all">{enlace}</p><p className="text-sm text-suave mt-2">{ca ? "Per a la web en català, afegeix" : "Para la web en catalán, añade"} <code>?a=ca</code></p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[[ca ? "Clics" : "Clics", String(d.afiliado.clics)], [ca ? "Vendes" : "Ventas", String(d.ventas.length)], [ca ? "Generat" : "Generado", euros(d.generadoCents, idioma)], [ca ? "Pendent" : "Pendiente", euros(d.pendienteCents, idioma)]].map(([k, v]) => (
            <div key={k} className="tarjeta p-4"><p className="text-sm text-suave">{k}</p><p className="titulo text-2xl">{v}</p></div>
          ))}
        </div>
        <div className="tarjeta p-5">
          <p className="etiqueta">{ca ? "Últimes vendes" : "Últimas ventas"}</p>
          {d.ventas.length === 0 ? <p className="text-suave">{ca ? "Encara cap." : "Todavía ninguna."}</p> : (
            <ul className="divide-y divide-[#eadfcb]">{d.ventas.slice(0, 50).map((v) => (
              <li key={v.id} className="py-2 flex justify-between text-sm"><span>{v.pagadoEn?.toLocaleDateString("es-ES")} · {v.formato === "pdf" ? "PDF" : ca ? "Tapa dura" : "Tapa dura"}</span><span className="font-bold">{euros(v.comisionCents ?? 0, idioma)}</span></li>
            ))}</ul>
          )}
        </div>
      </div>
    </Pagina>
  );
}
