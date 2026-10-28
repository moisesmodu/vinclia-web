// Comprueba que cada guía y cada pregunta cumplen el esquema y que las traducciones tienen los mismos id que el castellano.
// Uso: npm run validar   (sale con código 1 si hay errores)
import fs from "node:fs";
import path from "node:path";

const raiz = path.join(process.cwd(), "content", "es");
const errores = [];
const avisos = [];
const leer = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { errores.push(`${p}: JSON no válido (${e.message})`); return null; } };
const CAMPOS = ["slug", "titulo", "resumen", "paraQuien", "actualizado", "datosClave", "pasos", "documentos", "plazos", "tasas", "errores", "checklist", "recordatorio", "fuentes"];

const base = {};
for (const f of fs.readdirSync(path.join(raiz, "es", "guias"))) {
  const g = leer(path.join(raiz, "es", "guias", f));
  if (g) base[g.slug] = g;
}
const idiomas = fs.readdirSync(raiz).filter((d) => fs.statSync(path.join(raiz, d)).isDirectory());
const resumen = [];
for (const i of idiomas) {
  const dir = path.join(raiz, i, "guias");
  const n = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
  const np = fs.existsSync(path.join(raiz, i, "preguntas")) ? fs.readdirSync(path.join(raiz, i, "preguntas")).length : 0;
  resumen.push(`${i}: ${n} guías, ${np} preguntas`);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const g = leer(p);
    if (!g) continue;
    for (const c of CAMPOS) if (g[c] === undefined) errores.push(`${p}: falta ${c}`);
    if (`${g.slug}.json` !== f) errores.push(`${p}: slug distinto del nombre de archivo`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.actualizado ?? "")) errores.push(`${p}: actualizado sin formato AAAA-MM-DD`);
    for (const x of g.fuentes ?? []) if (!/^https:\/\//.test(x.url) || !x.consultado) errores.push(`${p}: fuente sin https o sin fecha (${x.nombre})`);
    if ((g.fuentes ?? []).length < 2) errores.push(`${p}: menos de 2 fuentes`);
    const ids = (g.checklist ?? []).map((x) => x.id);
    if (new Set(ids).size !== ids.length) errores.push(`${p}: ids de checklist repetidos`);
    const b = base[g.slug];
    if (i !== "es" && b) {
      const bi = b.checklist.map((x) => x.id).join(",");
      if (bi !== ids.join(",")) errores.push(`${p}: ids de checklist distintos del castellano`);
      for (const k of ["pasos", "documentos", "tasas", "errores"]) if (g[k]?.length !== b[k].length) avisos.push(`${p}: ${k} tiene ${g[k]?.length} elementos y en castellano ${b[k].length}`);
      if (g.recordatorio?.avisos?.map((a) => a.dias).join() !== b.recordatorio.avisos.map((a) => a.dias).join()) errores.push(`${p}: días de recordatorio distintos del castellano`);
    }
  }
  const dp = path.join(raiz, i, "preguntas");
  if (fs.existsSync(dp)) for (const f of fs.readdirSync(dp)) {
    const p = path.join(dp, f);
    const q = leer(p);
    if (!q) continue;
    for (const c of ["slug", "pregunta", "descripcion", "respuestaCorta", "secciones", "faq", "guia", "actualizado", "fuentes"]) if (q[c] === undefined) errores.push(`${p}: falta ${c}`);
    if (`${q.slug}.json` !== f || !/^[a-z0-9-]+$/.test(q.slug)) errores.push(`${p}: slug no válido`);
    if (!base[q.guia]) errores.push(`${p}: guía relacionada desconocida (${q.guia})`);
  }
}
console.log(resumen.join("\n"));
for (const a of avisos) console.log("AVISO", a);
for (const e of errores) console.log("ERROR", e);
console.log(errores.length ? `\n${errores.length} errores` : "\nContenido correcto");
process.exit(errores.length ? 1 : 0);
