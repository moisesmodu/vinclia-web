"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AFICIONES, COLECCIONES, COMPANEROS, type ColeccionId, type Idioma } from "@/lib/catalogo";
import { pref, t } from "@/i18n/textos";

export function Formulario({ idioma }: { idioma: Idioma }) {
  const x = t(idioma).form;
  const router = useRouter();
  const sp = useSearchParams();
  const colInicial = (COLECCIONES.find((c) => c.id === sp.get("coleccion"))?.id ?? "dormir") as ColeccionId;
  const [coleccion, setColeccion] = useState<ColeccionId>(colInicial);
  const temas = useMemo(() => COLECCIONES.find((c) => c.id === coleccion)!.temas, [coleccion]);
  const [tema, setTema] = useState(temas[0].id);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const datos = Object.fromEntries(f.entries());
    try {
      const r = await fetch("/api/cuentos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...datos, coleccion, tema }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "error");
      router.push(`${pref(j.idiomaWeb ?? idioma)}/cuento/${j.id}`);
    } catch (err) {
      setError(`${x.error} (${(err as Error).message})`);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="tarjeta p-5 sm:p-8 space-y-5">
      <input type="hidden" name="idiomaWeb" value={idioma} />
      <fieldset>
        <legend className="etiqueta">{x.coleccion}</legend>
        <div className="grid grid-cols-2 gap-2">
          {COLECCIONES.map((c) => (
            <button type="button" key={c.id} onClick={() => { setColeccion(c.id); setTema(c.temas[0].id); }}
              className={`rounded-xl border-2 p-3 text-left min-h-[48px] ${coleccion === c.id ? "border-terracota bg-[#fdf0e6]" : "border-[#e2d6c1] bg-white"}`}>
              <span className="font-bold text-noche">{c.nombre[idioma]}</span>
              <span className="block text-xs text-suave">{c.descripcion[idioma]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="etiqueta">{x.nombre}</span><input name="nombre" required maxLength={24} className="campo" autoComplete="off" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="etiqueta">{x.edad}</span>
            <select name="edad" className="campo" defaultValue="4">{[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select>
          </label>
          <fieldset><legend className="etiqueta">{x.protagonista}</legend>
            <div className="flex gap-2">
              <label className="flex-1"><input type="radio" name="genero" value="m" defaultChecked className="peer sr-only" /><span className="campo flex items-center justify-center peer-checked:border-terracota peer-checked:bg-[#fdf0e6] cursor-pointer">{x.nino}</span></label>
              <label className="flex-1"><input type="radio" name="genero" value="f" className="peer sr-only" /><span className="campo flex items-center justify-center peer-checked:border-terracota peer-checked:bg-[#fdf0e6] cursor-pointer">{x.nina}</span></label>
            </div>
          </fieldset>
        </div>
        <label><span className="etiqueta">{x.ciudad}</span><input name="ciudad" required maxLength={40} className="campo" placeholder="Lleida" /></label>
        <label><span className="etiqueta">{x.aficion}</span>
          <select name="aficion" className="campo">{AFICIONES.map((a) => <option key={a.id} value={a.id}>{a.etiqueta[idioma]}</option>)}</select>
        </label>
        <label><span className="etiqueta">{x.companero}</span>
          <select name="companero" className="campo">{COMPANEROS.map((c) => <option key={c.id} value={c.id}>{c.etiqueta[idioma]}</option>)}</select>
        </label>
        <label><span className="etiqueta">{x.mascota}</span><input name="mascota" required maxLength={20} className="campo" /></label>
        <label className="sm:col-span-2"><span className="etiqueta">{x.mascotaDesc}</span><input name="mascotaDescripcion" maxLength={80} className="campo" /></label>
        <label><span className="etiqueta">{x.tema}</span>
          <select className="campo" value={tema} onChange={(e) => setTema(e.target.value)}>{temas.map((tm) => <option key={tm.id} value={tm.id}>{tm.etiqueta[idioma]}</option>)}</select>
        </label>
        <label><span className="etiqueta">{x.idioma}</span>
          <select name="idioma" className="campo" defaultValue={idioma}><option value="es">Castellano</option><option value="ca">Català</option></select>
        </label>
        {coleccion === "hermanito" && (
          <>
            <label><span className="etiqueta">{x.bebe}</span><input name="bebe" maxLength={20} className="campo" /></label>
            <label><span className="etiqueta">{x.bebeGenero}</span>
              <select name="bebeGenero" className="campo"><option value="m">{x.hermanito}</option><option value="f">{x.hermanita}</option></select>
            </label>
          </>
        )}
        <label><span className="etiqueta">{x.dePartede}</span><input name="deParteDe" maxLength={60} className="campo" placeholder={x.dePartedeEj} /></label>
        <label className="sm:col-span-2"><span className="etiqueta">{x.dedicatoria}</span><textarea name="dedicatoria" maxLength={240} rows={2} className="campo" /></label>
      </div>
      {/* Campo trampa contra bots */}
      <input name="web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <p className="text-sm text-suave">{x.privacidad}</p>
      {error && <p className="text-terracota-osc font-bold" role="alert">{error}</p>}
      <button className="boton w-full text-lg" disabled={enviando}>{enviando ? x.creando : x.enviar}</button>
    </form>
  );
}
