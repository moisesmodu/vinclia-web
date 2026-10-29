// Imágenes para compartir (Open Graph, 1200×630) de cada sitio, en cada idioma, y del portal.
// Se generan una vez (o cuando cambie la marca o las cifras) con una plantilla HTML capturada con Playwright:
//   node scripts/og.mjs   →   public/og/<sitio>[-ca].jpg y public/og/portal.jpg
// JPEG de calidad alta: pesa menos de 300 kB, el límite de WhatsApp para mostrar la vista previa grande.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const familia = JSON.parse(readFileSync('familia.json', 'utf8'));
// En línea (data:) porque una página creada con setContent no puede leer file://
const archivo = (p) => `data:${p.endsWith('.webp') ? 'image/webp' : 'font/woff2'};base64,${readFileSync(p).toString('base64')}`;
const F = 'node_modules/@fontsource';
const fuentes = `@font-face{font-family:Manrope;font-weight:700;src:url(${archivo(`${F}/manrope/files/manrope-latin-700-normal.woff2`)})}
@font-face{font-family:Inter;font-weight:400;src:url(${archivo(`${F}/inter/files/inter-latin-400-normal.woff2`)})}
@font-face{font-family:Inter;font-weight:600;src:url(${archivo(`${F}/inter/files/inter-latin-600-normal.woff2`)})}`;

function formato(v, f, locale, moneda) {
  if (f === 'pct') return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v) + (locale.endsWith('-US') ? '%' : ' %');
  const dec = f === 'eur' && !Number.isInteger(v) ? 2 : 0;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: moneda, minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
}

function plantilla({ fondo, marca, partes, titulo, texto, chips, ilu, pie }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fuentes}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:${fondo};color:#fff;font:400 24px Inter,sans-serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(45% 70% at 78% 45%,color-mix(in srgb,${marca} 34%,transparent),transparent 70%),radial-gradient(rgba(255,255,255,.07) 1.4px,transparent 1.6px) 0 0/26px 26px}
.ilu{position:absolute;right:-40px;top:40px;width:560px;height:560px;-webkit-mask-image:radial-gradient(closest-side,#000 60%,transparent 100%)}
.txt{position:absolute;left:72px;top:64px;width:640px}
.logo{display:flex;align-items:center;gap:14px;font:700 34px Manrope,sans-serif;letter-spacing:-.02em}
.logo b{color:color-mix(in srgb,${marca} 65%,#fff)}
h1{font:700 64px/1.04 Manrope,sans-serif;letter-spacing:-.04em;margin-top:54px}
h1 em{font-style:normal;color:color-mix(in srgb,${marca} 55%,#fff)}
p{margin-top:22px;font-size:25px;line-height:1.4;color:rgba(255,255,255,.78);max-width:600px}
.chips{position:absolute;left:72px;bottom:60px;display:flex;gap:12px}
.chip{background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.14);border-radius:18px;padding:12px 18px}
.chip small{display:block;font:600 15px Inter,sans-serif;color:rgba(255,255,255,.7)}
.chip b{display:block;font:700 30px Manrope,sans-serif;letter-spacing:-.03em;color:color-mix(in srgb,${marca} 50%,#fff)}
.pie{position:absolute;right:56px;bottom:30px;font:600 17px Inter,sans-serif;color:rgba(255,255,255,.6);letter-spacing:.06em;text-transform:uppercase}
.barra{position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,${marca},#FFD166)}
</style></head><body><div class="glow"></div><img class="ilu" src="${ilu}">
<div class="txt"><div class="logo"><svg viewBox="0 0 56 56" width="52" height="52"><path d="M44 16a20 20 0 1 0 0 24" stroke="${marca}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="#fff"/></svg><span>${partes[0]}<b>${partes[1]}</b></span></div>
<h1>${titulo}</h1><p>${texto}</p></div>
<div class="chips">${chips.map((c) => `<div class="chip"><small>${c.e}</small><b>${c.v}</b></div>`).join('')}</div>
<div class="pie">${pie}</div><div class="barra"></div></body></html>`;
}

const trabajos = [];
for (const s of familia.sitios.filter((x) => x.estado === 'activo' && existsSync(`sitios/${x.id}/sitio.json`))) {
  const cfg = JSON.parse(readFileSync(`sitios/${s.id}/sitio.json`, 'utf8'));
  const pais = JSON.parse(readFileSync(`params/${cfg.pais}/pais.json`, 'utf8'));
  const P = { laboral: JSON.parse(readFileSync(`params/${cfg.pais}/${cfg.anioPorDefecto}/laboral.json`, 'utf8')), fiscal: JSON.parse(readFileSync(`params/${cfg.pais}/${cfg.anioPorDefecto}/fiscal.json`, 'utf8')) };
  const leer = (ruta) => ruta.split('.').reduce((o, k) => o?.[k], P);
  for (const lang of cfg.idiomas) {
    const t = (x) => (x?.[lang] ?? x?.es ?? '');
    const chips = (cfg.cifras ?? []).slice(0, 3).map((c) => ({ e: t(c.e), v: formato(leer(c.p), c.f, pais.locales[lang], pais.moneda) }));
    const dom = cfg.dominio.replace(/^https?:\/\//, '');
    trabajos.push({ salida: `public/og/${s.id}${lang === 'es' ? '' : '-' + lang}.jpg`, html: plantilla({
      fondo: cfg.colores.cabecera, marca: cfg.colores.marca, partes: cfg.marcaClaro.partes,
      titulo: t(cfg.heroe.titulo), texto: t(cfg.lema) + '.', chips, ilu: archivo(`public/img/heroe-${s.id}-800.webp`),
      pie: `${dom} · ${lang === 'ca' ? 'Família Claro' : 'Familia Claro'}`,
    }) });
  }
}
trabajos.push({ salida: 'public/og/portal.jpg', html: plantilla({
  fondo: '#0B1F17', marca: '#0E9F6E', partes: ['Calcula', 'Claro'],
  titulo: '¿Qué quieres <em>calcular</em> hoy?', texto: 'Calculadoras gratis de sueldo, impuestos y dinero, con datos oficiales y el método a la vista.',
  chips: familia.sitios.filter((x) => x.estado === 'activo').map((x) => ({ e: x.interes.es.split(',')[0], v: x.nombre })),
  ilu: archivo('public/img/heroe-portal-800.webp'), pie: 'calculaclaro · Familia Claro',
}) });

mkdirSync('public/og', { recursive: true });
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1200, height: 630 } });
for (const t of trabajos) {
  await pag.setContent(t.html, { waitUntil: 'load' });
  await pag.evaluate(() => document.fonts.ready);
  await pag.screenshot({ path: t.salida, type: 'jpeg', quality: 86 });
  console.log('og:', t.salida);
}
await nav.close();
