// Prueba de punta a punta del widget con Playwright: una web «externa» (otro origen) incrusta las calculadoras con
// embed.js y se comprueba que el iframe ajusta su altura sin barras de scroll, que recalcula, que el tema y el color
// llegan, que la marca blanca quita el enlace solo desde el dominio del cliente y que las cabeceras dejan incrustar
// /embed/ y no el resto. Deja capturas en CAPTURAS (o en ./informes/capturas).
//   SITIO=nomina npx astro build && node scripts/prueba-widget.mjs nomina
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const sitio = process.argv[2] || 'nomina';
const CAP = process.env.CAPTURAS || 'informes/capturas';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
let pw;
try { pw = await import('playwright'); } catch { pw = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const CLAVE_DEMO = '8227d517ef8da1c04fb6a272'; // demo-local:localhost (widget-clientes.json)

// Servidor del sitio con las mismas cabeceras de marco que vercel.json / _headers
function servirSitio(dir, puerto) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      const ruta = decodeURIComponent(req.url.split('?')[0]);
      let p = join(dir, ruta);
      try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); } catch { res.writeHead(404); return res.end(); }
      const embed = /^\/(ca\/)?embed\//.test(ruta);
      const h = { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream', 'Content-Security-Policy': embed ? 'frame-ancestors *' : "frame-ancestors 'self'" };
      if (!embed) h['X-Frame-Options'] = 'SAMEORIGIN';
      try { const b = await readFile(p); res.writeHead(200, h); res.end(b); } catch { res.writeHead(404); res.end(); }
    }).listen(puerto, () => ok(s));
  });
}
// Web externa: un blog o una gestoría que pega el fragmento
function servirExterna(puerto, base, rutas) {
  const html = (q) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gestoría Ejemplo</title>
<style>body{font:16px/1.5 Georgia,serif;margin:0;background:#f6f3ee;color:#222}header{background:#1d3557;color:#fff;padding:18px 20px}header b{font-size:1.3rem}main{max-width:820px;margin:0 auto;padding:20px 16px}article p{max-width:65ch}.pie{padding:30px 20px;background:#e9e4da;margin-top:30px}</style></head>
<body><header><b>Gestoría Ejemplo</b> · Asesoría laboral y fiscal en Lleida</header><main><article><h1>¿Cuánto cobrarás en neto?</h1><p>Usa nuestra calculadora para estimar tu sueldo neto. Si tienes dudas, pide cita.</p>
${q.map((x, i) => `<div id="w${i}" data-claro="${base}/${x}" data-titulo="Calculadora"></div>`).join('\n<p>Texto de la web entre widgets.</p>\n')}
<p>Fin del artículo.</p></article></main><div class="pie">Pie de la web externa</div><script src="${base}/embed.js" async></script></body></html>`;
  return new Promise((ok) => {
    const s = createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      const q = (u.searchParams.get('w') || rutas[0]).split('|');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html(q));
    }).listen(puerto, () => ok(s));
  });
}

let fallos = 0;
const ok = (c, m) => { console.log(`${c ? 'OK   ' : 'FALLO'} ${m}`); if (!c) fallos++; };
await mkdir(CAP, { recursive: true });
const PS = 4610, PE = 4611;
const srv = await servirSitio(`dist/${sitio}`, PS);
const slug = { nomina: 'calculadora-sueldo-neto', impuestos: 'calculadora-irpf', vivienda: 'simulador-hipoteca', eeuu: 'calculadora-cheque-de-pago' }[sitio];
const ext = await servirExterna(PE, `http://localhost:${PS}`, [`embed/${slug}/`]);
const nav = await pw.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function altoYScroll(pag, sel) {
  const f = await (await pag.$(`${sel} iframe`)).contentFrame();
  await f.waitForSelector('.res-val');
  await pag.waitForTimeout(400);
  const alto = await pag.$eval(`${sel} iframe`, (i) => parseFloat(i.style.height));
  const dentro = await f.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight, cuerpo: Math.ceil(document.querySelector('.emb').getBoundingClientRect().height) }));
  return { f, alto, dentro };
}

try {
  // 1 · Versión gratis en una web externa (localhost:4611 → localhost:4610 es otro origen), móvil
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pag = await ctx.newPage();
  await pag.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`embed/${slug}/?color=1d3557|embed/${slug}/?tema=oscuro&color=e76f51`)}`);
  let { f, alto, dentro } = await altoYScroll(pag, '#w0');
  ok(alto !== 680 && Math.abs(alto - dentro.cuerpo) <= 20, `la altura se ajusta al contenido (iframe ${alto}px, contenido ${dentro.cuerpo}px)`);
  ok(dentro.sh <= dentro.ch + 1, `sin barra de scroll dentro del iframe (scrollHeight ${dentro.sh} ≤ ${dentro.ch})`);
  ok(await f.$('.emb-firma a') !== null, 'versión gratis: enlace «Calculadora de …» visible');
  const firma = await f.$eval('.emb-firma a', (a) => ({ t: a.textContent.trim(), rel: a.getAttribute('rel'), href: a.href }));
  ok(/^Calculadora de \w+Claro$/.test(firma.t) && !firma.rel, `enlace follow sin rel: «${firma.t}» → ${firma.href}`);
  ok(await f.$('header, footer, .cab, .pie, ins.adsbygoogle') === null, 'sin cabecera, pie ni anuncios');
  ok(await f.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primario').trim()) === '#1d3557', '?color= cambia el color de acento');
  const antes = await f.$eval('.res-val', (e) => e.textContent);
  const campo = await f.$('input[type=number]');
  await campo.fill('52000'); await campo.dispatchEvent('input');
  await pag.waitForTimeout(700);
  const despues = await f.$eval('.res-val', (e) => e.textContent);
  ok(antes !== despues, `recalcula al escribir (${antes} → ${despues})`);
  await f.click('.grupo-fam summary').catch(() => {});
  await pag.waitForTimeout(600);
  const alto2 = await pag.$eval('#w0 iframe', (i) => parseFloat(i.style.height));
  ok(alto2 > alto, `la altura sigue al contenido al abrir la sección familiar (${alto} → ${alto2}px)`);
  await f.click('.grupo-fam summary').catch(() => {});
  await pag.waitForTimeout(600);
  await pag.screenshot({ path: `${CAP}/widget-web-externa-movil.png`, fullPage: true });
  const r1 = await altoYScroll(pag, '#w1');
  ok(await r1.f.evaluate(() => document.documentElement.dataset.tema) === 'oscuro', '?tema=oscuro aplica el tema oscuro');
  ok(await r1.f.evaluate(() => getComputedStyle(document.body).backgroundColor) !== 'rgb(255, 255, 255)', 'fondo oscuro en tema oscuro');
  await ctx.close();

  // 2 · Escritorio, valores iniciales por URL
  const ctx2 = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`embed/${slug}/?color=1d3557`)}`);
  await altoYScroll(p2, '#w0');
  await p2.screenshot({ path: `${CAP}/widget-web-externa.png`, fullPage: true });
  const campos = await (await (await p2.$('#w0 iframe')).contentFrame()).$$eval('input[type=number]', (xs) => xs.map((x) => x.name));
  const p2b = await ctx2.newPage();
  await p2b.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`embed/${slug}/?${campos[0]}=45000`)}`);
  const r2 = await altoYScroll(p2b, '#w0');
  ok(await r2.f.$eval(`[name="${campos[0]}"]`, (x) => x.value) === '45000', `valor inicial por URL (?${campos[0]}=45000)`);

  // 3 · Marca blanca: clave válida desde localhost (dominio del cliente demo) → sin enlace, con logo y su color
  const p3 = await ctx2.newPage();
  await p3.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`embed/${slug}/?pro=${CLAVE_DEMO}`)}`);
  const r3 = await altoYScroll(p3, '#w0');
  ok(await r3.f.$('.emb-firma') === null, 'marca blanca: el enlace desaparece');
  ok(await r3.f.$('.emb-logo img') !== null, 'marca blanca: aparece el logo del cliente');
  ok(await r3.f.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primario').trim()) === '#6d28d9', 'marca blanca: color del cliente');
  await p3.screenshot({ path: `${CAP}/widget-marca-blanca.png`, fullPage: true });

  // 4 · La misma clave desde otro dominio (127.0.0.1 no es localhost) → se queda el enlace
  const p4 = await ctx2.newPage();
  await p4.goto(`http://127.0.0.1:${PE}/?w=${encodeURIComponent(`embed/${slug}/?pro=${CLAVE_DEMO}`)}`);
  const r4 = await altoYScroll(p4, '#w0');
  ok(await r4.f.$('.emb-firma a') !== null, 'clave usada desde otro dominio: el enlace se mantiene');
  const p5 = await ctx2.newPage();
  await p5.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`embed/${slug}/?pro=000000000000000000000000`)}`);
  const r5 = await altoYScroll(p5, '#w0');
  ok(await r5.f.$('.emb-firma a') !== null, 'clave inventada: el enlace se mantiene');

  // 5 · Cabeceras: una página normal del sitio no se deja incrustar en otra web
  const p6 = await ctx2.newPage();
  await p6.goto(`http://localhost:${PE}/?w=${encodeURIComponent(`${slug}/`)}`);
  await p6.waitForTimeout(1200);
  const fr = await (await p6.$('#w0 iframe')).contentFrame();
  const cargada = await fr.evaluate(() => !!document.querySelector('.calc')).catch(() => false);
  ok(!cargada, 'la calculadora completa (fuera de /embed/) no se carga dentro de un iframe ajeno');
  await ctx2.close();
} finally {
  await nav.close(); srv.close(); ext.close();
}
console.log(fallos ? `${fallos} comprobaciones fallidas` : 'Widget: todo correcto');
process.exit(fallos ? 1 : 0);
