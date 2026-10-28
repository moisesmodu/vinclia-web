// Recursos descargables de cada clase: fichas imprimibles de Numi Tech en castellano (imprimeix.html → PDF A4) y, en el
// curso 3, las plantillas Markdown de guiones/c3/plantillas → PDF con el mismo estilo.
// Uso: node recursos.mjs <curso>     Salida: entrega/<curso>/recursos/*.pdf y recursos.json (clase → archivos)
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, '..');
const NUMI = process.env.NUMI_URL || 'http://127.0.0.1:5190', ENT = process.env.ENTREGA || '/home/user/jwork/entrega';
const curso = process.argv[2], gdir = path.join(ROOT, 'guiones', curso), out = path.join(ENT, curso, 'recursos');
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(), map = {};
const md2html = md => {
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inl = s => e(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  let h = '', list = null;
  for (const l of md.split('\n')) {
    const m = l.match(/^(#{1,3}) (.*)/), li = l.match(/^\s*(?:[-*]|\d+\.) (.*)/);
    if (!li && list) { h += `</${list}>`; list = null; }
    if (m) h += `<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`;
    else if (li) { const t = /^\s*\d+\./.test(l) ? 'ol' : 'ul'; if (!list) { h += `<${t}>`; list = t; } h += `<li>${inl(li[1])}</li>`; }
    else if (l.startsWith('>')) h += `<blockquote>${inl(l.slice(1).trim())}</blockquote>`;
    else if (l.trim()) h += `<p>${inl(l)}</p>`;
  }
  return h + (list ? `</${list}>` : '');
};
const CSS = `@font-face{font-family:Lexend;font-weight:100 900;src:url(file://${HERE}/assets/fonts/Lexend-latin-c0dd90.woff2)}
body{font-family:Lexend,sans-serif;color:#14204A;font-size:11.5pt;line-height:1.5;margin:0}h1{font-size:22pt;color:#7C4DFF;margin:0 0 6pt}
h2{font-size:14.5pt;margin:16pt 0 4pt;color:#14204A;border-bottom:2px solid #E6DEFF;padding-bottom:3pt}h3{font-size:12pt;margin:12pt 0 2pt}
code{background:#F1ECFF;padding:1pt 4pt;border-radius:4pt}blockquote{background:#F6F3FF;border-left:4pt solid #7C4DFF;margin:6pt 0;padding:6pt 10pt;white-space:pre-wrap}
li{margin:2pt 0}.pie{margin-top:18pt;font-size:9pt;color:#56628A}`;
for (const f of fs.readdirSync(gdir).filter(f => /^c\d-\d+\.json$/.test(f)).sort()) {
  const G = JSON.parse(fs.readFileSync(path.join(gdir, f), 'utf8'));
  for (const r of G.recursos || []) {
    const [k, v] = r.split(':'); let file;
    if (k === 'imprimible') {
      file = `fichas-${v}.pdf`;
      if (!fs.existsSync(path.join(out, file))) {
        const p = await b.newPage(); await p.goto(`${NUMI}/imprimeix.html?s=${v}&l=es`); await p.addStyleTag({ content: '.pbar{display:none!important}' });
        await p.waitForTimeout(3500); await p.pdf({ path: path.join(out, file), format: 'A4', printBackground: true, preferCSSPageSize: true }); await p.close();
      }
    } else if (k === 'plantilla') {
      file = `${v}.pdf`; const src = path.join(gdir, 'plantillas', v + '.md');
      if (!fs.existsSync(src)) { console.log('falta plantilla', v); continue; }
      const p = await b.newPage(); await p.setContent(`<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${md2html(fs.readFileSync(src, 'utf8'))}<p class="pie">IA práctica para autónomos y pequeños negocios · Plantilla descargable. La IA redacta, tú decides: revisa siempre cifras, nombres y datos legales.</p></body></html>`);
      await p.evaluate(() => document.fonts.ready); await p.pdf({ path: path.join(out, file), format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' }, printBackground: true }); await p.close();
    } else continue;
    (map[G.id] ||= []).push(file);
  }
}
fs.writeFileSync(path.join(out, 'recursos.json'), JSON.stringify(map, null, 1)); await b.close();
console.log(curso, Object.values(map).flat().length, 'recursos');
