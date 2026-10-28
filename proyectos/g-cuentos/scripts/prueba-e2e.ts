// Prueba de punta a punta contra un servidor en marcha (npm run build && npm start).
//   URL_BASE=http://localhost:3000 ADMIN_TOKEN=… npm run prueba:e2e
// Recorre: vista previa → checkout → pago (simulador o Stripe de prueba) → webhook → encargo de
// ilustración → el «taller» entrega 13 ilustraciones → PDF → correo → pedido a imprenta.
// También: afiliada (alta, clic, cookie aceptada, comisión). Escribe un informe en datos-locales/e2e.json.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PDFDocument } from "pdf-lib";

const BASE = (process.env.URL_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const ADMIN = process.env.ADMIN_TOKEN ?? "";
const informe: Record<string, unknown> = { base: BASE, inicio: new Date().toISOString(), pasos: [] as string[] };
const paso = (s: string) => { (informe.pasos as string[]).push(s); console.log("✔", s); };
const falla = (s: string): never => { informe.error = s; writeFileSync("datos-locales/e2e.json", JSON.stringify(informe, null, 2)); console.error("✘", s); process.exit(1); };
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function json(r: Response) { const t = await r.text(); try { return JSON.parse(t); } catch { return { texto: t.slice(0, 300) }; } }

async function admin(ruta: string, init?: RequestInit) {
  return fetch(`${BASE}${ruta}`, { ...init, headers: { "x-admin-token": ADMIN, "content-type": "application/json", ...(init?.headers ?? {}) } });
}

async function esperarEstado(id: string, estados: string[], maxS = 120): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxS; i += 2) {
    const r = await admin(`/api/admin/pedidos/${id}/avanzar`, { method: "POST" });
    const j = await json(r);
    if (estados.includes(j.estado)) return j;
    if (j.estado === "incidencia") falla(`incidencia en ${id}: ${j.error}`);
    await espera(2000);
  }
  return falla(`timeout esperando ${estados.join("/")} en ${id}`);
}

async function urlsIlustracionesMuestra(slug: string, total: number, hoja = false): Promise<Record<string, string>> {
  // El taller entrega URL públicas (las del CDN de Higgsfield). Aquí se usan las webp públicas de las
  // muestras servidas por el propio servidor (mismo flujo que una URL del CDN); si a la muestra le falta
  // alguna página, se repite la anterior (solo en la prueba).
  const out: Record<string, string> = {};
  const dir = path.join("public", "muestras", slug);
  let ultima = "00";
  for (let i = 0; i < total; i++) {
    const n = String(i).padStart(2, "0");
    if (existsSync(path.join(dir, `${n}.webp`))) ultima = n;
    out[String(i)] = `${BASE}/muestras/${slug}/${ultima}.webp`;
  }
  if (hoja) out.hoja = `${BASE}/personajes/nina-hoja.webp`;
  return out;
}

async function pagar(pedidoId: string, formato: "pdf" | "tapaDura", cookie?: string) {
  const r = await fetch(`${BASE}/api/checkout`, { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ pedidoId, formato, email: "prueba@example.com", idiomaWeb: "es" }) });
  const j = await json(r);
  if (!r.ok || !j.url) falla(`checkout: ${JSON.stringify(j)}`);
  if (String(j.url).includes("checkout.stripe.com")) {
    paso(`checkout de Stripe (modo prueba) creado: ${String(j.url).slice(0, 60)}…`);
    await pagarConStripe(j.url, formato);
    return "stripe";
  }
  const u = new URL(j.url);
  const s = u.searchParams.get("s")!;
  const pr = await fetch(`${BASE}/api/simulador/pagar`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ pedidoId, sessionId: s, formato, email: "prueba@example.com", nombre: "Cliente de Prueba", linea1: "Plaça de la Paeria 1", ciudad: "Lleida", cp: "25007", telefono: "600000000" }),
  });
  const pj = await json(pr);
  if (!pr.ok) falla(`simulador: ${JSON.stringify(pj)}`);
  paso(`pago simulado → webhook firmado respondió ${pj.webhook}`);
  return "simulador";
}

// Con claves sk_test_: completa Stripe Checkout con la tarjeta 4242 usando Playwright (sin probar aún:
// los selectores de Stripe pueden cambiar).
async function pagarConStripe(url: string, formato: "pdf" | "tapaDura") {
  // Playwright viene preinstalado en el entorno (no es dependencia del proyecto).
  const { chromium } = createRequire(import.meta.url)("playwright") as typeof import("node:module") & { chromium: { launch(): Promise<any> } };
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(url);
  await p.fill("#email", "prueba@example.com").catch(() => {});
  if (formato === "tapaDura") {
    await p.fill("#shippingName", "Cliente de Prueba");
    await p.fill("#shippingAddressLine1", "Plaça de la Paeria 1");
    await p.fill("#shippingPostalCode", "25007");
    await p.fill("#shippingLocality", "Lleida");
    await p.fill("#phoneNumber", "600000000").catch(() => {});
  }
  await p.fill("#cardNumber", "4242424242424242");
  await p.fill("#cardExpiry", "12 / 34");
  await p.fill("#cardCvc", "123");
  await p.fill("#billingName", "Cliente de Prueba").catch(() => {});
  await p.click("button[type=submit]");
  await p.waitForURL(/\/pedido\//, { timeout: 60_000 });
  await b.close();
  paso("pago con tarjeta de prueba 4242 completado en Stripe Checkout");
}

async function comprobarPdf(url: string, paginas: number, etiqueta: string, sangrado = false) {
  const r = await fetch(url);
  if (!r.ok) falla(`${etiqueta}: descarga ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const doc = await PDFDocument.load(buf);
  if (doc.getPageCount() !== paginas) falla(`${etiqueta}: ${doc.getPageCount()} páginas (esperadas ${paginas})`);
  const pg = doc.getPage(0);
  const { width } = pg.getMediaBox();
  if (sangrado) {
    const trim = pg.getTrimBox();
    if (!(trim.x > 0 && trim.width < width)) falla(`${etiqueta}: sin sangrado (TrimBox)`);
  }
  paso(`${etiqueta}: ${paginas} páginas, ${(buf.length / 1e6).toFixed(1)} MB, ${(width / (72 / 25.4)).toFixed(1)} mm de lado${sangrado ? " con sangrado" : ""}`);
  return buf.length;
}

async function crearBorrador(datos: Record<string, unknown>) {
  const r = await fetch(`${BASE}/api/cuentos`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(datos) });
  const j = await json(r);
  if (!r.ok) falla(`borrador: ${JSON.stringify(j)}`);
  return j.id as string;
}

async function main() {
  if (!ADMIN) falla("falta ADMIN_TOKEN");

  // 1 · Vista previa (cuento de tapa dura, en castellano, colección dormir)
  const id = await crearBorrador({ nombre: "Hugo", edad: 4, genero: "m", ciudad: "Zaragoza", companero: "gato", mascota: "Bigotes", mascotaDescripcion: "a ginger tabby cat with white paws", aficion: "dinosaurios", coleccion: "dormir", tema: "oscuridad", idioma: "es", deParteDe: "los abuelos" });
  paso(`borrador creado ${id}`);
  const vista = await (await fetch(`${BASE}/cuento/${id}`)).text();
  if (!vista.includes("Hugo y la luz de la luna")) falla("la vista previa no muestra el título");
  paso("vista previa con el nombre y 3 páginas (cuento de 18 páginas para 4 años)");
  const ret = await fetch(`${BASE}/api/cuentos/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ titulo: "Hugo y la luz de la luna", dedicatoria: "Para Hugo, el valiente de la casa." }) });
  if (!ret.ok) falla(`retoque del texto: ${ret.status} ${await ret.text()}`);
  const vista2 = await (await fetch(`${BASE}/cuento/${id}`)).text();
  if (!vista2.includes("el valiente de la casa")) falla("el retoque no se guardó");
  paso("retoque de la dedicatoria antes de pagar guardado");

  // 2 · Afiliada: alta, clic, aceptación de cookie
  const af = await json(await fetch(`${BASE}/api/afiliados`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nombre: "Mamá de Prueba", email: `afiliada${Date.now()}@example.com`, redSocial: "@mamadeprueba", acepto: "on" }) }));
  if (!af.codigo) falla(`alta afiliada: ${JSON.stringify(af)}`);
  const clic = await fetch(`${BASE}/r/${af.codigo}`, { redirect: "manual" });
  if (clic.status !== 302 || !clic.headers.get("location")?.includes(`ref=${af.codigo}`)) falla("el enlace de afiliada no redirige con ref");
  const acepta = await fetch(`${BASE}/api/afiliados/aceptar`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ codigo: af.codigo }) });
  const cookie = acepta.headers.get("set-cookie")?.split(";")[0];
  if (!cookie?.startsWith("afiliado=")) falla("no se instaló la cookie de afiliada");
  paso(`afiliada ${af.codigo}: enlace, clic contado y cookie aceptada`);

  // 3 · Pago (tapa dura) con la cookie de la afiliada
  const via = await pagar(id, "tapaDura", cookie);
  const pagado = await esperarEstado(id, ["ilustrando", "maquetando", "enviado_imprenta"]);
  paso(`webhook procesado → estado «${pagado.estado}» (vía ${via})`);

  // 4 · Encargo de ilustración y entrega del taller
  const pend = await json(await admin("/api/admin/pendientes"));
  const encargo = pend.pedidos?.find((p: { id: string }) => p.id === id);
  if (!encargo || encargo.trabajosIlustr.prompts.length !== 19) falla(`el encargo de ilustración no tiene 19 prompts (${encargo?.trabajosIlustr?.prompts?.length})`);
  paso("encargo de ilustración visible para el taller (portada + 18 páginas, hoja de serie)");
  const urls = await urlsIlustracionesMuestra("leo-y-la-luz-de-la-luna", 19);
  const entrega = await json(await admin(`/api/admin/pedidos/${id}/ilustraciones`, { method: "POST", body: JSON.stringify(urls) }));
  paso(`taller entrega 19 ilustraciones → estado «${entrega.estado}»`);
  const fin = await esperarEstado(id, ["enviado_imprenta"]);
  paso(`pedido enviado a la imprenta (${fin.estado})`);

  // 5 · Comprobaciones de archivos
  const resumen = await json(await admin("/api/admin/resumen?dias=1"));
  const html = await (await fetch(`${BASE}/pedido/${id}`)).text();
  const pdfUrl = html.match(/href="([^"]+\.pdf)"/)?.[1]?.replace(/&amp;/g, "&");
  if (!pdfUrl) falla("la página del pedido no enlaza el PDF");
  await comprobarPdf(pdfUrl!, 30, "PDF de lectura");
  const dirAlmacen = path.join("datos-locales", "almacen", "pedidos", id);
  if (existsSync(dirAlmacen)) {
    const interior = path.join(dirAlmacen, "interior.pdf");
    const doc = await PDFDocument.load(readFileSync(interior));
    const trim = doc.getPage(0).getTrimBox();
    if (doc.getPageCount() !== 28 || trim.x <= 0) falla("interior de imprenta incorrecto");
    paso(`interior de imprenta: 28 páginas con sangrado de ${(trim.x / (72 / 25.4)).toFixed(1)} mm; cubierta generada`);
  }
  const sim = path.join("datos-locales", "imprenta", `SIM-${id}.json`);
  if (existsSync(sim)) {
    const cuerpo = JSON.parse(readFileSync(sim, "utf8"));
    paso(`pedido a imprenta (modo simulado, sin clave de Gelato): ${cuerpo.orderType}, ${cuerpo.items[0].productUid.slice(0, 40)}…, envío a ${cuerpo.shippingAddress.city}`);
    informe.pedidoImprenta = cuerpo;
  } else paso(`pedido a imprenta creado en Gelato: ${JSON.stringify(fin)}`);
  const correos = existsSync("datos-locales/correos") ? readdirSync("datos-locales/correos").filter((f) => f.includes(id)) : [];
  paso(`correos: ${correos.length ? correos.join(", ") : "enviados por Resend"}`);
  const venta = resumen.afiliados?.find((a: { codigo: string }) => a.codigo === af.codigo);
  paso(`resumen: ${resumen.ventas} ventas hoy, comisiones ${(resumen.comisionesCents / 100).toFixed(2)} €; afiliada con ${venta?.clics} clic`);

  // 6 · Segundo pedido: solo PDF, en catalán, sin afiliada
  //     con aspecto y color propios, mejor amiga y detalle único → hoja de personaje propia del pedido
  const id2 = await crearBorrador({ nombre: "Martina", edad: 6, genero: "f", ciudad: "Lleida", companero: "perro", mascota: "Núvol", aficion: "dibujar", coleccion: "ciudad", tema: "curiosidad", idioma: "ca",
    arropa: "abuela", color: "verde", amigo: "Lucía", amigoGenero: "f", rasgo: "Colecciona pedres de colors", aspecto: { piel: "clara", pelo: "pelirrojo", peinado: "largo", gafas: true, pecas: true } });
  await pagar(id2, "pdf");
  await esperarEstado(id2, ["ilustrando"]);
  const pend2 = await json(await admin("/api/admin/pendientes"));
  const enc2 = pend2.pedidos?.find((p: { id: string }) => p.id === id2);
  if (!enc2?.trabajosIlustr?.hoja || enc2.trabajosIlustr.prompts.length !== 23 || enc2.faltan[0] !== "hoja") falla(`encargo con aspecto propio incorrecto: ${JSON.stringify(enc2?.faltan)}`);
  paso("encargo con aspecto propio: primero la hoja de personaje del pedido, después portada + 22 páginas");
  await admin(`/api/admin/pedidos/${id2}/ilustraciones`, { method: "POST", body: JSON.stringify(await urlsIlustracionesMuestra("la-martina-i-els-secrets-de-lleida", 23, true)) });
  const fin2 = await esperarEstado(id2, ["entregado"]);
  const html2 = await (await fetch(`${BASE}/ca/pedido/${id2}`)).text();
  const pdf2 = html2.match(/href="([^"]+\.pdf)"/)?.[1]?.replace(/&amp;/g, "&");
  if (pdf2) await comprobarPdf(pdf2, 30, "PDF de lectura en català (22 pàgines)");
  paso(`pedido PDF en catalán (22 páginas, 5–8 años) entregado (${fin2.estado})`);

  informe.fin = new Date().toISOString();
  informe.ok = true;
  writeFileSync("datos-locales/e2e.json", JSON.stringify(informe, null, 2));
  console.log("\nPRUEBA DE PUNTA A PUNTA: OK");
}

main().catch((e) => falla(String(e?.stack ?? e)));
