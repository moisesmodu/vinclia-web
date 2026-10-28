import { Resend } from "resend";
import { config } from "./config";

export type Correo = { para: string; asunto: string; texto: string; html: string; idioma?: string };

// Sin RESEND_API_KEY no se envía nada: el correo se escribe en el registro (útil en local y en pruebas).
export const bandejaPruebas: Correo[] = [];

export async function enviar(c: Correo): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    bandejaPruebas.push(c);
    console.log(`[correo sin enviar] para=${c.para} asunto=${c.asunto}\n${c.texto}`);
    return true;
  }
  const resend = new Resend(clave);
  const { error } = await resend.emails.send({
    from: process.env.CORREO_REMITENTE ?? `${config.marca} <noreply@numimates.com>`,
    to: c.para,
    subject: c.asunto,
    text: c.texto,
    html: c.html
  });
  if (error) console.error("Resend", error);
  return !error;
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

/** Plantilla mínima, legible en cualquier cliente y con dirección correcta para el árabe. */
export function plantilla(opts: { idioma: string; titulo: string; parrafos: string[]; boton?: { texto: string; url: string }; pie: string[] }): { html: string; texto: string } {
  const dir = opts.idioma === "ar" ? "rtl" : "ltr";
  const html = `<!doctype html><html lang="${opts.idioma}" dir="${dir}"><body style="margin:0;background:#FBF5EC;font-family:'Noto Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1F2A44">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-weight:700;font-size:18px;color:#1F2A44;margin:0 0 16px"><span style="display:inline-block;width:14px;height:18px;border-radius:7px 7px 0 0;background:#D9603B;vertical-align:-2px;margin-inline-end:8px"></span>${esc(config.marca)}</p>
<h1 style="font-size:20px;margin:0 0 12px">${esc(opts.titulo)}</h1>
${opts.parrafos.map((p) => `<p style="font-size:16px;line-height:1.6">${esc(p)}</p>`).join("\n")}
${opts.boton ? `<p><a href="${esc(opts.boton.url)}" style="display:inline-block;background:#B9472A;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">${esc(opts.boton.texto)}</a></p>` : ""}
<hr style="border:none;border-top:1px solid #eadfce;margin:24px 0">
${opts.pie.map((p) => `<p style="font-size:13px;color:#5b6475;line-height:1.5">${p}</p>`).join("\n")}
<p style="font-size:12px;color:#5b6475">${esc(config.sello)}</p>
</div></body></html>`;
  const texto = [opts.titulo, "", ...opts.parrafos, opts.boton ? `${opts.boton.texto}: ${opts.boton.url}` : "", "", ...opts.pie.map((p) => p.replace(/<[^>]+>/g, ""))].join("\n");
  return { html, texto };
}

export function enlacePie(texto: string, url: string) {
  return `<a href="${esc(url)}" style="color:#5b6475">${esc(texto)}</a>`;
}
