import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

// Resend en producción; sin RESEND_API_KEY el correo se guarda en datos-locales/correos/.
// Hasta tener dominio propio: remitente común de la cartera (DESPLIEGUES.md §3.4).
const REMITENTE = process.env.CORREO_REMITENTE ?? "Lunilla <noreply@algorithmicslleida.com>";

export async function enviarCorreo(a: string, asunto: string, html: string, etiqueta: string): Promise<{ id: string; simulado: boolean }> {
  const k = process.env.RESEND_API_KEY;
  if (!k) {
    const dir = path.join(process.cwd(), "datos-locales", "correos");
    await mkdir(dir, { recursive: true });
    const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${etiqueta}`;
    await writeFile(path.join(dir, `${id}.html`), `<!-- Para: ${a}\nAsunto: ${asunto} -->\n${html}`);
    return { id, simulado: true };
  }
  const r = await new Resend(k).emails.send({ from: REMITENTE, to: a, subject: asunto, html, replyTo: process.env.CORREO_SOPORTE ?? process.env.LEGAL_EMAIL ?? "hola@lunilla.es" });
  if (r.error) throw new Error(`Resend: ${r.error.message}`);
  return { id: r.data!.id, simulado: false };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function plantilla(cuerpo: string) {
  return `<!doctype html><html><body style="margin:0;background:#fbf6ec;font-family:Georgia,serif;color:#33291f">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="font-size:22px;color:#29395f;margin:0 0 24px"><b>Lunilla</b></p>${cuerpo}
<p style="font-size:12px;color:#8a7a68;margin-top:40px">Lunilla · cuentos personalizados · lunilla.es<br>¿Alguna duda? Responde a este correo.</p>
</div></body></html>`;
}

const boton = (url: string, txt: string) =>
  `<p style="margin:28px 0"><a href="${url}" style="background:#bd664a;color:#fff;padding:14px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold">${esc(txt)}</a></p>`;

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

export function correoAfiliado(o: { nombre: string; enlace: string; panel: string }) {
  return {
    asunto: "Tu enlace de afiliada de Lunilla",
    html: plantilla(
      `<p>¡Hola, ${esc(o.nombre)}!</p><p>Este es tu enlace personal. Cada cuento que se compre desde él en los 30 días siguientes te da un 20 % del importe.</p><p style="font-family:monospace;background:#fff;padding:12px;border-radius:8px">${esc(o.enlace)}</p>${boton(o.panel, "Ver mi panel")}<p>Guarda este correo: el botón es tu acceso al panel.</p>`,
    ),
  };
}
