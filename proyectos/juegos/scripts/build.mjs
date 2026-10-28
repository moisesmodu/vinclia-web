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
const games = process.env.GAME ? [all.find((g) => g.slug === process.env.GAME) || { slug: process.env.GAME, titulo: process.env.GAME }] : all;
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
mkdirSync(resolve(root, 'dist', 'marca'), { recursive: true });
for (const f of ['juegos.svg', 'juegos-icono.svg']) cpSync(resolve(root, '..', '..', 'marcas', 'logos', f), resolve(root, 'dist', 'marca', f));
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;700&display=swap">';
const footer = (up) => `<footer style="text-align:center;padding:24px 16px 32px;color:#1E2A3A"><img src="${up}marca/juegos-icono.svg" alt="" width="28" height="28" style="vertical-align:middle"> <b>${STUDIO}</b> · ${TAGLINE}</footer>`;

// Portada del catálogo en la web propia (tráfico directo: el 100 % de los ingresos es nuestro).
const cards = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8')).map((g) => {
  const img = existsSync(resolve(root, 'fichas', g.slug, 'portadas', `${g.slug}-800x800.jpg`));
  if (img) {
    mkdirSync(resolve(root, 'dist', 'portadas'), { recursive: true });
    cpSync(resolve(root, 'fichas', g.slug, 'portadas', `${g.slug}-800x800.jpg`), resolve(root, 'dist', 'portadas', `${g.slug}.jpg`));
  }
  return `<a class="card" href="./${g.slug}/">${img ? `<img src="./portadas/${g.slug}.jpg" alt="${g.titulo}" loading="lazy">` : ''}<span>${g.titulo}</span></a>`;
}).join('\n');
mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist', 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuvolet Games – free casual games</title><link rel="icon" href="./marca/juegos-icono.svg">${FONTS}
<meta name="description" content="Free casual browser games. No download, no sign-up: play instantly on phone or computer.">
<style>body{margin:0;font-family:Nunito,system-ui,sans-serif;background:#F4FAFF;color:#1E2A3A}h1{font-family:Fredoka,Nunito,sans-serif;text-align:center;margin:8px 16px 24px}header{text-align:center;padding:24px 16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;max-width:1000px;margin:0 auto;padding:0 16px 32px}
.card{display:block;background:#fff;border:4px solid #1E2A3A;border-radius:18px;overflow:hidden;text-decoration:none;color:inherit;font-weight:700;text-align:center}
.card img{width:100%;display:block;aspect-ratio:1}.card span{display:block;padding:10px}</style></head>
<body><header><img src="./marca/juegos.svg" alt="Nuvolet Games" height="56"></header><h1>Free casual games</h1><div class="grid">${cards}</div>
<p style="text-align:center;padding:0 16px 32px">${JSON.parse(readFileSync(resolve(root, 'seo', 'paginas.json'), 'utf8')).filter((p) => p.hub).map((p) => `<a href="./${p.path}/" style="color:#1E2A3A;margin:0 8px">${p.h1}</a>`).join(' · ')}</p>${footer('./')}</body></html>`);
console.log('✔ dist/index.html (catálogo)');

// Páginas SEO de la web propia (seo/paginas.json): guías por juego y categorías que se llenan solas con las etiquetas
// de juegos.json. Más sitemap.xml y robots.txt. SITE_URL la pone Vercel (VERCEL_PROJECT_PRODUCTION_URL).
const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
// seo/paginas.json (catálogo y Egg Truck) + seo/paginas-<juego>.json (una por juego nuevo, así no se pisan)
const pages = readdirSync(resolve(root, 'seo')).filter((f) => /^paginas(-[a-z0-9-]+)?\.json$/.test(f)).sort()
  .flatMap((f) => JSON.parse(readFileSync(resolve(root, 'seo', f), 'utf8')));
const catalog = JSON.parse(readFileSync(resolve(root, 'juegos.json'), 'utf8'));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
for (const pg of pages) {
  const up = '../'.repeat(pg.path.split('/').length);
  const g = pg.game && catalog.find((x) => x.slug === pg.game);
  const listed = pg.hub ? catalog.filter((x) => (x.etiquetas || []).includes(pg.hub)) : g ? [g] : [];
  const cardsHtml = listed.map((x) => `<a class="card" href="${up}${x.slug}/"><img src="${up}portadas/${x.slug}.jpg" alt="${esc(x.titulo)}" loading="lazy"><span>Play ${esc(x.titulo)}</span></a>`).join('');
  const embed = pg.embed && g ? `<div class="embed"><iframe src="${up}${g.slug}/" title="${esc(g.titulo)}" allow="autoplay; fullscreen" loading="lazy"></iframe></div>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pg.title)}</title><link rel="icon" href="${up}marca/juegos-icono.svg">${FONTS}<meta name="author" content="${STUDIO}"><meta name="description" content="${esc(pg.description)}">${site ? `<link rel="canonical" href="${site}/${pg.path}/">` : ''}
<style>body{margin:0;font-family:Nunito,system-ui,sans-serif;background:#F4FAFF;color:#1E2A3A;line-height:1.55}h1,h2{font-family:Fredoka,Nunito,sans-serif}.by{margin:-.4em 0 1em;font-weight:700;color:#4a6a8a}main{max-width:820px;margin:0 auto;padding:16px}
h1{font-size:2rem;margin:.6em 0}.box{background:#fff;border:4px solid #1E2A3A;border-radius:18px;padding:8px 20px;margin:16px 0}
.embed{position:relative;aspect-ratio:16/9;border:4px solid #1E2A3A;border-radius:18px;overflow:hidden;background:#000}.embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}.card{display:block;background:#fff;border:4px solid #1E2A3A;border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;font-weight:800;text-align:center}
.card img{width:100%;display:block;aspect-ratio:1}.card span{display:block;padding:8px}nav a{color:#1E2A3A;font-weight:700}</style></head>
<body><main><nav><a href="${up}">← All games</a></nav><h1>${esc(pg.h1)}</h1>${g ? `<p class="by">by ${STUDIO}</p>` : ''}${embed}
<div class="box">${pg.body.map((p) => `<p>${p}</p>`).join('')}</div>${cardsHtml ? `<div class="grid">${cardsHtml}</div>` : ''}</main>${footer(up)}</body></html>`;
  mkdirSync(resolve(root, 'dist', pg.path), { recursive: true });
  writeFileSync(resolve(root, 'dist', pg.path, 'index.html'), html);
}
const urls = ['', ...catalog.map((g) => `${g.slug}/`), ...pages.map((p) => `${p.path}/`)];
if (site) writeFileSync(resolve(root, 'dist', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${site}/${u}</loc></url>`).join('')}</urlset>\n`);
writeFileSync(resolve(root, 'dist', 'robots.txt'), `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);
console.log(`✔ ${pages.length} páginas SEO${site ? ' + sitemap.xml' : ' (sin SITE_URL: sin sitemap)'} + robots.txt`);
