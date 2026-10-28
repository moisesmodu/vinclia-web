import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { configPais } from "./config";

// Resend en producción; sin RESEND_API_KEY el correo se guarda en datos-locales/correos/.
// Hasta tener dominio propio: remitente común de la cartera (DESPLIEGUES.md §3.4).
const REMITENTE = process.env.CORREO_REMITENTE ?? "Lunilla <noreply@numimates.com>";

export async function enviarCorreo(a: string, asunto: string, html: string, etiqueta: string): Promise<{ id: string; simulado: boolean }> {
  const k = process.env.RESEND_API_KEY;
  if (!k) {
    const dir = path.join(process.cwd(), "datos-locales", "correos");
    await mkdir(dir, { recursive: true });
    const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${etiqueta}`;
    await writeFile(path.join(dir, `${id}.html`), `<!-- Para: ${a}\nAsunto: ${asunto} -->\n${html}`);
    return { id, simulado: true };
  }
  const r = await new Resend(k).emails.send({ from: REMITENTE, to: a, subject: asunto, html, replyTo: process.env.CORREO_SOPORTE || configPais().legal.email });
  if (r.error) throw new Error(`Resend: ${r.error.message}`);
  return { id: r.data!.id, simulado: false };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function plantilla(cuerpo: string) {
  return `<!doctype html><html><body style="margin:0;background:#FFF8EC;font-family:Nunito,'Segoe UI',Arial,sans-serif;color:#1B2444">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-size:22px;color:#2B3A67;margin:0 0 24px"><span style="color:#F5C84C">☾</span> <b>Lunilla</b></p>${cuerpo}
<p style="font-size:12px;color:#5b6382;margin-top:40px">Lunilla · Un cuento donde el protagonista eres tú<br>Hecho en Lleida · Precio claro · Cancela en un clic<br>¿Alguna duda? Responde a este correo.</p>
</div></body></html>`;
}

const boton = (url: string, txt: string) =>
  `<p style="margin:28px 0"><a href="${url}" style="background:#2B3A67;color:#FFF8EC;padding:14px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">${esc(txt)}</a></p>`;

export function correoEntrega(o: { idioma: "es" | "ca"; nombre: string; titulo: string; pdfUrl: string; tapaDura: boolean }) {
  const ca = o.idioma === "ca";
  const asunto = ca ? `El conte de ${o.nombre} ja és aquí: «${o.titulo}»` : `El cuento de ${o.nombre} ya está aquí: «${o.titulo}»`;
  const html = plantilla(
    ca
      ? `<p>Hola!</p><p>Ja tens llest <b>«${esc(o.titulo)}»</b>. Pots descarregar-lo, imprimir-lo a casa o llegir-lo des del mòbil aquesta mateixa nit.</p>${boton(o.pdfUrl, "Descarregar el conte (PDF)")}${o.tapaDura ? "<p>El llibre de tapa dura ja és a la impremta. T'escriurem quan surti cap a casa teva.</p>" : ""}<p>Si alguna cosa no t'agrada, respon a aquest correu: te'l refem gratis una vegada.</p>`
      : `<p>¡Hola!</p><p>Ya tienes listo <b>«${esc(o.titulo)}»</b>. Puedes descargarlo, imprimirlo en casa o leerlo desde el móvil esta misma noche.</p>${boton(o.pdfUrl, "Descargar el cuento (PDF)")}${o.tapaDura ? "<p>El libro de tapa dura ya está en la imprenta. Te escribiremos cuando salga hacia tu casa.</p>" : ""}<p>Si algo no te gusta, responde a este correo: te lo rehacemos gratis una vez.</p>`,
  );
  return { asunto, html };
}

export function correoConfirmacion(o: { idioma: "es" | "ca"; nombre: string; titulo: string; urlPedido: string }) {
  const ca = o.idioma === "ca";
  const asunto = ca ? `Hem rebut la teva comanda: «${o.titulo}»` : `Hemos recibido tu pedido: «${o.titulo}»`;
  const html = plantilla(
    ca
      ? `<p>Gràcies! Estem il·lustrant el conte de ${esc(o.nombre)}. Normalment està llest en menys de 2 hores i t'arribarà en aquest mateix correu.</p>${boton(o.urlPedido, "Veure l'estat de la comanda")}`
      : `<p>¡Gracias! Estamos ilustrando el cuento de ${esc(o.nombre)}. Normalmente está listo en menos de 2 horas y te llegará a este mismo correo.</p>${boton(o.urlPedido, "Ver el estado del pedido")}`,
  );
  return { asunto, html };
}

/** Recuperación (uno solo, con consentimiento marcado al pagar): vuelve a la vista previa con un clic. */
export function correoRecordatorio(o: { idioma: "es" | "ca"; nombre: string; titulo: string; urlVista: string }) {
  const ca = o.idioma === "ca";
  const asunto = ca ? `El conte de ${o.nombre} t'espera: «${o.titulo}»` : `El cuento de ${o.nombre} te espera: «${o.titulo}»`;
  const html = plantilla(
    ca
      ? `<p>Hola!</p><p>Vas deixar a mitges <b>«${esc(o.titulo)}»</b>. El guardem tal com el vas deixar, amb els teus retocs, durant 30 dies.</p>${boton(o.urlVista, "Acabar el conte")}<p>Aquest és l'únic recordatori que t'enviarem.</p>`
      : `<p>¡Hola!</p><p>Dejaste a medias <b>«${esc(o.titulo)}»</b>. Lo guardamos tal como lo dejaste, con tus retoques, durante 30 días.</p>${boton(o.urlVista, "Terminar el cuento")}<p>Este es el único recordatorio que te enviaremos.</p>`,
  );
  return { asunto, html };
}

export function correoAfiliado(o: { nombre: string; enlace: string; panel: string }) {
  return {
    asunto: "Tu enlace de afiliada de Lunilla",
    html: plantilla(
      `<p>¡Hola, ${esc(o.nombre)}!</p><p>Este es tu enlace personal. Cada cuento que se compre desde él en los 30 días siguientes te da un 20 % del importe.</p><p style="font-family:monospace;background:#fff;padding:12px;border-radius:8px">${esc(o.enlace)}</p>${boton(o.panel, "Ver mi panel")}<p>Guarda este correo: el botón es tu acceso al panel.</p>`,
    ),
  };
}
