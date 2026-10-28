"use client";
import type { Dicc } from "@/lib/i18n";
import type { Guia } from "@/lib/contenido";
import Checklist from "./Checklist";
import FormRecordatorio from "./FormRecordatorio";

export default function GuiaCompleta({ g, idioma, d }: { g: Guia; idioma: string; d: Dicc }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-xl mb-3">{d.guia.pasos}</h2>
        <ol className="space-y-3">
          {g.pasos.map((p, i) => (
            <li key={i} className="tarjeta p-4 flex gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-marca text-white grid place-items-center font-bold">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{p.titulo}</h3>
                <p className="mt-1 leading-relaxed whitespace-pre-line">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tarjeta p-5">
        <h2 className="font-bold text-xl mb-3">{d.guia.documentos}</h2>
        <ul className="space-y-2 list-disc ps-5">
          {g.documentos.map((x, i) => (
            <li key={i}><span className="font-medium">{x.nombre}</span>{x.nota ? <span className="text-suave"> — {x.nota}</span> : null}</li>
          ))}
        </ul>
      </section>

      <div className="grid sm:grid-cols-2 gap-3">
        <section className="tarjeta p-5">
          <h2 className="font-bold text-xl mb-3">{d.guia.plazos}</h2>
          <ul className="space-y-2 list-disc ps-5">{g.plazos.map((x, i) => <li key={i}>{x.texto}</li>)}</ul>
        </section>
        <section className="tarjeta p-5">
          <h2 className="font-bold text-xl mb-3">{d.guia.tasas}</h2>
          <ul className="space-y-3">
            {g.tasas.map((x, i) => (
              <li key={i}>
                <div className="flex justify-between gap-2"><span>{x.concepto}</span><strong className="whitespace-nowrap">{x.importe}</strong></div>
                {x.modelo ? <div className="text-sm text-suave">{d.guia.modelo}: {x.modelo}</div> : null}
                {x.nota ? <div className="text-sm text-suave">{x.nota}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl p-5 bg-aviso-claro">
        <h2 className="font-bold text-xl mb-3">⚠️ {d.guia.errores}</h2>
        <ul className="space-y-2 list-disc ps-5">{g.errores.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </section>

      {g.variantes?.length ? (
        <section className="tarjeta p-5">
          <h2 className="font-bold text-xl mb-3">{d.guia.variantes}</h2>
          {g.variantes.map((v, i) => (
            <details key={i} className="py-2 border-b border-linea last:border-0">
              <summary className="font-semibold cursor-pointer">{v.titulo}</summary>
              <p className="mt-2 leading-relaxed">{v.texto}</p>
            </details>
          ))}
        </section>
      ) : null}

      <Checklist slug={g.slug} items={g.checklist} d={d} />
      <FormRecordatorio slug={g.slug} idioma={idioma} r={g.recordatorio} d={d} />
    </div>
  );
}
