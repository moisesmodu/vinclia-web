// Revisa una plantilla de 18/22 páginas: npx tsx scripts/revisar-plantilla.ts dormir-peques
import { revisar } from "../src/lib/plantillas/revision";
import type { Plantilla } from "../src/lib/plantillas/tipos";

const id = process.argv[2];
if (id) {
  const m = await import(`../src/lib/plantillas/${id}.ts`);
  const p = Object.values(m).find((x) => x && typeof x === "object" && "paginas" in (x as object)) as Plantilla;
  const e = revisar(p, id);
  console.log(e.length ? e.join("\n") : `OK ${id}: ${p.paginas.length} páginas, todas las combinaciones limpias`);
  process.exit(e.length ? 1 : 0);
}
