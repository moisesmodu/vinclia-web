import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { configPais } from "../config";
import { CUBIERTA_RESERVA, type DimensionesCubierta } from "../maquetacion";

// Gelato API (https://dashboard.gelato.com/docs/). Cabecera X-API-KEY.
// Modos:
//   sin GELATO_API_KEY            → «simulado»: valida y guarda el pedido en disco, no sale nada.
//   GELATO_MODO=borrador (defecto)→ «sandbox»: crea el pedido como orderType "draft" (Gelato no lo
//                                    produce ni lo cobra hasta que alguien lo confirma en el panel).
//   GELATO_MODO=produccion        → pedido real, se produce y se cobra.
const ORDERS = "https://order.gelatoapis.com/v4/orders";
const PRODUCTS = "https://product.gelatoapis.com/v3/products";

export type ModoImprenta = "simulado" | "borrador" | "produccion";
export function modoImprenta(): ModoImprenta {
  if (!process.env.GELATO_API_KEY) return "simulado";
  return process.env.GELATO_MODO === "produccion" ? "produccion" : "borrador";
}

export interface DireccionEnvio {
  nombre: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  cp: string;
  provincia?: string;
  pais: string; // ISO-2
  email: string;
  telefono?: string;
}

export interface PedidoImprenta {
  referencia: string; // id de nuestro pedido
  interiorUrl: string;
  cubiertaUrl: string;
  envio: DireccionEnvio;
}

function cabeceras() {
  return { "X-API-KEY": process.env.GELATO_API_KEY ?? "", "Content-Type": "application/json" };
}

export function cuerpoPedido(p: PedidoImprenta, modo: ModoImprenta) {
  const c = configPais();
  const [nombre, ...resto] = p.envio.nombre.trim().split(/\s+/);
  // Tipos de archivo para fotolibros: cubierta y contenido por separado. Si Gelato pidiera otros
  // nombres, se cambian aquí (GELATO_TIPOS_ARCHIVO="cover,content").
  const [tCubierta, tInterior] = (process.env.GELATO_TIPOS_ARCHIVO ?? "cover,content").split(",");
  return {
    orderType: modo === "produccion" ? "order" : "draft",
    orderReferenceId: p.referencia,
    customerReferenceId: p.envio.email,
    currency: "EUR",
    items: [
      {
        itemReferenceId: `${p.referencia}-1`,
        productUid: c.imprenta.productUid,
        pageCount: c.imprenta.paginasInterior,
        quantity: 1,
        files: [
          { type: tCubierta, url: p.cubiertaUrl },
          { type: tInterior, url: p.interiorUrl },
        ],
      },
    ],
    shipmentMethodUid: c.imprenta.metodoEnvio,
    shippingAddress: {
      firstName: nombre,
      lastName: resto.join(" ") || "-",
      addressLine1: p.envio.linea1,
      addressLine2: p.envio.linea2 ?? "",
      city: p.envio.ciudad,
      postCode: p.envio.cp,
      state: p.envio.provincia ?? "",
      country: p.envio.pais,
      email: p.envio.email,
      phone: p.envio.telefono ?? "",
    },
  };
}

export function validarPedido(p: PedidoImprenta): string | null {
  if (!/^https?:\/\//.test(p.interiorUrl) || !/^https?:\/\//.test(p.cubiertaUrl)) return "faltan las URL de los PDF";
  const e = p.envio;
  if (!e.nombre || !e.linea1 || !e.ciudad || !e.cp || !e.email) return "dirección de envío incompleta";
  if (e.pais !== "ES") return `envío a ${e.pais} no habilitado todavía`;
  if (!/^\d{5}$/.test(e.cp)) return `código postal no válido: ${e.cp}`;
  if (/^(35|38|51|52)/.test(e.cp)) return `envío a Canarias, Ceuta o Melilla no disponible (CP ${e.cp}): contactar y reembolsar`;
  return null;
}

export async function crearPedidoImprenta(p: PedidoImprenta): Promise<{ id: string; modo: ModoImprenta; estado: string }> {
  const fallo = validarPedido(p);
  if (fallo) throw new Error(fallo);
  const modo = modoImprenta();
  const cuerpo = cuerpoPedido(p, modo);
  if (modo === "simulado") {
    const dir = path.join(process.cwd(), "datos-locales", "imprenta");
    await mkdir(dir, { recursive: true });
    const id = `SIM-${p.referencia}`;
    await writeFile(path.join(dir, `${id}.json`), JSON.stringify(cuerpo, null, 2));
    return { id, modo, estado: "simulado" };
  }
  const r = await fetch(ORDERS, { method: "POST", headers: cabeceras(), body: JSON.stringify(cuerpo) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Gelato ${r.status}: ${txt.slice(0, 500)}`);
  const j = JSON.parse(txt) as { id: string; fulfillmentStatus?: string; financialStatus?: string };
  return { id: j.id, modo, estado: j.fulfillmentStatus ?? (modo === "borrador" ? "draft" : "created") };
}

export async function estadoPedidoImprenta(id: string): Promise<{ estado: string; seguimiento?: string }> {
  if (id.startsWith("SIM-") || !process.env.GELATO_API_KEY) return { estado: "simulado" };
  const r = await fetch(`${ORDERS}/${id}`, { headers: cabeceras() });
  if (!r.ok) throw new Error(`Gelato ${r.status}`);
  const j = (await r.json()) as { fulfillmentStatus: string; items?: { fulfillments?: { trackingUrl?: string }[] }[] };
  return { estado: j.fulfillmentStatus, seguimiento: j.items?.[0]?.fulfillments?.[0]?.trackingUrl };
}

/** Medidas reales del pliego de cubierta según Gelato; si no hay clave, la reserva. */
export async function dimensionesCubierta(): Promise<DimensionesCubierta & { fuente: string }> {
  const c = configPais();
  if (!process.env.GELATO_API_KEY) return { ...CUBIERTA_RESERVA, fuente: "reserva" };
  const url = `${PRODUCTS}/${c.imprenta.productUid}/cover-dimensions?pageCount=${c.imprenta.paginasInterior}&measureUnit=mm`;
  const r = await fetch(url, { headers: cabeceras() });
  if (!r.ok) return { ...CUBIERTA_RESERVA, fuente: `reserva (Gelato ${r.status})` };
  // La respuesta trae el pliego completo y sus zonas; se toman las cifras principales.
  const j = (await r.json()) as Record<string, { width?: number; height?: number; value?: number } | undefined>;
  const ancho = j.wholeCoverDimensions?.width ?? j.cover?.width;
  const alto = j.wholeCoverDimensions?.height ?? j.cover?.height;
  const lomo = j.spineDimensions?.width ?? j.spine?.width;
  const env = j.wrapDimensions?.width ?? j.wraparoundEdgeSize?.value;
  if (!ancho || !alto || !lomo) return { ...CUBIERTA_RESERVA, fuente: "reserva (respuesta inesperada)" };
  return { anchoMm: ancho, altoMm: alto, lomoMm: lomo, envolturaMm: env ?? CUBIERTA_RESERVA.envolturaMm, fuente: "gelato" };
}

/** Cotización real (impresión + envío) para el país; la usa `npm run cotizar`. */
export async function cotizar(cp = "25001") {
  const c = configPais();
  if (!process.env.GELATO_API_KEY) throw new Error("Falta GELATO_API_KEY");
  const cuerpo = {
    orderReferenceId: "cotizacion",
    customerReferenceId: "cotizacion",
    currency: "EUR",
    allowMultipleQuotes: true,
    recipient: { country: c.pais, postCode: cp, addressLine1: "Plaça Paeria 1", city: "Lleida", firstName: "Prueba", lastName: "Lunilla", email: "prueba@example.com" },
    products: [{ itemReferenceId: "1", productUid: c.imprenta.productUid, pageCount: c.imprenta.paginasInterior, quantity: 1 }],
  };
  const r = await fetch(`${ORDERS}:quote`, { method: "POST", headers: cabeceras(), body: JSON.stringify(cuerpo) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Gelato ${r.status}: ${txt.slice(0, 500)}`);
  return JSON.parse(txt);
}
