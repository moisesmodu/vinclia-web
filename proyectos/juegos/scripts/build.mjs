// Compila los juegos del catálogo (juegos.json).
//   node scripts/build.mjs web  → dist/<slug>/ (web propia, la que sirve Vercel) + dist/index.html con el catálogo
//   node scripts/build.mjs all  → además dist-portales/<slug>/<portal>/ para CrazyGames, Poki e itch.io
//   GAME=egg-truck limita a un juego.
import { build } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] || 'web';
const all = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8'));
// GAME=<carpeta> compila solo ese juego (también la plantilla, que no está en juegos.json)
// Sin GAME solo se compilan (y publican en la web) los juegos terminados: los "en desarrollo" no salen al público.
const listo = (g) => !/en desarrollo/.test(g.estado || '');
const games = process.env.GAME ? [all.find((g) => g.slug === process.env.GAME) || { slug: process.env.GAME, titulo: process.env.GAME }] : all.filter(listo);
const portals = mode === 'all' ? ['web', 'crazygames', 'poki', 'gamedistribution', 'gamemonetize', 'itch'] : ['web'];

if (!process.env.GAME) rmSync(resolve(root, 'dist'), { recursive: true, force: true });
for (const g of games) {
  for (const p of portals) {
    const out = p === 'web' ? resolve(root, 'dist', g.slug) : resolve(root, 'dist-portales', g.slug, p);
    process.env.VITE_PORTAL = p;
    process.env.VITE_PORTAL_GAME_ID = g.ids?.[p] || ''; // id del juego en el panel de GameDistribution / GameMonetize
    process.env.OUT_DIR = out;
    await build({ configFile: resolve(root, g.slug, 'vite.config.ts'), logLevel: 'warn', mode: 'production' });
    console.log(`✔ ${g.slug} [${p}] → ${out.replace(root + '/', '')}`);
  }
}

// Marca del estudio (MARCAS.md · Nuvolet Games): logotipo e icono de marcas/logos, pie común en todas las páginas.
const STUDIO = 'Nuvolet Games', TAGLINE = 'Tiny games, big smiles.';
// URL pública (SITE_URL o la que pone Vercel). Con ella salen canonical, hreflang, og:url y sitemap.
const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
// Vercel Web Analytics (sin cookies): solo en la web propia y solo cuando se compila en Vercel o para una URL *.vercel.app.
// Nunca en los paquetes para portales (dist-portales), que no pasan por aquí.
const insights = process.env.VERCEL || /vercel\.app/.test(site) ? '<script defer src="/_vercel/insights/script.js"></script>' : '';
// Verificación de Google Search Console por variable de entorno (DESPLIEGUE.md): sin ella no sale nada.
const gsc = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${process.env.GOOGLE_SITE_VERIFICATION}">` : '';
const headExtra = gsc + insights;
// Correo de contacto de toda la cartera (SESIONES.md «Correo de contacto»). Fijo a propósito: LEGAL_EMAIL del entorno
// contenía un correo personal, que SESIONES.md prohíbe publicar.
const CONTACT = 'hola@numimates.com';
mkdirSync(resolve(root, 'dist', 'marca'), { recursive: true });
for (const f of ['juegos.svg', 'juegos-icono.svg']) cpSync(resolve(root, '..', '..', 'marcas', 'logos', f), resolve(root, 'dist', 'marca', f));
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;800&display=swap">';
const footer = (up) => `<footer style="text-align:center;padding:24px 16px 32px;color:#1E2A3A"><img src="${up}marca/juegos-icono.svg" alt="" width="28" height="28" style="vertical-align:middle"> <b>${STUDIO}</b> · ${TAGLINE}<br><span style="font-size:.9em"><a href="${up}about/" style="color:#1E2A3A">About the studio</a> · Contact: <a href="mailto:${CONTACT}" style="color:#1E2A3A">${CONTACT}</a></span></footer>`;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// Open Graph y tarjeta de X/Twitter, iguales en portada, juegos y páginas SEO
const ogTags = ({ title, description, url, image, w, h, type = 'website' }) => `<meta property="og:type" content="${type}"><meta property="og:site_name" content="${STUDIO}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${url ? `<meta property="og:url" content="${url}">` : ''}${image ? `<meta property="og:image" content="${image}">${w ? `<meta property="og:image:width" content="${w}"><meta property="og:image:height" content="${h}">` : ''}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}">` : ''}`;

// Páginas de juego de la web propia (dist/<slug>/index.html, generadas por Vite): el HTML del juego no se toca; aquí se
// añaden solo las etiquetas de posicionamiento (title SEO si el juego tiene `tituloSeo`, description de juegos.json,
// canonical, Open Graph) y la analítica. Los paquetes de portal (dist-portales) no pasan por aquí.
for (const g of games) {
  const f = resolve(root, 'dist', g.slug, 'index.html');
  if (!existsSync(f)) continue;
  let h = readFileSync(f, 'utf8');
  // Sin tituloSeo, el título lleva lo que se busca («play free online») y la marca: «Egg Truck» a secas no posiciona
  const titulo = g.tituloSeo || `${g.titulo} – Play Free Online, No Download | ${STUDIO}`;
  const og = ogTags({ title: g.tituloSeo || `${g.titulo} – free game by ${STUDIO}`, description: g.descripcion || '', url: site ? `${site}/${g.slug}/` : '', image: site ? `${site}/portadas/${g.slug}.jpg` : '', w: 800, h: 800 });
  // VideoGame: sin valoraciones ni descargas inventadas; solo lo que es cierto (gratis, navegador, estudio)
  const ld = site ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'VideoGame', name: g.titulo, url: `${site}/${g.slug}/`, description: g.descripcion, image: `${site}/portadas/${g.slug}.jpg`, inLanguage: 'en', playMode: 'SinglePlayer', applicationCategory: 'Game', operatingSystem: 'Web browser', gamePlatform: ['Web browser', 'Mobile', 'Chromebook'], author: { '@type': 'Organization', name: STUDIO, url: `${site}/` }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }).replace(/<\//g, '<\\/')}</script>` : '';
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`);
  if (g.descripcion) h = h.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${g.descripcion.replace(/"/g, '&quot;')}" />`);
  h = h.replace('</head>', `${site ? `<link rel="canonical" href="${site}/${g.slug}/">` : ''}${og}${ld}${headExtra}</head>`);
  writeFileSync(f, h);
}

// Portada del catálogo en la web propia (tráfico directo: el 100 % de los ingresos es nuestro).
// Diseño (MARCAS.md · Nuvolet Games): cielo, tinta, nube, sol y hierba; Fredoka y Nunito; piezas «de juguete» con borde de
// tinta y sombra desplazada. Una idea por bloque: jugar ya → elegir por tipo → quiénes somos.
const lista = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).filter(listo);
const hubs = JSON.parse(readFileSync(resolve(root, 'seo', 'paginas.json'), 'utf8')).filter((p) => p.hub && !p.lang);
// Etiqueta visible de cada tarjeta: el tipo de juego más concreto (las genéricas, como «no download», no dicen nada)
const TIPOS = [['puzzle-games', 'Puzzle'], ['idle-games', 'Idle'], ['sports-games', 'Sports'], ['runner-games', 'Runner'], ['platformer-games', 'Platformer'],
  ['io-games', '.io'], ['space-games', 'Space'], ['stacking-games', 'Stacking'], ['christmas-games', 'Christmas'], ['physics-driving-games', 'Driving'], ['one-button-games', 'One button']];
const tipo = (g) => (TIPOS.find(([k]) => (g.etiquetas || []).includes(k)) || [, 'Arcade'])[1];
const portada = (g, lado) => {
  const src = resolve(root, 'fichas', g.slug, 'portadas', `${g.slug}-${lado}x${lado}.jpg`);
  if (!existsSync(src)) return null;
  mkdirSync(resolve(root, 'dist', 'portadas'), { recursive: true });
  const name = lado === 800 ? `${g.slug}.jpg` : `${g.slug}-${lado}.jpg`; // <slug>.jpg (800) lo usan og:image y las páginas SEO
  cpSync(src, resolve(root, 'dist', 'portadas', name));
  return `./portadas/${name}`;
};
const destacado = lista.find((g) => g.slug === 'egg-truck') || lista[0];
const cards = lista.map((g, i) => {
  portada(g, 800);
  const img = portada(g, 400) || (existsSync(resolve(root, 'dist', 'portadas', `${g.slug}.jpg`)) ? `./portadas/${g.slug}.jpg` : null);
  return `<li><a class="card" href="./${g.slug}/" style="--c:${g.color || '#4FB3FF'}">${img ? `<img src="${img}" alt="" width="400" height="400" ${i < 4 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}<span class="t">${esc(g.titulo)}</span><span class="d">${esc(g.descripcion || '')}</span><span class="tag">${tipo(g)}</span></a></li>`;
}).join('\n');
const cuenta = (p) => lista.filter((x) => (x.etiquetas || []).includes(p.hub)).length;
const corto = (p) => esc(p.h1.replace(/ for a quick break$/i, '').replace(/ (style )?games?$/i, '').replace(/^Games without text$/i, 'No text'));
const filtran = hubs.filter((p) => cuenta(p) >= 2 && cuenta(p) < lista.length).sort((a, b) => cuenta(b) - cuenta(a));
const chips = filtran.map((p) => `<li><a class="chip" href="./${p.path}/">${corto(p)}<span>${cuenta(p)}</span></a></li>`).join('');
const masHubs = hubs.filter((p) => !filtran.includes(p) && cuenta(p) > 0).map((p) => `<a href="./${p.path}/">${esc(p.h1)}</a>`).join(' · ');
const ldHome = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'Organization', '@id': `${site}/#studio`, name: STUDIO, url: `${site}/`, logo: `${site}/marca/juegos-icono.svg`, slogan: TAGLINE, email: CONTACT,
    address: { '@type': 'PostalAddress', addressLocality: 'Lleida', addressRegion: 'Catalonia', addressCountry: 'ES' }, sameAs: ['https://nuvoletgames.itch.io'] },
  { '@type': 'WebSite', '@id': `${site}/#web`, url: `${site}/`, name: STUDIO, inLanguage: 'en', publisher: { '@id': `${site}/#studio` } },
  { '@type': 'ItemList', name: 'Free casual games by Nuvolet Games', numberOfItems: lista.length, itemListElement: lista.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${site}/${g.slug}/`, name: g.titulo })) },
] };
const nube = (w, op) => `<svg class="nube" viewBox="0 0 64 40" width="${w}" aria-hidden="true" style="opacity:${op}"><path d="M14 38a12 12 0 0 1-2-23.8A16 16 0 0 1 43 9a11 11 0 0 1 7 29z" fill="#fff"/></svg>`;
mkdirSync(resolve(root, 'dist'), { recursive: true });
if (existsSync(resolve(root, 'seo', 'og-home.jpg'))) cpSync(resolve(root, 'seo', 'og-home.jpg'), resolve(root, 'dist', 'og.jpg'));
const homeDesc = `${lista.length} free casual games you understand in three seconds. No download, no sign-up: tap and play on phone, tablet or Chromebook.`;
writeFileSync(resolve(root, 'dist', 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuvolet Games – Free Casual Games, No Download</title><link rel="icon" href="./marca/juegos-icono.svg">${FONTS}
<meta name="theme-color" content="#4FB3FF"><meta name="description" content="${esc(homeDesc)}">${site ? `<link rel="canonical" href="${site}/">` : ''}
${ogTags({ title: 'Nuvolet Games – Tiny games, big smiles', description: homeDesc, url: site ? `${site}/` : '', image: site ? `${site}/og.jpg` : '', w: 1200, h: 630 })}
${site ? `<script type="application/ld+json">${JSON.stringify(ldHome).replace(/<\//g, '<\\/')}</script>` : ''}${headExtra}
<style>
:root{--cielo:#4FB3FF;--tinta:#1E2A3A;--nube:#F4FAFF;--sol:#FFC94D;--hierba:#58C26A}
*{box-sizing:border-box}body{margin:0;font-family:Nunito,system-ui,sans-serif;background:var(--nube);color:var(--tinta);line-height:1.5}
a{color:inherit}.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:#fff;padding:8px 12px;border-radius:10px;z-index:9}
header.top nav a,.top nav a{font-weight:800;text-decoration:none;margin-left:18px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0}.top .logo{display:inline-block;background:#fff;border:3px solid var(--tinta);border-radius:14px;padding:6px 12px;box-shadow:0 4px 0 var(--tinta)}.top .logo img{display:block;height:30px;width:auto}
@media(max-width:520px){.top nav a[href="#categories"]{display:none}.hero .nube{display:none}}
.more{margin:18px 0 0;font-size:14px;line-height:1.9}.more a{font-weight:800}header.top nav a:hover{text-decoration:underline}
.hero{background:var(--cielo);border-bottom:4px solid var(--tinta);position:relative;overflow:hidden}
.hero .wrap{display:grid;gap:28px;padding-top:8px;padding-bottom:44px;position:relative;z-index:1}
.hero h1{font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:clamp(40px,7vw,68px);line-height:1;margin:8px 0 14px;letter-spacing:-.01em;color:#fff;text-shadow:0 4px 0 var(--tinta);-webkit-text-stroke:2px var(--tinta);paint-order:stroke fill}
.hero p.lead{font-size:clamp(17px,2.2vw,20px);max-width:34ch;margin:0 0 24px;font-weight:700;color:var(--tinta)}
.btns{display:flex;flex-wrap:wrap;gap:12px}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:12px 22px;border:4px solid var(--tinta);border-radius:16px;font:600 19px Fredoka,Nunito,sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 5px 0 var(--tinta);transition:transform .12s ease,box-shadow .12s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 7px 0 var(--tinta)}.btn:active{transform:translateY(4px);box-shadow:0 1px 0 var(--tinta)}
.btn.sol{background:var(--sol)}.btn.blanco{background:#fff}
.btn:focus-visible,.card:focus-visible,.chip:focus-visible{outline:4px solid var(--tinta);outline-offset:3px}
.feat{display:block;justify-self:center;width:min(100%,250px);border:4px solid var(--tinta);border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 8px 0 var(--tinta);transform:rotate(2deg);text-decoration:none;transition:transform .2s ease}
.feat:hover{transform:rotate(0) translateY(-4px)}.feat img{display:block;width:100%;height:auto;aspect-ratio:1}
.feat span{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;font:600 20px Fredoka,Nunito,sans-serif}.feat b{font:800 13px Nunito,sans-serif;background:var(--hierba);color:var(--tinta);padding:3px 10px;border-radius:999px;border:2px solid var(--tinta)}
.hero .nube{position:absolute;z-index:0}
.trust{display:flex;flex-wrap:wrap;gap:8px 22px;list-style:none;padding:0;margin:22px 0 0;font-weight:800;font-size:15px}
.trust li::before{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--hierba);border:2px solid var(--tinta);margin-right:8px;vertical-align:-1px}
@media(min-width:860px){.feat{width:min(100%,380px)}.hero .wrap{grid-template-columns:1.15fr .85fr;align-items:center;padding-top:24px;padding-bottom:64px}}
h2{font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:clamp(26px,3.6vw,34px);margin:0 0 16px}
section.blk{padding:40px 0 8px}
.chips{display:flex;flex-wrap:wrap;gap:10px;list-style:none;margin:0;padding:0}
.chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 14px;background:#fff;border:3px solid var(--tinta);border-radius:999px;font-weight:800;text-decoration:none}
.chip span{font-size:12px;background:var(--nube);border:2px solid var(--tinta);border-radius:999px;padding:0 7px}.chip:hover{background:var(--sol)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;list-style:none;margin:0;padding:0}
@media(min-width:640px){.grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px}}
.card{position:relative;display:flex;flex-direction:column;height:100%;background:#fff;border:4px solid var(--tinta);border-radius:20px;overflow:hidden;text-decoration:none;box-shadow:0 5px 0 var(--tinta);transition:transform .15s ease,box-shadow .15s ease}
.card:hover{transform:translateY(-4px);box-shadow:0 9px 0 var(--tinta)}.card img{display:block;width:100%;height:auto;aspect-ratio:1;background:var(--c);border-bottom:4px solid var(--tinta)}
.card .t{font:600 19px Fredoka,Nunito,sans-serif;padding:10px 12px 0}.card .d{font-size:14px;padding:0 12px;margin:2px 0 10px;color:#3b4b60;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card .tag{align-self:flex-start;margin:auto 12px 12px;font-size:12px;font-weight:800;background:var(--nube);border:2px solid var(--tinta);border-radius:999px;padding:1px 9px}
.about{margin:48px 0 0;background:#fff;border:4px solid var(--tinta);border-radius:24px;padding:24px;display:grid;gap:16px;box-shadow:0 6px 0 var(--tinta)}
@media(min-width:760px){.about{grid-template-columns:auto 1fr;align-items:center;padding:28px 32px}}
.about p{margin:0;max-width:62ch}.about h2{margin-bottom:8px}
@media(prefers-reduced-motion:reduce){*{transition:none!important}.feat{transform:none}}
</style></head>
<body><a class="skip" href="#games">Skip to the games</a>
<header class="hero">${nube(140, .9).replace('class="nube"', 'class="nube" style="top:84px;right:6%"')}${nube(90, .7).replace('class="nube"', 'class="nube" style="bottom:28px;left:4%"')}
<div class="wrap" style="display:block;padding-bottom:0"><div class="top"><a class="logo" href="./"><img src="./marca/juegos.svg" alt="${STUDIO}" width="160" height="30"></a><nav aria-label="Main"><a href="#categories">Categories</a><a href="./about/">About</a></nav></div></div>
<div class="wrap"><div>
<h1>Tiny games, big smiles.</h1>
<p class="lead">${esc(homeDesc)}</p>
<div class="btns"><a class="btn sol" href="./${destacado.slug}/">▶ Play ${esc(destacado.titulo)}</a><button class="btn blanco" type="button" id="azar">Surprise me</button></div>
<ul class="trust"><li>Free</li><li>No download</li><li>No sign-up</li><li>Phone, tablet, Chromebook</li></ul>
</div>
<a class="feat" href="./${destacado.slug}/"><img src="./portadas/${destacado.slug}.jpg" alt="${esc(destacado.titulo)}: ${esc(destacado.descripcion || '')}" width="800" height="800" fetchpriority="high"><span>${esc(destacado.titulo)}<b>Featured</b></span></a>
</div></header>
<main id="main" class="wrap">
<section class="blk" id="games" aria-labelledby="h-all"><h2 id="h-all">All ${lista.length} games</h2><ul class="grid">${cards}</ul></section>
<section class="blk" id="categories" aria-labelledby="h-cat"><h2 id="h-cat">Pick a kind of game</h2><ul class="chips">${chips}</ul>${masHubs ? `<p class="more">More: ${masHubs}</p>` : ''}</section>
<section class="about" aria-labelledby="h-about">${nube(96, 1).replace('fill="#fff"', 'fill="#4FB3FF" stroke="#1E2A3A" stroke-width="2.5"')}<div><h2 id="h-about">Made in Lleida, played everywhere</h2>
<p>${STUDIO} is a tiny studio in Lleida (Catalonia, Spain). Every game is one idea you get in three seconds and a round you finish in a minute or two, with no text inside, so anyone can play in any language. <a href="./about/"><b>More about the studio</b></a> · <a href="./es/juegos-para-chromebook/" hreflang="es" lang="es">Juegos para Chromebook en español</a></p></div></section>
</main>${footer('./')}
<script>document.getElementById('azar').addEventListener('click',function(){var a=document.querySelectorAll('.grid .card');location.href=a[Math.floor(Math.random()*a.length)].href});</script>
</body></html>`);
console.log('✔ dist/index.html (catálogo)');

// Páginas SEO de la web propia (seo/paginas.json): guías por juego y categorías que se llenan solas con las etiquetas
// de juegos.json. Más sitemap.xml y robots.txt. SITE_URL la pone Vercel (VERCEL_PROJECT_PRODUCTION_URL).
// seo/paginas.json (catálogo y Egg Truck) + seo/paginas-<juego>.json (una por juego nuevo, así no se pisan)
const pages = readdirSync(resolve(root, 'seo')).filter((f) => /^paginas(-[a-z0-9-]+)?\.json$/.test(f)).sort()
  .flatMap((f) => JSON.parse(readFileSync(resolve(root, 'seo', f), 'utf8')))
  // las guías de un juego aún en desarrollo tampoco se publican
  .filter((p) => !p.game || JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).filter(listo).some((g) => g.slug === p.game));
const catalog = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).filter(listo);
for (const pg of pages) {
  const up = '../'.repeat(pg.path.split('/').length);
  const g = pg.game && catalog.find((x) => x.slug === pg.game);
  const listed = pg.hub ? catalog.filter((x) => (x.etiquetas || []).includes(pg.hub)) : g ? [g] : [];
  const lang = pg.lang || 'en', t = lang === 'es' ? { play: 'Jugar a', all: '← Todos los juegos', by: 'de' } : { play: 'Play', all: '← All games', by: 'by' };
  // pg.alt = { en: 'ruta', es: 'ruta' }: versiones por idioma de la misma página (hreflang; x-default = la inglesa)
  const alt = site && pg.alt ? Object.entries(pg.alt).map(([l, r]) => `<link rel="alternate" hreflang="${l}" href="${site}/${r}/">`).join('') + `<link rel="alternate" hreflang="x-default" href="${site}/${pg.alt.en || pg.path}/">` : '';
  const jsonld = pg.jsonld ? `<script type="application/ld+json">${JSON.stringify(pg.jsonld).replace(/\{\{site\}\}/g, site || '').replace(/<\//g, '<\\/')}</script>` : '';
  const cardsHtml = listed.map((x) => `<a class="card" href="${up}${x.slug}/"><img src="${up}portadas/${x.slug}-400.jpg" alt="" width="400" height="400" loading="lazy"><span>${t.play} ${esc(x.titulo)}</span></a>`).join('');
  const embed = pg.embed && g ? `<div class="embed"><iframe src="${up}${g.slug}/" title="${esc(g.titulo)}" allow="autoplay; fullscreen" loading="lazy"></iframe></div>` : '';
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pg.title)}</title><link rel="icon" href="${up}marca/juegos-icono.svg">${FONTS}<meta name="theme-color" content="#4FB3FF"><meta name="author" content="${STUDIO}"><meta name="description" content="${esc(pg.description)}">${site ? `<link rel="canonical" href="${site}/${pg.path}/">` : ''}${alt}${ogTags({ title: pg.title, description: pg.description, url: site ? `${site}/${pg.path}/` : '', image: site ? (g ? `${site}/portadas/${g.slug}.jpg` : `${site}/og.jpg`) : '', w: g ? 800 : 1200, h: g ? 800 : 630 })}${jsonld}${headExtra}
<style>body{margin:0;font-family:Nunito,system-ui,sans-serif;background:#F4FAFF;color:#1E2A3A;line-height:1.55}h1,h2{font-family:Fredoka,Nunito,sans-serif}.by{margin:-.4em 0 1em;font-weight:700;color:#4a6a8a}main{max-width:820px;margin:0 auto;padding:16px}
h1{font-size:2rem;margin:.6em 0}.box{background:#fff;border:4px solid #1E2A3A;border-radius:18px;padding:8px 20px;margin:16px 0}
.embed{position:relative;aspect-ratio:16/9;border:4px solid #1E2A3A;border-radius:18px;overflow:hidden;background:#000}.embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}.card{display:block;background:#fff;border:4px solid #1E2A3A;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;font-weight:800;text-align:center}
.card img{width:100%;height:auto;display:block;aspect-ratio:1}.card span{display:block;padding:8px}nav{display:flex;align-items:center;justify-content:space-between;gap:12px}nav a{color:#1E2A3A;font-weight:800}nav .logo img{display:block;height:28px;width:auto}</style></head>
<body><main><nav><a href="${up}">${t.all}</a><a class="logo" href="${up}"><img src="${up}marca/juegos.svg" alt="${STUDIO}" width="150" height="28"></a></nav><h1>${esc(pg.h1)}</h1>${g ? `<p class="by">${t.by} ${STUDIO}</p>` : ''}${embed}
<div class="box">${pg.body.map((p) => `<p>${p}</p>`).join('')}</div>${cardsHtml ? `<div class="grid">${cardsHtml}</div>` : ''}</main>${footer(up)}</body></html>`;
  mkdirSync(resolve(root, 'dist', pg.path), { recursive: true });
  writeFileSync(resolve(root, 'dist', pg.path, 'index.html'), html);
}
const urls = ['', ...catalog.map((g) => `${g.slug}/`), ...pages.map((p) => `${p.path}/`)];
if (site) writeFileSync(resolve(root, 'dist', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${site}/${u}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(resolve(root, 'dist', 'robots.txt'), `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);
console.log(`✔ ${pages.length} páginas SEO${site ? ' + sitemap.xml' : ' (sin SITE_URL: sin sitemap)'} + robots.txt`);
