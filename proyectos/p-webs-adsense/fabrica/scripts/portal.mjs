// Portal de la familia Claro: una portada que manda a cada sitio según lo que le interesa al visitante,
// con un buscador de todas las calculadoras de todos los sitios. Se genera con los mismos datos que los sitios
// (sitio.json, contenido/*.md y familia.json), así que se mantiene solo.
//   node --experimental-strip-types scripts/portal.mjs   →   dist/portal/
// Variables: PORTAL_URL (dirección pública), LEGAL_NOM, LEGAL_NIF, LEGAL_EMAIL, LEGAL_ADRECA, UMAMI_ID_PORTAL, UMAMI_SRC.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { parse } from 'yaml';
import { icono } from '../src/lib/iconos.ts';

const familia = JSON.parse(readFileSync('familia.json', 'utf8'));
const URL_PORTAL = (process.env.PORTAL_URL || familia.portal.url).replace(/\/$/, '');
const NOMBRE = 'CalculaClaro';
const out = 'dist/portal';
const hoy = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const titular = {
  nombre: process.env.LEGAL_NOM || 'Moisés Mora',
  nif: process.env.LEGAL_NIF || 'PENDIENTE-NIF',
  email: process.env.LEGAL_EMAIL || 'hola@numimates.com',
  domicilio: process.env.LEGAL_ADRECA || 'Lleida (España)',
};

// Calculadoras de cada sitio activo, con su enlace público
const calcs = [];
const sitios = familia.sitios.map((s) => {
  const activo = s.estado === 'activo' && s.url && existsSync(`sitios/${s.id}/sitio.json`);
  const cfg = activo ? JSON.parse(readFileSync(`sitios/${s.id}/sitio.json`, 'utf8')) : null;
  const lista = [];
  if (cfg) {
    for (const id of cfg.calculadoras) {
      const md = readFileSync(`sitios/${s.id}/contenido/${id}.es.md`, 'utf8');
      const fm = parse(md.split(/^---$/m)[1]);
      const c = { id, sitio: s.nombre, h1: fm.h1, resumen: fm.resumen, clave: fm.palabraClave || '', url: `${s.url}/${fm.slug}/`, destacada: cfg.destacadas.includes(id) };
      lista.push(c);
      calcs.push(c);
    }
  }
  return { ...s, activo, cfg, lista };
});
const corto = (h1) => h1.replace(/^Calculadora (de |del |de la )?/i, '').replace(/^./, (x) => x.toUpperCase());
const masUsadas = sitios.flatMap((s) => s.lista.filter((c) => c.destacada).slice(0, 3));

const CSS = `
:root{--tinta:#0B1F17;--suave:#4A5C54;--borde:#D9E5DF;--tenue:#F2F7F4;--marca:#0E9F6E;--primario:#087A54;--acento:#FFD166;--fondo:#fff}
@font-face{font-family:Manrope;font-weight:700;font-display:optional;src:url(/_a/manrope-700.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:400;font-display:optional;src:url(/_a/inter-400.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:600;font-display:optional;src:url(/_a/inter-600.woff2) format('woff2')}
*,*::before,*::after{box-sizing:border-box}html,body{overflow-x:clip}
body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--primario)}h1,h2,h3{font-family:Manrope,Inter,system-ui,sans-serif;line-height:1.15;letter-spacing:-.02em;margin:0 0 .5em;text-wrap:balance}
.env{max-width:1120px;margin:0 auto;padding:0 16px}
:focus-visible{outline:3px solid var(--acento);outline-offset:2px;border-radius:4px}
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.cab{background:var(--tinta);color:#fff}.cab .env{display:flex;align-items:center;min-height:64px}
.logo{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font:700 1.2rem Manrope,Inter,system-ui,sans-serif;letter-spacing:-.02em}.logo b{color:#5fd3a7}
.portada{position:relative;isolation:isolate;color:#fff;padding:48px 0 56px}
.portada::before{content:"";position:absolute;inset:0;z-index:-2;background:var(--tinta);box-shadow:0 0 0 100vmax var(--tinta);clip-path:inset(0 -100vmax)}
.portada::after{content:"";position:absolute;z-index:-1;top:0;bottom:0;left:50%;width:100vw;margin-left:-50vw;background:radial-gradient(40% 70% at 70% 30%,rgba(14,159,110,.35),transparent 70%),radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px) 0 0/22px 22px;-webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent)}
.portada h1{font-size:clamp(2.2rem,1.3rem + 3.6vw,3.8rem);letter-spacing:-.035em;max-width:16ch}
.portada h1 em{font-style:normal;color:#7fe0bb}
.portada p{color:rgba(255,255,255,.78);font-size:1.12rem;max-width:56ch}
.buscar{position:relative;max-width:640px;margin-top:22px}
.buscar input{width:100%;font:inherit;font-size:1.1rem;padding:1rem 1.1rem 1rem 3rem;border-radius:16px;border:0;background:#fff;color:var(--tinta);box-shadow:0 20px 50px -20px rgba(0,0,0,.6)}
.buscar input:focus{outline:3px solid var(--acento)}
.buscar svg{position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--suave)}
.resultados{list-style:none;margin:8px 0 0;padding:6px;background:#fff;border-radius:16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.6);max-width:640px}
.resultados[hidden]{display:none}
.resultados a{display:flex;justify-content:space-between;gap:1rem;padding:.65rem .8rem;border-radius:10px;text-decoration:none;color:var(--tinta)}
.resultados a:hover,.resultados a:focus{background:var(--tenue)}
.resultados small{color:var(--suave);white-space:nowrap}
.sugerencias{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;font-size:.88rem}
.sugerencias a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:.3rem .8rem}
.sugerencias a:hover{background:rgba(255,255,255,.1)}
h2{font-size:clamp(1.35rem,1.1rem + 1vw,1.8rem);margin-top:2.4em}
.intereses{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.interes{position:relative;display:flex;flex-direction:column;gap:8px;height:100%;padding:20px;border-radius:20px;border:1px solid var(--borde);text-decoration:none;color:var(--tinta);transition:transform .18s,box-shadow .18s,border-color .18s}
a.interes:hover{transform:translateY(-3px);border-color:var(--marca);box-shadow:0 18px 40px -24px rgba(11,31,23,.6)}
.interes .ico-caja{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;color:var(--primario);background:#e6f5ee}
.interes strong{font:700 1.2rem Manrope,Inter,system-ui,sans-serif}
.interes .marca{font-size:.85rem;font-weight:600;color:var(--primario)}
.interes span{color:var(--suave);font-size:.92rem}
.interes.pronto{background:var(--tenue);border-style:dashed}.interes.pronto .marca{color:var(--suave)}
.etiqueta{position:absolute;top:18px;right:18px;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--suave)}
.top{list-style:none;margin:0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.top a{display:block;padding:14px 16px;border-radius:14px;border:1px solid var(--borde);text-decoration:none;color:var(--tinta);height:100%}
.top a:hover{border-color:var(--marca)}.top b{display:block}.top small{color:var(--suave)}
.todas{display:grid;gap:24px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.todas h3{font-size:1.05rem}.todas ul{list-style:none;margin:0;padding:0;columns:1}.todas li{margin:.2rem 0}
.todas a{text-decoration:none;font-size:.94rem}.todas a:hover{text-decoration:underline}
.pie{margin-top:56px;background:var(--tinta);color:rgba(255,255,255,.72);font-size:.88rem}.pie .env{padding:28px 16px 36px}
.pie a{color:rgba(255,255,255,.85)}.pie p{margin:.3rem 0}
.legal{max-width:760px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const marca = `<svg viewBox="0 0 56 56" width="32" height="32" aria-hidden="true"><path d="M44 16a20 20 0 1 0 0 24" stroke="#0E9F6E" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="#fff"/></svg>`;
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="#fff"/><path d="M44 16a20 20 0 1 0 0 24" stroke="#0E9F6E" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="#0B1F17"/></svg>')}`;
const umami = process.env.UMAMI_ID_PORTAL ? `<script defer src="${esc(process.env.UMAMI_SRC || 'https://cloud.umami.is/script.js')}" data-website-id="${esc(process.env.UMAMI_ID_PORTAL)}" data-do-not-track="true"></script>` : '';

function pagina({ ruta, titulo, descripcion, cuerpo, jsonld = [] }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title><meta name="description" content="${esc(descripcion)}"><link rel="canonical" href="${URL_PORTAL}${ruta}">
<meta name="theme-color" content="#0B1F17"><meta property="og:type" content="website"><meta property="og:site_name" content="${NOMBRE}"><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descripcion)}"><meta property="og:url" content="${URL_PORTAL}${ruta}"><meta property="og:locale" content="es_ES">
<link rel="icon" href="${favicon}" type="image/svg+xml"><link rel="preload" href="/_a/manrope-700.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/_a/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS.replace(/\n/g, '')}</style>${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')}${umami}</head><body>
<header class="cab"><div class="env"><a class="logo" href="/" aria-label="${NOMBRE}: inicio">${marca}<span>Calcula<b>Claro</b></span></a></div></header>
<main id="contenido" class="env">${cuerpo}</main>
<footer class="pie"><div class="env"><p><strong style="color:#fff">${NOMBRE}</strong> · Números claros, sin letra pequeña. La puerta de entrada a ${sitios.filter((s) => s.activo).map((s) => esc(s.nombre)).join(', ')}.</p>
<p>Calculadoras gratis y orientativas, con el método y las fuentes oficiales publicados en cada una. Hecho en Lleida.</p>
<p>© ${hoy.slice(0, 4)} ${esc(titular.nombre)} · <a href="/aviso-legal/">Aviso legal y privacidad</a></p></div></footer></body></html>`;
}

const filaInteres = (s) => {
  const dentro = `<span class="ico-caja">${icono(s.icono, 24)}</span><strong>${esc(s.interes.es)}</strong><span class="marca">${esc(s.nombre)}${s.activo ? ` · ${s.lista.length} calculadoras` : ''}</span><span>${esc(s.para.es)}</span>`;
  return s.activo
    ? `<li><a class="interes" href="${s.url}/">${dentro}</a></li>`
    : `<li><div class="interes pronto"><span class="etiqueta">Muy pronto</span>${dentro}</div></li>`;
};

const indice = calcs.map((c) => ({ t: c.h1, s: c.sitio, u: c.url, k: `${c.h1} ${c.clave} ${c.resumen}` }));
const sugerencias = ['sueldo neto', 'finiquito', 'IVA', 'cuota de autónomos', 'cheque de pago', 'paro'];
const BUSCADOR = `(function(){var D=${JSON.stringify(indice)};var n=function(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')};D.forEach(function(d){d.n=n(d.k)});
var i=document.getElementById('q'),r=document.getElementById('res');function pinta(){var q=n(i.value.trim());if(q.length<2){r.hidden=true;r.innerHTML='';return}
var p=q.split(/\\s+/),m=D.filter(function(d){return p.every(function(x){return d.n.indexOf(x)>=0})}).slice(0,8);
r.innerHTML=m.length?m.map(function(d){return '<li><a href="'+d.u+'">'+d.t.replace(/[<&]/g,'')+' <small>'+d.s+'</small></a></li>'}).join(''):'<li><a href="#todas">Sin resultados: mira todas las calculadoras ↓</a></li>';r.hidden=false}
i.addEventListener('input',pinta);document.querySelectorAll('[data-q]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();i.value=a.dataset.q;pinta();i.focus()})})})();`;

const portada = pagina({
  ruta: '/',
  titulo: `${NOMBRE}: calculadoras de sueldo, impuestos y dinero con datos oficiales`,
  descripcion: `Encuentra la calculadora que necesitas entre ${calcs.length}: sueldo neto, finiquito, paro, renta, IVA, autónomos y cheque de pago en EE. UU. Gratis, sin registro y con el método publicado.`,
  jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NOMBRE, url: `${URL_PORTAL}/`, inLanguage: 'es' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Sitios de la familia Claro', itemListElement: sitios.filter((s) => s.activo).map((s, k) => ({ '@type': 'ListItem', position: k + 1, name: s.nombre, url: `${s.url}/` })) }],
  cuerpo: `<section class="portada"><h1>¿Qué quieres <em>calcular</em> hoy?</h1>
<p>${calcs.length} calculadoras gratis de sueldo, impuestos y dinero, con los datos oficiales y el método a la vista. Escribe lo que buscas o elige por lo que te interesa.</p>
<div class="buscar" role="search"><label class="vh" for="q">Buscar una calculadora</label>${icono('calculadora', 22)}<input id="q" type="search" autocomplete="off" placeholder="Por ejemplo: sueldo neto, IVA, finiquito…"></div>
<ul id="res" class="resultados" hidden aria-live="polite"></ul>
<p class="sugerencias">${sugerencias.map((s) => `<a href="#todas" data-q="${esc(s)}">${esc(s)}</a>`).join('')}</p></section>
<h2>Elige por lo que te interesa</h2><ul class="intereses">${sitios.map(filaInteres).join('')}</ul>
<h2>Las más usadas</h2><ul class="top">${masUsadas.map((c) => `<li><a href="${c.url}"><b>${esc(corto(c.h1))}</b><small>${esc(c.sitio)}</small></a></li>`).join('')}</ul>
<h2 id="todas">Todas las calculadoras</h2><div class="todas">${sitios.filter((s) => s.activo).map((s) => `<section><h3><a href="${s.url}/">${esc(s.nombre)}</a> · ${esc(s.interes.es)}</h3><ul>${s.lista.map((c) => `<li><a href="${c.url}">${esc(corto(c.h1))}</a></li>`).join('')}</ul></section>`).join('')}</div>
<script>${BUSCADOR}</script>`,
});

const aviso = pagina({
  ruta: '/aviso-legal/',
  titulo: `Aviso legal y privacidad · ${NOMBRE}`,
  descripcion: `Titular, condiciones de uso y privacidad de ${NOMBRE}.`,
  cuerpo: `<div class="legal"><h1 style="margin-top:1.4em">Aviso legal y privacidad</h1>
<p>En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI), este sitio es titularidad de <strong>${esc(titular.nombre)}</strong>, con NIF ${esc(titular.nif)} y domicilio en ${esc(titular.domicilio)}. Contacto: <a href="mailto:${esc(titular.email)}">${esc(titular.email)}</a>.</p>
<p>${NOMBRE} es un índice de calculadoras gratuitas de la familia Claro. Cada calculadora está en su propio sitio, con su aviso legal, su política de privacidad y su método. Los resultados son orientativos y no sustituyen el asesoramiento de un profesional.</p>
<h2>Privacidad</h2><p>Esta página no usa cookies ni pide datos personales. El buscador funciona en tu navegador: lo que escribes no se envía a ningún sitio. Si está activa, la analítica (Umami) es anónima y no usa cookies. Puedes ejercer tus derechos escribiendo a ${esc(titular.email)} y reclamar ante la AEPD (aepd.es).</p>
<p>El código y los borradores de los textos se preparan con ayuda de inteligencia artificial; las cifras salen de la normativa y de pruebas automáticas.</p></div>`,
});

rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/_a`, { recursive: true });
mkdirSync(`${out}/aviso-legal`, { recursive: true });
writeFileSync(`${out}/index.html`, portada);
writeFileSync(`${out}/aviso-legal/index.html`, aviso);
writeFileSync(`${out}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${URL_PORTAL}/sitemap.xml\n`);
writeFileSync(`${out}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/aviso-legal/'].map((r) => `<url><loc>${URL_PORTAL}${r}</loc><lastmod>${hoy}</lastmod></url>`).join('')}</urlset>\n`);
writeFileSync(`${out}/404.html`, pagina({ ruta: '/404', titulo: `No encontrada · ${NOMBRE}`, descripcion: 'Página no encontrada', cuerpo: '<h1 style="margin-top:1.4em">Esta página no existe</h1><p><a href="/">Vuelve al buscador de calculadoras</a>.</p>' }));
const F = 'node_modules/@fontsource';
copyFileSync(`${F}/manrope/files/manrope-latin-700-normal.woff2`, `${out}/_a/manrope-700.woff2`);
copyFileSync(`${F}/inter/files/inter-latin-400-normal.woff2`, `${out}/_a/inter-400.woff2`);
copyFileSync(`${F}/inter/files/inter-latin-600-normal.woff2`, `${out}/_a/inter-600.woff2`);
writeFileSync(`${out}/_headers`, '/_a/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`portal: ${calcs.length} calculadoras de ${sitios.filter((s) => s.activo).length} sitios → ${out}`);
