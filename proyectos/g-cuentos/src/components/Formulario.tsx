"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AFICIONES, ARROPA, COLECCIONES, COLORES, COMPANEROS, type Bi, type ColeccionId, type Genero, type Idioma } from "@/lib/catalogo";
import { BANDAS, bandaDe, type PlantillaId } from "@/lib/plantillas/tipos";
import { rellenar, type Aspecto, type DatosNino } from "@/lib/rellenar";
import { pref, t } from "@/i18n/textos";
import { Avatar, COLOR_HEX, PELO_HEX, PIEL_HEX } from "./Avatar";

// Creador en 4 pasos con el protagonista en vivo: quien regala decide cómo es, su mundo,
// el cuento y la dedicatoria. Los títulos llegan del servidor para no cargar las plantillas aquí.
const C = {
  es: {
    pasos: ["Protagonista", "Su mundo", "El cuento", "Dedicatoria"],
    siguiente: "Siguiente", atras: "Atrás",
    piel: "Tono de piel", pelo: "Color de pelo", peinado: "Peinado", gafas: "Gafas", pecas: "Pecas",
    peinados: { corto: "Corto", rizado: "Rizado", largo: "Largo", coletas: "Coletas o moño" },
    pelos: { rubio: "Rubio", castano: "Castaño", pelirrojo: "Pelirrojo", negro: "Negro" },
    pieles: { clara: "Clara", media: "Media", morena: "Morena", oscura: "Oscura" },
    banda: { peques: "Cuento para peques: 18 páginas, frases cortas y un estribillo para repetir juntos.", mayores: "Cuento para mayores: 22 páginas, más aventura, diálogos y una decisión que toma su protagonista." },
    color: "Su color favorito", colorNota: "Opcional: lo llevará en la ropa de las ilustraciones (si no eliges, su ropa de siempre).",
    arropa: "¿Quién le da las buenas noches?", amigo: "Su mejor amigo o amiga (opcional)", amigoEs: "es",
    rasgo: "Algo que solo tiene {n} (opcional)", rasgoEj: "Colecciona piedras, dice «supermegaguay», baila cuando hay tormenta…",
    deseo: "¿Alguna idea para el cuento? (opcional)", deseoEj: "Que salga su abuela Rosa, que aprenda a nadar, que celebre su cumpleaños…",
    iaNota: "Lunilla teje estos detalles en el texto. Antes de pagar puedes leer y retocar todo el cuento.",
    resumen: "Así va su libro", paginas: (n: number) => `${n} páginas ilustradas`, solo: "Solo para",
    tuNombre: "Su nombre",
    ilustrado: "Así lo pintarán en todas las páginas.",
  },
  ca: {
    pasos: ["Protagonista", "El seu món", "El conte", "Dedicatòria"],
    siguiente: "Següent", atras: "Enrere",
    piel: "To de pell", pelo: "Color de cabells", peinado: "Pentinat", gafas: "Ulleres", pecas: "Pigues",
    peinados: { corto: "Curt", rizado: "Arrissat", largo: "Llarg", coletas: "Cues o monyo" },
    pelos: { rubio: "Ros", castano: "Castany", pelirrojo: "Pèl-roig", negro: "Negre" },
    pieles: { clara: "Clara", media: "Mitjana", morena: "Morena", oscura: "Fosca" },
    banda: { peques: "Conte per a petits: 18 pàgines, frases curtes i una tornada per repetir junts.", mayores: "Conte per a grans: 22 pàgines, més aventura, diàlegs i una decisió que pren el protagonista." },
    color: "El seu color preferit", colorNota: "Opcional: el portarà a la roba de les il·lustracions (si no tries, la seva roba de sempre).",
    arropa: "Qui li dona la bona nit?", amigo: "El seu millor amic o amiga (opcional)", amigoEs: "és",
    rasgo: "Alguna cosa que només té {n} (opcional)", rasgoEj: "Col·lecciona pedres, diu «supermegaguai», balla quan hi ha tempesta…",
    deseo: "Alguna idea per al conte? (opcional)", deseoEj: "Que hi surti l'àvia Rosa, que aprengui a nedar, que celebri l'aniversari…",
    iaNota: "La Lunilla teixeix aquests detalls al text. Abans de pagar pots llegir i retocar tot el conte.",
    resumen: "Així va el seu llibre", paginas: (n: number) => `${n} pàgines il·lustrades`, solo: "Només per a",
    tuNombre: "El seu nom",
    ilustrado: "Així el pintaran a totes les pàgines.",
  },
};

const ASPECTO_INICIAL: Record<Genero, Aspecto> = {
  m: { piel: "media", pelo: "castano", peinado: "rizado", gafas: false, pecas: true },
  f: { piel: "morena", pelo: "negro", peinado: "coletas", gafas: false, pecas: false },
};

type Estado = Omit<DatosNino, "aspecto"> & { aspecto: Aspecto; idiomaWeb: Idioma; web: string };

export function Formulario({ idioma, titulos }: { idioma: Idioma; titulos: Record<PlantillaId, Bi> }) {
  const x = t(idioma).form;
  const k = C[idioma];
  const router = useRouter();
  const sp = useSearchParams();
  const g0: Genero = sp.get("genero") === "f" ? "f" : "m";
  const col0 = (COLECCIONES.find((c) => c.id === sp.get("coleccion"))?.id ?? "dormir") as ColeccionId;
  const [paso, setPaso] = useState(0);
  const [s, setS] = useState<Estado>({
    nombre: sp.get("nombre") ?? "", edad: Number(sp.get("edad")) || 4, genero: g0, ciudad: sp.get("ciudad") ?? "",
    companero: "perro", mascota: "", mascotaDescripcion: "", aficion: AFICIONES[0].id, coleccion: col0,
    tema: COLECCIONES.find((c) => c.id === col0)!.temas[0].id, idioma, bebe: "", bebeGenero: "m",
    dedicatoria: "", deParteDe: "", arropa: "mamaypapa", color: undefined, amigo: "", amigoGenero: "m",
    rasgo: "", deseo: "", aspecto: ASPECTO_INICIAL[g0], idiomaWeb: idioma, web: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof Estado>(c: K, v: Estado[K]) => setS((o) => ({ ...o, [c]: v }));
  const setA = <K extends keyof Aspecto>(c: K, v: Aspecto[K]) => setS((o) => ({ ...o, aspecto: { ...o.aspecto, [c]: v } }));
  const temas = useMemo(() => COLECCIONES.find((c) => c.id === s.coleccion)!.temas, [s.coleccion]);
  const banda = bandaDe(s.edad);
  const nombre = s.nombre.trim() || k.tuNombre;
  const titulo = (c: ColeccionId) => {
    const d = { ...s, nombre, mascota: s.mascota || "Nube", ciudad: s.ciudad || "Lleida", coleccion: c, tema: COLECCIONES.find((x) => x.id === c)!.temas[0].id };
    return rellenar(titulos[`${c}-${banda}`][s.idioma], d as DatosNino);
  };

  const validoPaso = [s.nombre.trim().length > 0, s.ciudad.trim().length > 0 && s.mascota.trim().length > 0, true, true];

  async function enviar() {
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/cuentos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(s) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "error");
      router.push(`${pref(j.idiomaWeb ?? idioma)}/cuento/${j.id}`);
    } catch (err) {
      setError(`${x.error} (${(err as Error).message})`);
      setEnviando(false);
    }
  }

  const chip = (activo: boolean) =>
    `rounded-full border-2 px-4 min-h-[44px] text-sm font-bold transition ${activo ? "border-luna bg-[#FEF3D3] text-noche" : "border-[#e6dcc8] bg-white text-suave hover:border-luna/60"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
      <form
        onSubmit={(e) => { e.preventDefault(); if (paso < 3) { if (validoPaso[paso]) setPaso(paso + 1); } else enviar(); }}
        className="tarjeta p-5 sm:p-8 space-y-6 order-2 lg:order-1"
      >
        <ol className="flex gap-2 text-xs sm:text-sm font-bold" aria-label="pasos">
          {k.pasos.map((n, i) => (
            <li key={n} className="flex-1">
              <button type="button" onClick={() => i <= paso || validoPaso.slice(0, i).every(Boolean) ? setPaso(i) : null}
                className={`w-full rounded-full py-2 ${i === paso ? "bg-noche text-crema" : i < paso ? "bg-[#FEF3D3] text-noche" : "bg-[#f1ebdf] text-suave"}`}
                aria-current={i === paso ? "step" : undefined}>
                <span className="opacity-70">{i + 1}.</span> {n}
              </button>
            </li>
          ))}
        </ol>

        {paso === 0 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="etiqueta">{x.nombre}</span><input autoFocus required maxLength={24} className="campo" autoComplete="off" value={s.nombre} onChange={(e) => set("nombre", e.target.value)} /></label>
              <fieldset><legend className="etiqueta">{x.protagonista}</legend>
                <div className="flex gap-2">
                  {(["m", "f"] as const).map((g) => (
                    <button type="button" key={g} className={`flex-1 ${chip(s.genero === g)}`} onClick={() => setS((o) => ({ ...o, genero: g, aspecto: ASPECTO_INICIAL[g] }))}>{g === "m" ? x.nino : x.nina}</button>
                  ))}
                </div>
              </fieldset>
            </div>
            <fieldset>
              <legend className="etiqueta">{x.edad}</legend>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <button type="button" key={n} className={`${chip(s.edad === n)} w-12 !px-0`} onClick={() => set("edad", n)}>{n}</button>)}
              </div>
              <p className="text-sm mt-2 text-noche bg-[#FEF3D3] rounded-xl px-3 py-2">{k.banda[banda]}</p>
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset><legend className="etiqueta">{k.piel}</legend>
                <div className="flex gap-3">
                  {(Object.keys(PIEL_HEX) as Aspecto["piel"][]).map((p) => (
                    <button type="button" key={p} title={k.pieles[p]} aria-label={k.pieles[p]} aria-pressed={s.aspecto.piel === p} onClick={() => setA("piel", p)}
                      className={`w-11 h-11 rounded-full border-4 ${s.aspecto.piel === p ? "border-luna scale-110" : "border-white shadow"}`} style={{ background: PIEL_HEX[p] }} />
                  ))}
                </div>
              </fieldset>
              <fieldset><legend className="etiqueta">{k.pelo}</legend>
                <div className="flex gap-3">
                  {(Object.keys(PELO_HEX) as Aspecto["pelo"][]).map((p) => (
                    <button type="button" key={p} title={k.pelos[p]} aria-label={k.pelos[p]} aria-pressed={s.aspecto.pelo === p} onClick={() => setA("pelo", p)}
                      className={`w-11 h-11 rounded-full border-4 ${s.aspecto.pelo === p ? "border-luna scale-110" : "border-white shadow"}`} style={{ background: PELO_HEX[p] }} />
                  ))}
                </div>
              </fieldset>
            </div>
            <fieldset><legend className="etiqueta">{k.peinado}</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(k.peinados) as Aspecto["peinado"][]).map((p) => <button type="button" key={p} className={chip(s.aspecto.peinado === p)} onClick={() => setA("peinado", p)}>{k.peinados[p]}</button>)}
                <button type="button" className={chip(s.aspecto.gafas)} aria-pressed={s.aspecto.gafas} onClick={() => setA("gafas", !s.aspecto.gafas)}>{k.gafas}</button>
                <button type="button" className={chip(s.aspecto.pecas)} aria-pressed={s.aspecto.pecas} onClick={() => setA("pecas", !s.aspecto.pecas)}>{k.pecas}</button>
              </div>
            </fieldset>
          </div>
        )}

        {paso === 1 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="etiqueta">{x.ciudad}</span><input autoFocus required maxLength={40} className="campo" placeholder="Lleida" value={s.ciudad} onChange={(e) => set("ciudad", e.target.value)} /></label>
              <label><span className="etiqueta">{x.companero}</span>
                <select className="campo" value={s.companero} onChange={(e) => set("companero", e.target.value)}>{COMPANEROS.map((c) => <option key={c.id} value={c.id}>{c.etiqueta[idioma]}</option>)}</select>
              </label>
              <label><span className="etiqueta">{x.mascota}</span><input required maxLength={20} className="campo" value={s.mascota} onChange={(e) => set("mascota", e.target.value)} /></label>
              <label><span className="etiqueta">{x.mascotaDesc}</span><input maxLength={80} className="campo" value={s.mascotaDescripcion} onChange={(e) => set("mascotaDescripcion", e.target.value)} /></label>
            </div>
            <fieldset><legend className="etiqueta">{x.aficion}</legend>
              <div className="flex flex-wrap gap-2">{AFICIONES.map((a) => <button type="button" key={a.id} className={chip(s.aficion === a.id)} onClick={() => set("aficion", a.id)}>{a.etiqueta[idioma]}</button>)}</div>
            </fieldset>
            <fieldset><legend className="etiqueta">{k.color}</legend>
              <div className="flex flex-wrap gap-3">
                {COLORES.map((c) => (
                  <button type="button" key={c.id} title={c.etiqueta[idioma]} aria-label={c.etiqueta[idioma]} aria-pressed={s.color === c.id} onClick={() => set("color", s.color === c.id ? undefined : c.id)}
                    className={`w-10 h-10 rounded-full border-4 ${s.color === c.id ? "border-noche scale-110" : "border-white shadow"}`} style={{ background: COLOR_HEX[c.id] }} />
                ))}
              </div>
              <p className="text-xs text-suave mt-1">{k.colorNota}</p>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="etiqueta">{k.arropa}</span>
                <select className="campo" value={s.arropa} onChange={(e) => set("arropa", e.target.value)}>{ARROPA.map((a) => <option key={a.id} value={a.id}>{a.etiqueta[idioma]}</option>)}</select>
              </label>
              <div>
                <span className="etiqueta">{k.amigo}</span>
                <div className="flex gap-2">
                  <input maxLength={24} className="campo flex-1" value={s.amigo} onChange={(e) => set("amigo", e.target.value)} aria-label={k.amigo} />
                  <select className="campo !w-28" value={s.amigoGenero} onChange={(e) => set("amigoGenero", e.target.value as Genero)} aria-label={k.amigoEs}>
                    <option value="m">{x.nino}</option><option value="f">{x.nina}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="etiqueta">{x.coleccion}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {COLECCIONES.map((c) => (
                  <button type="button" key={c.id} onClick={() => setS((o) => ({ ...o, coleccion: c.id, tema: c.temas[0].id }))}
                    className={`rounded-2xl border-2 p-4 text-left min-h-[48px] transition ${s.coleccion === c.id ? "border-luna bg-[#FEF3D3]" : "border-[#e6dcc8] bg-white hover:border-luna/60"}`}>
                    <span className="text-xs font-bold uppercase tracking-wide text-suave">{c.nombre[idioma]}</span>
                    <span className="block titulo text-lg leading-tight text-noche mt-1">{titulo(c.id)}</span>
                    <span className="block text-xs text-suave mt-1">{c.descripcion[idioma]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="etiqueta">{x.tema}</span>
                <select className="campo" value={s.tema} onChange={(e) => set("tema", e.target.value)}>{temas.map((tm) => <option key={tm.id} value={tm.id}>{tm.etiqueta[idioma]}</option>)}</select>
              </label>
              <label><span className="etiqueta">{x.idioma}</span>
                <select className="campo" value={s.idioma} onChange={(e) => set("idioma", e.target.value as Idioma)}><option value="es">Castellano</option><option value="ca">Català</option></select>
              </label>
              {s.coleccion === "hermanito" && (
                <>
                  <label><span className="etiqueta">{x.bebe}</span><input maxLength={20} className="campo" value={s.bebe} onChange={(e) => set("bebe", e.target.value)} /></label>
                  <label><span className="etiqueta">{x.bebeGenero}</span>
                    <select className="campo" value={s.bebeGenero} onChange={(e) => set("bebeGenero", e.target.value as Genero)}><option value="m">{x.hermanito}</option><option value="f">{x.hermanita}</option></select>
                  </label>
                </>
              )}
            </div>
            <label className="block"><span className="etiqueta">{k.rasgo.replace("{n}", nombre)}</span>
              <textarea maxLength={140} rows={2} className="campo" placeholder={k.rasgoEj} value={s.rasgo} onChange={(e) => set("rasgo", e.target.value)} />
            </label>
            <label className="block"><span className="etiqueta">{k.deseo}</span>
              <textarea maxLength={200} rows={2} className="campo" placeholder={k.deseoEj} value={s.deseo} onChange={(e) => set("deseo", e.target.value)} />
            </label>
            <p className="text-sm text-suave">{k.iaNota}</p>
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <label className="block"><span className="etiqueta">{x.dePartede}</span><input maxLength={60} className="campo" placeholder={x.dePartedeEj} value={s.deParteDe} onChange={(e) => set("deParteDe", e.target.value)} /></label>
            <label className="block"><span className="etiqueta">{x.dedicatoria}</span><textarea maxLength={240} rows={3} className="campo" value={s.dedicatoria} onChange={(e) => set("dedicatoria", e.target.value)} /></label>
            <p className="text-sm text-suave">{x.privacidad}</p>
          </div>
        )}

        {/* Campo trampa contra bots */}
        <input name="web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={s.web} onChange={(e) => set("web", e.target.value)} />
        {error && <p className="text-primario-osc font-bold" role="alert">{error}</p>}
        <div className="flex gap-3">
          {paso > 0 && <button type="button" className="boton-sec flex-none" onClick={() => setPaso(paso - 1)}>{k.atras}</button>}
          <button className="boton flex-1 text-lg" disabled={enviando || !validoPaso[paso]}>
            {paso < 3 ? `${k.siguiente} →` : enviando ? x.creando : x.enviar}
          </button>
        </div>
      </form>

      <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
        <div className="rounded-3xl p-5 text-crema cielo-suave shadow-xl">
          <p className="text-xs uppercase tracking-widest text-luna font-bold">{k.resumen}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="rounded-2xl bg-crema/10 p-2 flex-none"><Avatar aspecto={s.aspecto} genero={s.genero} color={s.color} tam={110} pijama={s.coleccion === "dormir"} /></div>
            <div className="min-w-0">
              <p className="titulo text-xl leading-tight text-crema break-words">{titulo(s.coleccion)}</p>
              <p className="text-sm text-crema/75 mt-1">{k.paginas(BANDAS[banda].paginas)} · {BANDAS[banda].etiqueta[idioma]}</p>
            </div>
          </div>
          <p className="text-xs text-crema/70 mt-3">{k.ilustrado}</p>
          <ul className="flex flex-wrap gap-1.5 mt-3 text-xs">
            {[s.ciudad, s.mascota && `${COMPANEROS.find((c) => c.id === s.companero)!.etiqueta[idioma]} ${s.mascota}`, AFICIONES.find((a) => a.id === s.aficion)!.etiqueta[idioma], s.amigo, s.color && COLORES.find((c) => c.id === s.color)?.etiqueta[idioma]]
              .filter(Boolean).map((v) => <li key={String(v)} className="rounded-full bg-crema/15 px-2.5 py-1">{v}</li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}
