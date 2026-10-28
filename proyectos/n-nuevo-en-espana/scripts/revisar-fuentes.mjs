// Para la tarea programada semanal: lista todas las fuentes oficiales citadas, comprueba que responden
// y marca las guías cuya revisión tiene más de 7 días. Uso: node scripts/revisar-fuentes.mjs [--json]
import fs from "node:fs";
import path from "node:path";

const raiz = path.join(process.cwd(), "content", "es", "es", "guias");
const hoy = new Date();
const filas = [];
const urls = new Map();
for (const f of fs.readdirSync(raiz)) {
  const g = JSON.parse(fs.readFileSync(path.join(raiz, f), "utf8"));
  const dias = Math.round((hoy - new Date(g.actualizado)) / 864e5);
  filas.push({ guia: g.slug, actualizado: g.actualizado, dias, tasas: g.tasas.map((t) => `${t.concepto}: ${t.importe}`) });
  for (const x of g.fuentes) urls.set(x.url, [...(urls.get(x.url) ?? []), g.slug]);
}
const estado = [];
for (const [url, guias] of urls) {
  let codigo = "error";
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (revision de fuentes Nuevo en España)" } });
    codigo = String(r.status);
  } catch (e) { codigo = `error: ${e.cause?.code ?? e.name}`; }
  estado.push({ url, codigo, guias });
}
if (process.argv.includes("--json")) { console.log(JSON.stringify({ filas, estado }, null, 2)); process.exit(0); }
console.log("Guías (días desde la última revisión):");
for (const f of filas) console.log(`${f.dias > 7 ? "⚠" : "✔"} ${f.guia} · ${f.actualizado} (${f.dias} días)\n    ${f.tasas.join("\n    ")}`);
console.log("\nFuentes:");
for (const e of estado) console.log(`${e.codigo.startsWith("2") ? "✔" : "✘"} ${e.codigo} ${e.url} (${e.guias.join(", ")})`);
