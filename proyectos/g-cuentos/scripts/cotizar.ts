// Cotización real de Gelato (impresión + envío a España) y margen resultante con el precio actual.
//   GELATO_API_KEY=… npm run cotizar
import { configPais, margenEstimado } from "../src/lib/config";
import { cotizar, dimensionesCubierta } from "../src/lib/imprenta/gelato";

const c = configPais();
const q = await cotizar("25007");
console.log(JSON.stringify(q, null, 2).slice(0, 4000));
const quotes = (q.quotes ?? []) as { products?: { price?: number }[]; shipmentMethods?: { price?: number; name?: string; minDeliveryDays?: number; maxDeliveryDays?: number }[] }[];
for (const qq of quotes) {
  const prod = (qq.products ?? []).reduce((s, p) => s + (p.price ?? 0), 0);
  for (const sm of qq.shipmentMethods ?? []) {
    const coste = Math.round((prod + (sm.price ?? 0)) * 100);
    const precio = c.precios.tapaDura;
    const sinIva = precio / (1 + c.iva.libros / 100);
    const margen = sinIva - (precio * c.costesEstimados.stripePorcentaje) / 100 - c.costesEstimados.stripeFijo - c.costesEstimados.ilustracionesPorCuento - coste;
    console.log(`${sm.name}: impresión ${prod} + envío ${sm.price} = ${(coste / 100).toFixed(2)} € → margen ${(margen / 100).toFixed(2)} € (${sm.minDeliveryDays}-${sm.maxDeliveryDays} días)`);
    if (margen < c.margenMinimo) console.log(`  ⚠ por debajo de ${(c.margenMinimo / 100).toFixed(2)} €: subir el precio en src/config/paises/es-ES.json`);
  }
}
console.log("Estimación actual en config:", (margenEstimado("tapaDura", false) / 100).toFixed(2), "€");
const dim = await dimensionesCubierta();
console.log("Cubierta (fuente):", dim.fuente);
console.log("Respuesta de Gelato:", JSON.stringify(dim.bruto, null, 2));
console.log("Medidas usadas:", JSON.stringify({ ...dim, bruto: undefined }));
if (dim.fuente !== "gelato") console.log("⚠ No se han podido leer las medidas: revisa leerDimensiones() en src/lib/imprenta/gelato.ts con la respuesta de arriba");
