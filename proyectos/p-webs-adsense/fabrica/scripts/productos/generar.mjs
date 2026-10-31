// Genera los productos de pago de productos.json de principio a fin:
//   1. el Excel (y una copia de demostración con datos de ejemplo) con su script de Python, que lee los parámetros;
//   2. el PDF, imprimiendo con Playwright el HTML que deja el script (productos/<id>/fuente/*.html);
//   3. las capturas de la página de venta: hojas del Excel de demostración y páginas del PDF (rasterizar.py),
//      enmarcadas con Playwright y convertidas a WebP en public/productos/<id>/ con su indice.json.
//
//   node scripts/productos/generar.mjs                 → todos
//   node scripts/productos/generar.mjs pack-despido     → solo ese
//   CAPTURAS_DIR=/ruta node scripts/productos/generar.mjs → además copia las capturas en PNG a esa carpeta
//
// Requisitos: Python 3 con openpyxl, pypdfium2 y Pillow; LibreOffice (soffice); Playwright con Chromium.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const productos = JSON.parse(readFileSync('productos.json', 'utf8')).productos;
const elegidos = process.argv.slice(2);
const lista = elegidos.length ? productos.filter((p) => elegidos.includes(p.id)) : productos;
const py = (...a) => execFileSync('python3', a, { stdio: 'inherit' });
const sitio = (id) => JSON.parse(readFileSync(`sitios/${id}/sitio.json`, 'utf8'));
const b64 = (p) => readFileSync(p).toString('base64');
const fuentes = `@font-face{font-family:Manrope;font-weight:700;src:url(data:font/woff2;base64,${b64('node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff2')})}`
  + `@font-face{font-family:Inter;font-weight:500;src:url(data:font/woff2;base64,${b64('node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2')})}`;

const nav = await chromium.launch();
try {
  for (const p of lista) {
    console.log(`\n== ${p.id}`);
    py(`scripts/productos/${p.script}`, '--demo');
    // PDF desde el HTML del script
    const pdf = p.archivos.find((a) => a.tipo === 'pdf');
    const html = join('productos', p.id, 'fuente', pdf.archivo.replace(/\.pdf$/, '.html'));
    const pag = await nav.newPage();
    await pag.setContent(readFileSync(html, 'utf8'), { waitUntil: 'load' });
    await pag.evaluate(() => document.fonts.ready);
    await pag.pdf({ path: join('productos', p.id, pdf.archivo), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    await pag.close();
    console.log(`PDF: productos/${p.id}/${pdf.archivo}`);

    // Capturas
    py('scripts/productos/rasterizar.py', p.id);
    const dir = join('productos', p.id, 'capturas');
    const indice = JSON.parse(readFileSync(join(dir, 'indice.json'), 'utf8'));
    const c = sitio(p.sitio).colores;
    const pub = join('public', 'productos', p.id);
    rmSync(pub, { recursive: true, force: true });
    mkdirSync(pub, { recursive: true });
    const marco = await nav.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 });
    const salida = [];
    for (const [k, im] of indice.entries()) {
      const etiqueta = im.tipo === 'hoja' ? `${im.archivo} · ${im.hoja}` : `${im.archivo} · página ${im.pagina}`;
      const icono = im.tipo === 'hoja'
        ? `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#1D7044"/><path d="M4 4l3 4-3 4h2l2-2.7L10 12h2L9 8l3-4h-2L8 6.7 6 4z" fill="#fff"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#C8372D"/><text x="8" y="11.5" font-size="7" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">PDF</text></svg>`;
      await marco.setContent(`<!doctype html><html><head><style>${fuentes}
        body{margin:0;padding:28px;background:linear-gradient(135deg,${c.tenue},#fff)}
        .v{width:840px;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 18px 50px -18px rgba(10,30,30,.35),0 0 0 1px ${c.borde}}
        .t{display:flex;align-items:center;gap:8px;padding:10px 14px;background:${c.cabecera};color:#fff;font:500 13px Inter,Arial}
        .t i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.28);display:inline-block}
        .t span{margin-left:8px;display:flex;align-items:center;gap:8px;opacity:.92}
        img{display:block;width:100%}</style></head><body><div class="v" id="v"><div class="t"><i></i><i></i><i></i><span>${icono}${etiqueta}</span></div>
        <img src="data:image/png;base64,${b64(join(dir, im.png))}"></div></body></html>`, { waitUntil: 'load' });
      const png = await marco.locator('#v').screenshot({ type: 'png' });
      const tmp = join(dir, `marco-${k + 1}.png`);
      writeFileSync(tmp, png);
      salida.push({ ...im, marco: tmp, n: k + 1 });
    }
    await marco.close();
    // WebP en dos anchos (Lighthouse: imágenes del tamaño justo)
    const conv = execFileSync('python3', ['-c', `
import json,sys
from PIL import Image
out=[]
for s in json.loads(sys.argv[1]):
    im=Image.open(s['marco']).convert('RGB')
    r={'n':s['n'],'alt':s['alt'],'tipo':s['tipo'],'ancho':im.width,'alto':im.height,'webp':{}}
    for w in (640,1280):
        h=round(im.height*w/im.width)
        p=f"${pub}/{s['n']}-{w}.webp"
        im.resize((w,h),Image.LANCZOS).save(p,'WEBP',quality=82,method=6)
        r['webp'][str(w)]=p.split('public/')[1]
    out.append(r)
print(json.dumps(out,ensure_ascii=False))
`, JSON.stringify(salida)], { encoding: 'utf8' });
    writeFileSync(join(pub, 'indice.json'), JSON.stringify(JSON.parse(conv), null, 2) + '\n');
    console.log(`Capturas: ${pub} (${salida.length})`);
    if (process.env.CAPTURAS_DIR) {
      mkdirSync(process.env.CAPTURAS_DIR, { recursive: true });
      for (const s of salida) copyFileSync(s.marco, join(process.env.CAPTURAS_DIR, `${p.id}-${s.n}-${s.tipo}.png`));
    }
  }
} finally {
  await nav.close();
}
