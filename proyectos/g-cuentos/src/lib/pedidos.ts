import type { Pedido } from "@prisma/client";
import { guardar, leer } from "./almacen";
import { configPais, URL_BASE, type Formato } from "./config";
import { correoConfirmacion, correoEntrega, enviarCorreo } from "./correo";
import type { Cuento } from "./cuento";
import { db, evento } from "./db";
import { encargoIlustracion, ilustracionesCompletas, totalIlustraciones } from "./ilustraciones";
import { crearPedidoImprenta, dimensionesCubierta, estadoPedidoImprenta, type DireccionEnvio } from "./imprenta/gelato";
import { generarCubierta, generarInterior, generarLibroImprenta } from "./maquetacion";
import type { DatosNino } from "./rellenar";

// Máquina de estados del pedido (idempotente: se puede llamar tantas veces como se quiera).
//   borrador → pagado → ilustrando → maquetando → entregado                      (PDF)
//                                             └→ imprenta → enviado_imprenta → enviado (tapa dura)
//   Cualquier fallo: intentos+1; al tercero → incidencia (la revisa la tarea diaria).
export const ESTADOS_ACTIVOS = ["pagado", "ilustrando", "maquetando", "imprenta", "enviado_imprenta"];
const MAX_INTENTOS = 3;

const urlPedido = (p: Pedido) => `${URL_BASE()}${p.idioma === "ca" ? "/ca" : ""}/pedido/${p.id}`;

export async function marcarPagado(o: {
  pedidoId: string; sessionId: string; paymentId?: string; email?: string | null; nombre?: string | null;
  importe: number; envio?: DireccionEnvio | null; afiliado?: string | null; formato?: Formato;
}): Promise<Pedido | null> {
  const p = await db.pedido.findUnique({ where: { id: o.pedidoId } });
  if (!p) return null;
  if (p.estado !== "borrador") return p; // webhook repetido: no hacer nada
  const comision = o.afiliado ? Math.round((o.importe * configPais().afiliados.comisionPorcentaje) / 100) : null;
  const af = o.afiliado ? await db.afiliado.findUnique({ where: { codigo: o.afiliado } }) : null;
  const act = await db.pedido.update({
    where: { id: p.id },
    data: {
      estado: "pagado", pagadoEn: new Date(), stripeSessionId: o.sessionId, stripePaymentId: o.paymentId,
      email: o.email ?? p.email, nombreCliente: o.nombre ?? p.nombreCliente, precioCents: o.importe,
      formato: o.formato ?? p.formato, envio: o.envio ? JSON.parse(JSON.stringify(o.envio)) : undefined,
      afiliado: af?.activo ? af.codigo : null, comisionCents: af?.activo ? comision : null,
    },
  });
  await evento("pagado", p.id, { importe: o.importe, afiliado: act.afiliado });
  return act;
}

export async function avanzar(id: string): Promise<Pedido> {
  let p = await db.pedido.findUniqueOrThrow({ where: { id } });
  for (let paso = 0; paso < 6; paso++) {
    const antes = p.estado;
    try {
      p = await paso1(p);
    } catch (e) {
      const msg = (e as Error).message.slice(0, 900);
      const intentos = p.intentos + 1;
      p = await db.pedido.update({ where: { id }, data: { intentos, error: msg, estado: intentos >= MAX_INTENTOS ? "incidencia" : p.estado } });
      await evento("error", id, { estado: antes, msg, intentos });
      break;
    }
    if (p.estado === antes) break;
  }
  return p;
}

async function paso1(p: Pedido): Promise<Pedido> {
  const datos = p.datos as unknown as DatosNino;
  const cuento = p.cuento as unknown as Cuento;
  switch (p.estado) {
    case "pagado": {
      const encargo = encargoIlustracion(datos);
      const sig = ilustracionesCompletas(p.ilustraciones, totalIlustraciones(datos)) ? "maquetando" : "ilustrando";
      const act = await db.pedido.update({ where: { id: p.id }, data: { estado: sig, trabajosIlustr: JSON.parse(JSON.stringify(encargo)) } });
      if (p.email) {
        const c = correoConfirmacion({ idioma: p.idioma as "es" | "ca", nombre: datos.nombre, titulo: cuento.titulo, urlPedido: urlPedido(p) });
        await enviarCorreo(p.email, c.asunto, c.html, `confirmacion-${p.id}`);
      }
      await evento("encargo-ilustracion", p.id);
      return act;
    }
    case "ilustrando":
      // Espera al taller (tarea programada) que sube la portada y las 18 o 22 páginas.
      return ilustracionesCompletas(p.ilustraciones, totalIlustraciones(datos)) ? db.pedido.update({ where: { id: p.id }, data: { estado: "maquetando" } }) : p;
    case "maquetando": {
      const urls = p.ilustraciones as Record<string, string>;
      const imagenes = await Promise.all(Array.from({ length: totalIlustraciones(datos) }, (_, i) => leer(urls[String(i)])));
      const base = { cuento, datos, idioma: p.idioma as "es" | "ca", nombre: datos.nombre, imagenes };
      const pdf = await generarInterior({ ...base, modo: "pantalla" });
      const pdfUrl = await guardar(`pedidos/${p.id}/${slug(cuento.titulo)}.pdf`, pdf, "application/pdf");
      let interiorUrl: string | undefined, cubiertaUrl: string | undefined, libroUrl: string | undefined;
      if (p.formato === "tapaDura") {
        const dim = await dimensionesCubierta();
        // PDF único para Gelato (cubierta + guarda + 30 páginas + blanca) y, para revisar, interior y cubierta sueltos
        libroUrl = await guardar(`pedidos/${p.id}/libro-imprenta.pdf`, await generarLibroImprenta(base, dim), "application/pdf");
        interiorUrl = await guardar(`pedidos/${p.id}/interior.pdf`, await generarInterior({ ...base, modo: "imprenta" }), "application/pdf");
        cubiertaUrl = await guardar(`pedidos/${p.id}/cubierta.pdf`, await generarCubierta(base, dim), "application/pdf");
        await evento("cubierta", p.id, { medidas: dim });
      }
      if (p.email) {
        const c = correoEntrega({ idioma: p.idioma as "es" | "ca", nombre: datos.nombre, titulo: cuento.titulo, pdfUrl, tapaDura: p.formato === "tapaDura" });
        await enviarCorreo(p.email, c.asunto, c.html, `entrega-${p.id}`);
      }
      return db.pedido.update({
        where: { id: p.id },
        data: { pdfUrl, interiorUrl, cubiertaUrl, libroUrl, entregadoEn: new Date(), estado: p.formato === "tapaDura" ? "imprenta" : "entregado", error: null, intentos: 0 },
      });
    }
    case "imprenta": {
      const envio = p.envio as unknown as DireccionEnvio | null;
      if (!envio || !p.libroUrl) throw new Error("faltan dirección o PDF de imprenta");
      const r = await crearPedidoImprenta({ referencia: p.id, libroUrl: p.libroUrl, interiorUrl: p.interiorUrl ?? undefined, cubiertaUrl: p.cubiertaUrl ?? undefined, envio });
      await evento("imprenta", p.id, r);
      return db.pedido.update({ where: { id: p.id }, data: { imprentaPedidoId: r.id, imprentaEstado: `${r.modo}:${r.estado}`, estado: "enviado_imprenta", error: null, intentos: 0 } });
    }
    case "enviado_imprenta": {
      if (!p.imprentaPedidoId) return p;
      const r = await estadoPedidoImprenta(p.imprentaPedidoId);
      const enviado = ["shipped", "delivered", "in_transit"].includes(r.estado);
      if (r.estado === p.imprentaEstado && !enviado) return p;
      return db.pedido.update({ where: { id: p.id }, data: { imprentaEstado: r.estado, seguimientoUrl: r.seguimiento, estado: enviado ? "enviado" : p.estado } });
    }
    default:
      return p;
  }
}

export function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Recibe las ilustraciones del taller (URL externas), las copia al almacén y avanza el pedido. */
export async function recibirIlustraciones(id: string, urls: Record<string, string>): Promise<Pedido> {
  const p = await db.pedido.findUniqueOrThrow({ where: { id } });
  const actuales = (p.ilustraciones as Record<string, string> | null) ?? {};
  const total = totalIlustraciones(p.datos as unknown as DatosNino);
  const nuevas: Record<string, string> = { ...actuales };
  for (const [k, url] of Object.entries(urls)) {
    // «hoja» = hoja de personaje propia del pedido (aspecto elegido por la familia); 0..N = portada y páginas
    const i = Number(k);
    if (k !== "hoja" && (!Number.isInteger(i) || i < 0 || i >= total)) continue;
    const buf = await leer(url);
    const nombre = k === "hoja" ? "hoja" : String(i).padStart(2, "0");
    nuevas[k] = await guardar(`pedidos/${id}/ilustraciones/${nombre}.png`, buf, "image/png");
  }
  await db.pedido.update({ where: { id }, data: { ilustraciones: nuevas } });
  await evento("ilustraciones", id, { recibidas: Object.keys(urls).length });
  return avanzar(id);
}
