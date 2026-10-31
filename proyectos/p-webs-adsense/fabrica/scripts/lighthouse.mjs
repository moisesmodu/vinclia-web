// Puerta de calidad: compila (si hace falta), sirve dist/<sitio> en local y pasa Lighthouse en móvil
// a una muestra de páginas de cada tipo. Falla si alguna categoría baja de 95.
//   node scripts/lighthouse.mjs nomina impuestos eeuu
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const ejecutar = promisify(execFile);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const sitios = process.argv.slice(2).length ? process.argv.slice(2) : ['nomina', 'impuestos'];
const MUESTRA = {
  nomina: ['/', '/calculadora-sueldo-neto/', '/ca/calculadora-sou-net/', '/calculadora-finiquito/', '/calculadora-paro/', '/datos/tabla-sueldo-neto/', '/sueldo-neto-30000-euros-brutos/', '/ca/sou-net-catalunya/', '/sueldo-neto-30000-euros-madrid/', '/ca/indemnitzacio-acomiadament-improcedent-5-anys/', '/calendario-laboral-2027-malaga/', '/ca/calendari-laboral-2027-catalunya/'],
  impuestos: ['/', '/calculadora-irpf/', '/ca/calculadora-irpf/', '/calculadora-factura/', '/verifactu-obligacion-fecha/', '/datos/tramos-irpf-comunidades/', '/irpf-cataluna/', '/ca/irpf-30000-euros-bruts/', '/cuota-autonomos-tramo-8/', '/ca/iva-llum/'],
  portal: ['/', '/aviso-legal/'],
  eeuu: ['/', '/calculadora-cheque-de-pago/', '/cheque-de-pago-texas/', '/calculadora-reembolso-taxes/', '/datos/tramos-impuestos-federales/', '/cheque-de-pago-florida-60000/', '/20-dolares-la-hora-al-ano/', '/impuesto-estatal-nueva-york/', '/credito-por-hijos-2-hijos/'],
  vivienda: ['/', '/simulador-hipoteca/', '/ca/simulador-hipoteca/', '/calculadora-gastos-compraventa/', '/datos/euribor-historico/', '/hipoteca-200000-euros-30-anos/', '/ca/despeses-compra-habitatge-catalunya/'],
};
// Páginas de venta de los productos propios (productos.json), con su versión en catalán donde la hay
const PRODUCTOS = { nomina: ['/pack-despido-finiquito/', '/ca/pack-acomiadament-quitanca/'], impuestos: ['/kit-autonomo-2027/', '/ca/kit-autonom-2027/'], vivienda: ['/comparador-hipotecas-excel/', '/ca/comparador-hipoteques-excel/'], eeuu: ['/planificador-taxes-2026/'] };
for (const [k, v] of Object.entries(PRODUCTOS)) MUESTRA[k] = process.env.SOLO_PRODUCTOS ? v : [...MUESTRA[k], ...v];
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

async function medir(url) {
  const { stdout: json } = await ejecutar('npx', ['lighthouse', url, `--chrome-path=${CHROME}`, '--chrome-flags=--headless=new --no-sandbox', '--output=json', '--quiet', '--only-categories=performance,accessibility,best-practices,seo'], { maxBuffer: 1e8, env: { ...process.env, CHROME_PATH: CHROME } });
  const r = JSON.parse(json);
  return {
    c: Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
    m: { lcp: r.audits['largest-contentful-paint'].displayValue, cls: r.audits['cumulative-layout-shift'].displayValue, tbt: r.audits['total-blocking-time'].displayValue },
  };
}

const salida = [];
let fallo = false;
await mkdir('informes', { recursive: true });
for (const [i, sitio] of sitios.entries()) {
  const puerto = 4400 + i;
  const srv = await servir(`dist/${sitio}`, puerto);
  // Una medición de calentamiento que se descarta: el primer arranque de Chrome en un equipo frío infla el TBT.
  if (i === 0) await medir(`http://localhost:${puerto}${MUESTRA[sitio][0]}`).catch(() => {});
  for (const ruta of MUESTRA[sitio]) {
    const url = `http://localhost:${puerto}${ruta}`;
    // Como Lighthouse CI: si alguna categoría baja de 95, dos mediciones más y se toma la mediana de cada categoría.
    const runs = [await medir(url)];
    if (Object.values(runs[0].c).some((x) => x < 95)) { runs.push(await medir(url)); runs.push(await medir(url)); }
    const mediana = (k) => runs.map((r) => r.c[k]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    const c = Object.fromEntries(Object.keys(runs[0].c).map((k) => [k, mediana(k)]));
    const fila = { sitio, ruta, ...c, ...runs[runs.length - 1].m, mediciones: runs.length };
    salida.push(fila);
    if (Object.values(c).some((x) => x < 95)) fallo = true;
    console.log(JSON.stringify(fila));
  }
  srv.close();
}
await writeFile('informes/lighthouse.json', JSON.stringify({ fecha: new Date().toISOString(), resultados: salida }, null, 2));
if (fallo) { console.error('Alguna página baja de 95'); process.exit(1); }
