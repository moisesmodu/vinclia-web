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
const masUsadas = sitios.flatMap((s) => s.lista.filter((c) => c.destacada).slice(0, 3).map((c) => ({ ...c, marca: s.cfg.colores.marca })));
const activos = sitios.filter((s) => s.activo);
const idiomas = new Set(activos.flatMap((s) => s.idiomas));

const CSS = `
:root{--tinta:#0B1F17;--suave:#4A5C54;--borde:#D9E5DF;--tenue:#F2F7F4;--marca:#0E9F6E;--primario:#087A54;--acento:#FFD166;--fondo:#fff;--sup:#fff;--oscuro:#0B1F17}
@media (prefers-color-scheme:dark){:root{--tinta:#e8efeb;--suave:#a5b2ab;--borde:#2a3631;--tenue:#16201c;--primario:#5fd3a7;--fondo:#0f1513;--sup:#18211d;--oscuro:#0a1411}}
@font-face{font-family:Manrope;font-weight:700;font-display:optional;src:url(/_a/manrope-700.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:400;font-display:optional;src:url(/_a/inter-400.woff2) format('woff2')}
@font-face{font-family:Inter;font-weight:600;font-display:optional;src:url(/_a/inter-600.woff2) format('woff2')}
*,*::before,*::after{box-sizing:border-box}html,body{overflow-x:clip}html{scroll-padding-top:80px}
body{margin:0;background:var(--fondo);color:var(--tinta);font:16px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
img,svg{display:block;max-width:100%}
a{color:var(--primario);text-underline-offset:.18em}h1,h2,h3{font-family:Manrope,Inter,system-ui,sans-serif;line-height:1.15;letter-spacing:-.02em;margin:0 0 .5em;text-wrap:balance}
.env{max-width:1120px;margin:0 auto;padding:0 16px}
:focus-visible{outline:3px solid var(--primario);outline-offset:2px;border-radius:6px}
.cab :focus-visible,.portada :focus-visible,.pie :focus-visible{outline-color:var(--acento)}
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.saltar{position:absolute;left:-999px;top:0}.saltar:focus{left:8px;top:8px;background:#fff;color:#0B1F17;padding:.5rem 1rem;z-index:40}
.cab{position:sticky;top:0;z-index:30;background:var(--oscuro);color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}
.cab .env{display:flex;align-items:center;gap:8px;min-height:64px}
.logo{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font:700 1.2rem Manrope,Inter,system-ui,sans-serif;letter-spacing:-.02em;margin-right:auto}.logo b{color:#5fd3a7}
.cab nav{display:none;gap:2px}
@media (min-width:760px){.cab nav{display:flex}}
.cab nav a{color:rgba(255,255,255,.8);text-decoration:none;font-weight:600;font-size:.92rem;padding:.42rem .8rem;border-radius:999px}
.cab nav a:hover{color:#fff;background:rgba(255,255,255,.08)}
.portada{position:relative;isolation:isolate;color:#fff;padding:40px 0 64px;display:grid;gap:24px}
.portada::before{content:"";position:absolute;inset:0;z-index:-2;background:var(--oscuro);box-shadow:0 0 0 100vmax var(--oscuro);clip-path:inset(0 -100vmax)}
.portada::after{content:"";position:absolute;z-index:-1;top:0;bottom:0;left:50%;width:100vw;margin-left:-50vw;background:radial-gradient(38% 70% at 78% 35%,rgba(14,159,110,.3),transparent 70%),radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px) 0 0/22px 22px;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}
@media (min-width:960px){.portada{grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);align-items:center;padding:64px 0 96px}}
.eyebrow{display:inline-block;font-weight:600;font-size:.82rem;color:#9be8c9;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);border-radius:999px;padding:.22rem .75rem;margin:0 0 .9rem}
.portada h1{font-size:clamp(2.4rem,1.3rem + 4vw,4.3rem);letter-spacing:-.04em;line-height:1.02;max-width:14ch}
.portada h1 em{font-style:normal;color:#7fe0bb;background:linear-gradient(transparent 72%,rgba(255,209,102,.55) 72%,rgba(255,209,102,.55) 92%,transparent 92%)}
.portada-txt>p{color:rgba(255,255,255,.78);font-size:1.12rem;max-width:54ch}
.ilu{display:none}
@media (min-width:960px){.ilu{display:block;justify-self:end;width:100%;max-width:440px}.ilu img{width:100%;height:auto;-webkit-mask-image:radial-gradient(closest-side,#000 60%,transparent 100%);mask-image:radial-gradient(closest-side,#000 60%,transparent 100%)}}
.buscar{position:relative;max-width:640px;margin-top:24px}
.caja{position:relative;display:flex;align-items:center;background:#fff;border-radius:18px;box-shadow:0 0 0 1px rgba(255,255,255,.2),0 0 0 6px rgba(95,211,167,.12),0 24px 60px -24px rgba(0,0,0,.7);transition:box-shadow .2s}
.caja:focus-within{box-shadow:0 0 0 2px #5fd3a7,0 0 0 8px rgba(95,211,167,.22),0 24px 60px -24px rgba(0,0,0,.7)}
.caja svg{position:absolute;left:1.05rem;color:#4A5C54;pointer-events:none}
.caja input{flex:1;min-width:0;font:inherit;font-size:1.1rem;padding:1.05rem 1rem 1.05rem 3.2rem;border:0;border-radius:18px;background:transparent;color:#0B1F17;outline:none;-webkit-appearance:none;appearance:none}
.caja input::placeholder{color:#5d6e67}
.caja kbd{display:none;margin-right:14px;font:600 .78rem Inter,system-ui,sans-serif;color:#4A5C54;border:1px solid #D9E5DF;border-bottom-width:2px;border-radius:6px;padding:.1rem .45rem}
@media (min-width:760px){.caja kbd{display:block}}
.resultados{list-style:none;margin:10px 0 0;padding:6px;background:#fff;border-radius:16px;box-shadow:0 24px 60px -24px rgba(0,0,0,.7);max-width:640px;position:absolute;left:0;right:0;z-index:5}
.resultados[hidden]{display:none}
.resultados a{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.65rem .8rem;border-radius:10px;text-decoration:none;color:#0B1F17;font-weight:600}
.resultados a:hover,.resultados a:focus,.resultados a.sel{background:#F2F7F4}
.resultados small{font-weight:600;font-size:.75rem;white-space:nowrap;border-radius:999px;padding:.1rem .55rem;background:#E6F5EE;color:#06603F}
.sugerencias{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:16px;font-size:.88rem;color:rgba(255,255,255,.65)}
.sugerencias a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:.32rem .85rem;transition:background .15s}
.sugerencias a:hover{background:rgba(255,255,255,.1)}
.cifras{list-style:none;margin:28px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:10px 28px}
.cifras li{display:flex;flex-direction:column}.cifras b{font:700 1.6rem Manrope,Inter,system-ui,sans-serif;letter-spacing:-.03em;color:#fff}.cifras span{font-size:.82rem;color:rgba(255,255,255,.65)}
.titulo{font-size:clamp(1.4rem,1.15rem + 1vw,1.9rem);letter-spacing:-.025em;margin:2.6em 0 .9rem}
.intereses{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.interes{position:relative;isolation:isolate;overflow:hidden;display:flex;flex-direction:column;gap:8px;height:100%;padding:22px;border-radius:22px;border:1px solid var(--borde);background:var(--sup);text-decoration:none;color:var(--tinta);transition:transform .18s,box-shadow .18s,border-color .18s}
.interes::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:var(--c)}
.interes::after{content:"";position:absolute;z-index:-1;right:-60px;top:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--c) 18%,transparent),transparent)}
a.interes:hover{transform:translateY(-3px);border-color:var(--c);box-shadow:0 22px 44px -26px rgba(11,31,23,.6)}
.interes .ico{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;color:var(--c);background:color-mix(in srgb,var(--c) 13%,var(--sup))}
.interes strong{font:700 1.2rem/1.25 Manrope,Inter,system-ui,sans-serif;letter-spacing:-.015em}
.interes .marca{font-size:.85rem;font-weight:600;color:var(--suave)}.interes .marca b{color:var(--tinta)}
.interes .para{color:var(--suave);font-size:.92rem}
.interes ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.interes li{font-size:.78rem;font-weight:600;border-radius:999px;padding:.12rem .6rem;background:var(--tenue);color:var(--suave)}
.interes .ir{position:absolute;top:20px;right:20px;color:var(--suave);transition:transform .18s}
a.interes:hover .ir{transform:translateX(3px);color:var(--c)}
.interes.pronto{background:var(--tenue);border-style:dashed}.interes.pronto::before{opacity:.35}
.etiqueta{position:absolute;top:20px;right:20px;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--suave);border:1px solid var(--borde);border-radius:999px;padding:.08rem .55rem}
.top{list-style:none;margin:0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.top a{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid var(--borde);background:var(--sup);text-decoration:none;color:var(--tinta);height:100%;transition:border-color .15s,transform .15s}
.top a:hover{border-color:var(--c);transform:translateY(-2px)}.top a>span:first-child{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:12px;color:var(--c);background:color-mix(in srgb,var(--c) 12%,var(--sup))}
.top b{display:block;line-height:1.3}.top small{color:var(--suave)}
.todas{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))}
.todas section{border:1px solid var(--borde);border-radius:20px;padding:18px 20px;background:var(--sup)}
.todas h3{font-size:1.05rem;display:flex;align-items:baseline;gap:.5rem;flex-wrap:wrap}.todas h3 span{font:400 .85rem Inter,system-ui,sans-serif;color:var(--suave)}
.todas ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.todas a{display:block;text-decoration:none;font-size:.94rem;padding:.3rem .4rem;margin:0 -.4rem;border-radius:8px;color:var(--tinta)}.todas a:hover{background:var(--tenue);color:var(--primario)}
.todas h3 a{display:inline;padding:0;margin:0;font-size:inherit;color:var(--primario)}
.pie{margin-top:72px;background:var(--oscuro);color:rgba(255,255,255,.72);font-size:.9rem}
.pie .env{padding:40px 16px 28px;display:grid;gap:28px}
@media (min-width:860px){.pie .env{grid-template-columns:1.4fr 1fr 1fr}}
.pie-marca{display:flex;align-items:center;gap:10px;font:700 1.3rem Manrope,Inter,system-ui,sans-serif;color:#fff;margin:0 0 .4rem}.pie-marca b{color:#5fd3a7}
.promesa{font:700 1.3rem Manrope,Inter,system-ui,sans-serif;color:#fff;letter-spacing:-.02em;margin:0 0 .3rem}
.sello{display:inline-flex;align-items:center;gap:8px;margin-top:14px;font-size:.74rem;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:.45rem .9rem .45rem .7rem}
.sello svg{color:#FFD166}
.pie h2{font:600 .76rem Inter,system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.6);margin:0 0 .8rem}
.pie ul{list-style:none;margin:0;padding:0;display:grid;gap:.45rem}
.pie a{color:rgba(255,255,255,.82);text-decoration:none}.pie a:hover{color:#fff;text-decoration:underline}
.pie p{margin:.3rem 0}
.fam{display:flex;flex-direction:column;line-height:1.35}.fam b{color:#fff}.fam span{font-size:.82rem;color:rgba(255,255,255,.7)}
.pie-base{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.1);padding-top:18px;font-size:.8rem;color:rgba(255,255,255,.6)}
.legal{max-width:760px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const marca = `<svg viewBox="0 0 56 56" width="32" height="32" aria-hidden="true"><path d="M44 16a20 20 0 1 0 0 24" stroke="#0E9F6E" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="#fff"/></svg>`;
const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="#fff"/><path d="M44 16a20 20 0 1 0 0 24" stroke="#0E9F6E" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="26" y="25" width="26" height="6" rx="3" fill="#0B1F17"/></svg>')}`;
const umami = process.env.UMAMI_ID_PORTAL ? `<script defer src="${esc(process.env.UMAMI_SRC || 'https://cloud.umami.is/script.js')}" data-website-id="${esc(process.env.UMAMI_ID_PORTAL)}" data-do-not-track="true"></script>` : '';
const og = `${URL_PORTAL}/og/portal.jpg`;
const LUPA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';

function pagina({ ruta, titulo, descripcion, cuerpo, jsonld = [] }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title><meta name="description" content="${esc(descripcion)}"><link rel="canonical" href="${URL_PORTAL}${ruta}">
<meta name="theme-color" content="#0B1F17"><meta property="og:type" content="website"><meta property="og:site_name" content="${NOMBRE}"><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(descripcion)}"><meta property="og:url" content="${URL_PORTAL}${ruta}"><meta property="og:locale" content="es_ES">
<meta property="og:image" content="${og}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${NOMBRE}: calculadoras de sueldo, impuestos y dinero"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${og}">
<link rel="icon" href="${favicon}" type="image/svg+xml"><link rel="preload" href="/_a/manrope-700.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/_a/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS.replace(/\n/g, '')}</style>${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')}${umami}</head><body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<header class="cab"><div class="env"><a class="logo" href="/" aria-label="${NOMBRE}: inicio">${marca}<span>Calcula<b>Claro</b></span></a>
<nav aria-label="Sitios de la familia Claro">${activos.map((s) => `<a href="${s.url}/">${esc(s.nombre)}</a>`).join('')}</nav></div></header>
<main id="contenido" class="env">${cuerpo}</main>
<footer class="pie"><div class="env">
<div><p class="pie-marca">${marca}<span>Calcula<b>Claro</b></span></p><p class="promesa">Números claros, sin letra pequeña.</p>
<p>La puerta de entrada a ${activos.map((s) => esc(s.nombre)).join(', ')}: calculadoras gratis y orientativas, con el método y las fuentes oficiales publicados en cada una.</p>
<p class="sello">${icono('escudo', 18)}<span>Hecho en Lleida · Números claros</span></p></div>
<div><h2>Familia Claro</h2><ul>${activos.map((s) => `<li><a class="fam" href="${s.url}/"><b>${esc(s.nombre)}</b><span>${esc(s.interes.es)}</span></a></li>`).join('')}</ul></div>
<div><h2>Legal</h2><ul><li><a href="/aviso-legal/">Aviso legal y privacidad</a></li><li><a href="#todas">Todas las calculadoras</a></li></ul></div>
<p class="pie-base">© ${hoy.slice(0, 4)} ${esc(titular.nombre)} · ${NOMBRE}. Sin cookies ni registro.</p></div></footer></body></html>`;
}

const filaInteres = (s) => {
  const c = s.cfg?.colores.marca ?? '#7a8a83';
  const top = s.activo ? `<ul>${s.lista.filter((x) => x.destacada).slice(0, 3).map((x) => `<li>${esc(corto(x.h1).replace(/ 20\d\d$/, ''))}</li>`).join('')}</ul>` : '';
  const dentro = `<span class="ico">${icono(s.icono, 24)}</span><strong>${esc(s.interes.es)}</strong><span class="marca"><b>${esc(s.nombre)}</b>${s.activo ? ` · ${s.lista.length} calculadoras` : ''}</span><span class="para">${esc(s.para.es)}</span>${top}`;
  return s.activo
    ? `<li><a class="interes" style="--c:${c}" href="${s.url}/">${dentro}<span class="ir" aria-hidden="true">→</span></a></li>`
    : `<li><div class="interes pronto" style="--c:${c}"><span class="etiqueta">Muy pronto</span>${dentro}</div></li>`;
};

const indice = calcs.map((c) => ({ t: c.h1, s: c.sitio, u: c.url, k: `${c.h1} ${c.clave} ${c.resumen}` }));
const sugerencias = ['sueldo neto', 'finiquito', 'IVA', 'cuota de autónomos', 'cheque de pago', 'paro'];
// Buscador en el navegador: filtra el índice al escribir; Enter abre el primero, flechas para moverse y «/» enfoca la caja
const BUSCADOR = `(function(){var D=${JSON.stringify(indice)};var n=function(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')};D.forEach(function(d){d.n=n(d.k)});
var i=document.getElementById('q'),r=document.getElementById('res'),k=-1;function pinta(){k=-1;var q=n(i.value.trim());if(q.length<2){r.hidden=true;r.innerHTML='';return}
var p=q.split(/\\s+/),m=D.filter(function(d){return p.every(function(x){return d.n.indexOf(x)>=0})}).slice(0,8);
r.innerHTML=m.length?m.map(function(d){return '<li><a href="'+d.u+'">'+d.t.replace(/[<&]/g,'')+' <small>'+d.s+'</small></a></li>'}).join(''):'<li><a href="#todas">Sin resultados: mira todas las calculadoras ↓</a></li>';r.hidden=false}
function mueve(d){var a=r.querySelectorAll('a');if(!a.length)return;if(a[k])a[k].classList.remove('sel');k=(k+d+a.length)%a.length;a[k].classList.add('sel');a[k].scrollIntoView({block:'nearest'})}
i.addEventListener('input',pinta);i.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();mueve(1)}else if(e.key==='ArrowUp'){e.preventDefault();mueve(-1)}else if(e.key==='Enter'){var a=r.querySelectorAll('a');if(a.length){e.preventDefault();location.href=a[Math.max(k,0)].href}}else if(e.key==='Escape'){i.value='';pinta()}});
addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==i&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();i.focus()}});
document.querySelectorAll('[data-q]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();i.value=a.dataset.q;pinta();i.focus()})})})();`;

const portada = pagina({
  ruta: '/',
  titulo: `${NOMBRE}: calculadoras de sueldo, impuestos y dinero con datos oficiales`,
  descripcion: `Encuentra la calculadora que necesitas entre ${calcs.length}: sueldo neto, finiquito, paro, renta, IVA, autónomos y cheque de pago en EE. UU. Gratis, sin registro y con el método publicado.`,
  jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: NOMBRE, url: `${URL_PORTAL}/`, inLanguage: 'es' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Sitios de la familia Claro', itemListElement: activos.map((s, k) => ({ '@type': 'ListItem', position: k + 1, name: s.nombre, url: `${s.url}/` })) }],
  cuerpo: `<section class="portada"><div class="portada-txt"><p class="eyebrow">Familia Claro · Números claros, sin letra pequeña</p><h1>¿Qué quieres <em>calcular</em> hoy?</h1>
<p>${calcs.length} calculadoras gratis de sueldo, impuestos y dinero, con los datos oficiales y el método a la vista. Escribe lo que buscas o elige por lo que te interesa.</p>
<div class="buscar" role="search"><label class="vh" for="q">Buscar una calculadora</label><div class="caja">${LUPA}<input id="q" type="search" autocomplete="off" placeholder="Por ejemplo: sueldo neto, IVA, finiquito…" aria-controls="res"><kbd aria-hidden="true">/</kbd></div>
<ul id="res" class="resultados" hidden aria-live="polite"></ul></div>
<p class="sugerencias"><span>Lo más buscado:</span>${sugerencias.map((s) => `<a href="#todas" data-q="${esc(s)}">${esc(s)}</a>`).join('')}</p>
<ul class="cifras"><li><b>${calcs.length}</b><span>calculadoras</span></li><li><b>${activos.length}</b><span>sitios especializados</span></li><li><b>${idiomas.size}</b><span>idiomas</span></li><li><b>0</b><span>registros ni cookies</span></li></ul></div>
<picture class="ilu"><source media="(max-width: 959px)" srcset="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><img src="/img/heroe-portal-800.webp" srcset="/img/heroe-portal-480.webp 480w, /img/heroe-portal-800.webp 800w" sizes="440px" width="800" height="800" alt="" fetchpriority="high" decoding="async"></picture></section>
<h2 class="titulo">Elige por lo que te interesa</h2><ul class="intereses">${sitios.map(filaInteres).join('')}</ul>
<h2 class="titulo">Las más usadas</h2><ul class="top">${masUsadas.map((c) => `<li><a href="${c.url}" style="--c:${c.marca}"><span>${icono('calculadora', 20)}</span><span><b>${esc(corto(c.h1))}</b><small>${esc(c.sitio)}</small></span></a></li>`).join('')}</ul>
<h2 class="titulo" id="todas">Todas las calculadoras</h2><div class="todas">${activos.map((s) => `<section><h3><a href="${s.url}/">${esc(s.nombre)}</a><span>${esc(s.interes.es)}</span></h3><ul>${s.lista.map((c) => `<li><a href="${c.url}">${esc(corto(c.h1))}</a></li>`).join('')}</ul></section>`).join('')}</div>
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
mkdirSync(`${out}/img`, { recursive: true });
mkdirSync(`${out}/og`, { recursive: true });
writeFileSync(`${out}/index.html`, portada);
writeFileSync(`${out}/aviso-legal/index.html`, aviso);
writeFileSync(`${out}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${URL_PORTAL}/sitemap.xml\n`);
writeFileSync(`${out}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/aviso-legal/'].map((r) => `<url><loc>${URL_PORTAL}${r}</loc><lastmod>${hoy}</lastmod></url>`).join('')}</urlset>\n`);
writeFileSync(`${out}/404.html`, pagina({ ruta: '/404', titulo: `No encontrada · ${NOMBRE}`, descripcion: 'Página no encontrada', cuerpo: '<h1 style="margin-top:1.4em">Esta página no existe</h1><p><a href="/">Vuelve al buscador de calculadoras</a>.</p>' }));
const F = 'node_modules/@fontsource';
copyFileSync(`${F}/manrope/files/manrope-latin-700-normal.woff2`, `${out}/_a/manrope-700.woff2`);
copyFileSync(`${F}/inter/files/inter-latin-400-normal.woff2`, `${out}/_a/inter-400.woff2`);
copyFileSync(`${F}/inter/files/inter-latin-600-normal.woff2`, `${out}/_a/inter-600.woff2`);
// Ilustración de la portada e imagen para compartir (las mismas de public/, que el portal no pasa por Astro)
for (const t of [480, 800]) copyFileSync(`public/img/heroe-portal-${t}.webp`, `${out}/img/heroe-portal-${t}.webp`);
if (existsSync('public/og/portal.jpg')) copyFileSync('public/og/portal.jpg', `${out}/og/portal.jpg`);
writeFileSync(`${out}/_headers`, '/_a/*\n  Cache-Control: public, max-age=31536000, immutable\n/img/*\n  Cache-Control: public, max-age=2592000\n');
console.log(`portal: ${calcs.length} calculadoras de ${sitios.filter((s) => s.activo).length} sitios → ${out}`);
