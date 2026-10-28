// Puerta de calidad: compila (si hace falta), sirve dist/<sitio> en local y pasa Lighthouse en móvil
// a una muestra de páginas de cada tipo. Falla si alguna categoría baja de 95.
//   node scripts/lighthouse.mjs nomina impuestos
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const ejecutar = promisify(execFile);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const sitios = process.argv.slice(2).length ? process.argv.slice(2) : ['nomina', 'impuestos'];
const MUESTRA = {
  nomina: ['/', '/calculadora-sueldo-neto/', '/ca/calculadora-sou-net/', '/calculadora-finiquito/', '/calculadora-paro/', '/datos/tabla-sueldo-neto/', '/sueldo-neto-30000-euros-brutos/', '/ca/sou-net-catalunya/'],
  impuestos: ['/', '/calculadora-irpf/', '/ca/calculadora-irpf/', '/calculadora-factura/', '/verifactu-obligacion-fecha/', '/datos/tramos-irpf-comunidades/', '/irpf-cataluna/', '/ca/irpf-30000-euros-bruts/'],
};
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.xml': 'application/xml', '.txt': 'text/plain', '.csv': 'text/csv', '.svg': 'image/svg+xml' };

function servir(dir, puerto) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      let p = join(dir, decodeURIComponent(req.url.split('?')[0]));
      try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); } catch { res.writeHead(404); return res.end(); }
      try { const b = await readFile(p); res.writeHead(200, { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' }); res.end(b); }
      catch { res.writeHead(404); res.end(); }
    }).listen(puerto, () => ok(s));
  });
}

const salida = [];
let fallo = false;
await mkdir('informes', { recursive: true });
for (const [i, sitio] of sitios.entries()) {
  const puerto = 4400 + i;
  const srv = await servir(`dist/${sitio}`, puerto);
  for (const ruta of MUESTRA[sitio]) {
    const url = `http://localhost:${puerto}${ruta}`;
    const { stdout: json } = await ejecutar('npx', ['lighthouse', url, `--chrome-path=${CHROME}`, '--chrome-flags=--headless=new --no-sandbox', '--output=json', '--quiet', '--only-categories=performance,accessibility,best-practices,seo'], { maxBuffer: 1e8, env: { ...process.env, CHROME_PATH: CHROME } });
    const r = JSON.parse(json);
    const c = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const m = { lcp: r.audits['largest-contentful-paint'].displayValue, cls: r.audits['cumulative-layout-shift'].displayValue, tbt: r.audits['total-blocking-time'].displayValue };
    const fila = { sitio, ruta, ...c, ...m };
    salida.push(fila);
    if (Object.values(c).some((x) => x < 95)) fallo = true;
    console.log(JSON.stringify(fila));
  }
  srv.close();
}
await writeFile('informes/lighthouse.json', JSON.stringify({ fecha: new Date().toISOString(), resultados: salida }, null, 2));
if (fallo) { console.error('Alguna página baja de 95'); process.exit(1); }
