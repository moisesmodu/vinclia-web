// Genera public/og/<locale>.jpg (1200x630) para WhatsApp, Facebook y Telegram: foto, promesa, precio y marca.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node-tools/node_modules/playwright'); }
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const b64 = (f) => readFileSync(path.join(raiz, f)).toString('base64');
const foto = `data:image/webp;base64,${b64('public/img/hero.webp')}`;
const logo = `data:image/svg+xml;base64,${b64('public/marca/logo.svg')}`;
mkdirSync(path.join(raiz, 'public/og'), { recursive: true });
const L = ['es', 'ca', 'ar', 'fr', 'en', 'ro', 'zh', 'uk'];
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const l of L) {
  const m = JSON.parse(readFileSync(path.join(raiz, `messages/${l}.json`), 'utf8'));
  const es = JSON.parse(readFileSync(path.join(raiz, 'messages/es.json'), 'utf8'));
  const t = (k) => m[k] ?? es[k];
  const rtl = l === 'ar';
  await p.setContent(`<!doctype html><html lang="${l}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700&family=Noto+Sans:wght@400;700&family=Noto+Sans+Arabic:wght@700&family=Noto+Sans+SC:wght@700&display=swap" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;display:flex;background:#FBF5EC;font-family:Outfit,'Noto Sans','Noto Sans Arabic','Noto Sans SC',sans-serif;color:#1F2A44}
.t{flex:1;padding:56px 56px;display:flex;flex-direction:column;justify-content:space-between}
h1{font-size:${l === 'zh' ? 56 : 54}px;line-height:1.08;font-weight:700}
.c{display:flex;gap:12px;flex-wrap:wrap;font:700 24px 'Noto Sans','Noto Sans Arabic','Noto Sans SC',sans-serif}
.c span{background:#fff;border:2px solid #EADFCD;border-radius:999px;padding:8px 18px}.c .p{background:#B4492A;color:#fff;border-color:#B4492A}
img.f{width:440px;height:630px;object-fit:cover}</style></head><body>
<div class="t"><img src="${logo}" style="height:52px;align-self:flex-start" dir="ltr"><h1>${t('lema')}</h1>
<div class="c"><span>${t('home.confianza1')}</span><span>${t('home.confianza2')}</span><span class="p">${t('home.fijo')}</span></div></div>
<img class="f" src="${foto}"></body></html>`, { waitUntil: 'networkidle' });
  await p.screenshot({ path: path.join(raiz, `public/og/${l}.jpg`), type: 'jpeg', quality: 82 });
}
await b.close();
console.log('og ok');
