"use client";
import { useEffect, useState } from "react";
import type { Dicc } from "@/lib/i18n";
import { t } from "@/lib/texto";

// Lista de comprobación: se guarda solo en el navegador (localStorage), sin cuenta y sin enviar nada.
export default function Checklist({ slug, items, d, siguiente }: { slug: string; items: { id: string; texto: string }[]; d: Dicc; siguiente?: string }) {
  const clave = `nee-check-${slug}`;
  const [hechos, setHechos] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setHechos(JSON.parse(localStorage.getItem(clave) ?? "{}")); } catch { /* sin almacenamiento */ }
  }, [clave]);
  function cambiar(id: string) {
    const nuevo = { ...hechos, [id]: !hechos[id] };
    setHechos(nuevo);
    try { localStorage.setItem(clave, JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
  }
  const n = items.filter((i) => hechos[i.id]).length;
  return (
    <section className="tarjeta p-5" id="lista">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold text-xl">✅ {d.guia.checklist}</h2>
        <span className="text-sm font-semibold text-ok">{t(d.guia.hechos, { hechos: n, total: items.length })}</span>
      </div>
      <div className="h-2 bg-linea rounded-full mt-3 overflow-hidden" aria-hidden>
        <div className="h-full bg-ok transition-all" style={{ width: `${(n / Math.max(items.length, 1)) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <label className="flex gap-3 items-start p-2 rounded-lg hover:bg-fondo cursor-pointer min-h-[44px]">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[var(--color-ok)] shrink-0" checked={Boolean(hechos[i.id])} onChange={() => cambiar(i.id)} />
              <span className={hechos[i.id] ? "line-through text-suave" : ""}>{i.texto}</span>
            </label>
          </li>
        ))}
      </ul>
      {n === items.length && items.length > 0 ? (
        <p className="mt-3 rounded-xl p-3 bg-ok-claro text-ok font-semibold" role="status">🎉 {d.guia.celebracion}{" "}
          {siguiente ? <a href="#siguiente" className="enlace">{siguiente}</a> : null}</p>
      ) : null}
      <div className="flex justify-between items-center mt-3 text-sm text-suave">
        <span>{d.guia.checklistAyuda}</span>
        {n > 0 ? <button className="enlace" onClick={() => { setHechos({}); try { localStorage.removeItem(clave); } catch {} }}>{d.guia.reiniciar}</button> : null}
      </div>
    </section>
  );
}
