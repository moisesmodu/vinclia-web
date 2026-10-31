// Visuales de cada clase: diapositivas (slide.html), capturas de las presentaciones de Numi Tech (presenta.html)
// y demostraciones del simulador grabadas fotograma a fotograma con reloj virtual (el 3D por software va lento y,
// sin esto, el robot se movería a cámara lenta).
// Uso: node render.mjs <curso> [id-clase …]   (necesita Numimates servido en NUMI_URL, por defecto http://127.0.0.1:5190)
// Salida: out/<curso>/<id>/visual.json + PNG/MP4 por escena.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, '..');
const NUMI = process.env.NUMI_URL || 'http://127.0.0.1:5190', OUT = process.env.OUT || path.join(process.env.WORK || '/home/user/jwork', 'out');
const [curso, ...only] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'cursos', curso + '.json'), 'utf8'));
const STYLE = {
  c1: { logo: 'assets/img/logo-tech-negatiu.svg', logoL: 'assets/img/logo-tech.svg', hero: 'assets/img/hero-robot.webp', char: ['assets/img/bit-wave.webp', 'assets/img/bit-think.webp', 'assets/img/bit-happy.webp'], fin: 'assets/img/bit-win.webp' },
  c2: { logo: 'assets/img/logo-tech-negatiu.svg', logoL: 'assets/img/logo-tech.svg', hero: 'assets/img/hero-robotica.webp', char: ['assets/img/maqueen-happy.webp'], fin: 'assets/img/maqueen-happy.webp' },
  c3: { logo: 'assets/img/logo-tech-negatiu.svg', logoL: 'assets/img/logo-tech.svg', hero: 'assets/img/hero-ia.webp', char: [], fin: null },
  c4: { logo: 'assets/img/logo-tech-negatiu.svg', logoL: 'assets/img/logo-tech.svg', hero: 'assets/img/hero-digital.webp', char: ['assets/img/bit-think.webp', 'assets/img/bit-happy.webp'], fin: 'assets/img/bit-win.webp' },
}[curso];
const SHORT = { c1: 'Programación para niños en casa', c2: 'Robótica con micro:bit y Maqueen', c3: 'IA práctica para autónomos', c4: 'Bienestar digital en familia' }[curso];
const lessons = [{ id: curso + '-promo', sec: 0, n: 0, secT: 'Presentación' }]; C.secciones.forEach((s, si) => s.l.forEach((l, li) => lessons.push({ ...l, sec: si + 1, secT: s.t, n: li + 1 })));

// reloj virtual: performance.now y requestAnimationFrame los mueve __tick(ms)
const VCLOCK = `(()=>{let vt=0,id=0;const q=new Map();performance.now=()=>vt;window.requestAnimationFrame=cb=>{q.set(++id,cb);return id};window.cancelAnimationFrame=i=>q.delete(i);window.__tick=ms=>{vt+=ms;const c=[...q.values()];q.clear();for(const f of c){try{f(vt)}catch(e){}}};})();`;

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader-webgl'] });
const slide = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await slide.goto('file://' + path.join(HERE, 'slide.html')); await slide.evaluate(() => document.fonts.ready);
const snap = async (e, o, file) => { await slide.evaluate(([e, o]) => draw(e, o), [e, o]); await slide.waitForTimeout(60); await slide.screenshot({ path: file, type: 'png' }); };

async function presenta(sid, idx, file) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(`${NUMI}/presenta.html?s=${sid}&l=es&i=${idx}`); await p.addStyleTag({ content: '.pz-ctl{display:none!important}' });
  await p.waitForTimeout(7000); await p.screenshot({ path: file, type: 'png' }); await p.close();
}
// demostración: [robo] (PZ.rrun, simulador del Maqueen) o [demo] (PZ.step cada 650 ms, en Bit); 20 fps
async function demo(sid, idx, dir, mp4) {
  // leer el 3D por software cuesta ~0,8 s por fotograma a 1280×720: 12 fps y se escala a 1080p al final
  const ctx = await browser.newContext({ viewport: { width: +(process.env.DEMO_W || 1280), height: +(process.env.DEMO_W || 1280) * 9 / 16 } }); await ctx.addInitScript(VCLOCK);
  const p = await ctx.newPage(); await p.goto(`${NUMI}/presenta.html?s=${sid}&l=es&i=${idx}`);
  await p.addStyleTag({ content: '.pz-ctl{display:none!important}' });
  for (let k = 0; k < 40; k++) { await p.evaluate(() => __tick(50)); await p.waitForTimeout(150); }   // carga del 3D
  const kind = await p.evaluate(() => document.getElementById('pzr') ? 'robo' : (document.querySelector('.pz-b') ? 'bit' : 'none'));
  if (kind === 'none') { await ctx.close(); return { kind }; }
  fs.mkdirSync(dir, { recursive: true }); let f = 0, prev = null, still = 0; const FPS = +(process.env.DEMO_FPS || 12), DT = 1000 / FPS;
  const shot = async () => { const buf = await p.screenshot({ type: 'jpeg', quality: 85 }); fs.writeFileSync(path.join(dir, `f${String(f++).padStart(4, '0')}.jpg`), buf); still = prev && buf.equals(prev) ? still + 1 : 0; prev = buf; };
  for (let k = 0; k < FPS; k++) { await p.evaluate(dt => __tick(dt), DT); await shot(); }   // 1 s quieto: «predice»
  if (kind === 'robo') await p.evaluate(() => PZ.rrun()); else await p.evaluate(() => PZ.reset && PZ.reset());
  const nb = kind === 'bit' ? await p.evaluate(() => document.querySelectorAll('.pz-b').length) : 0;
  let t = 0, nextStep = 0; const MAX = kind === 'bit' ? Math.min(30000, nb * 900 + 3000) : 16000;
  while (t < MAX) {
    if (kind === 'bit' && t >= nextStep) { await p.evaluate(() => PZ.step()); nextStep += 650; }
    await p.evaluate(dt => __tick(dt), DT); t += DT; await shot();
    if (t > 2500 && still > FPS * 1.2) break;
  }
  for (let k = 0; k < FPS; k++) await shot();   // 1 s final
  await ctx.close();
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '22', '-preset', 'veryfast', mp4]);
  fs.rmSync(dir, { recursive: true }); return { kind, mp4 };
}

const NREV = e => ({ puntos: (e.puntos || []).length, pasos: (e.pasos || []).length, resumen: (e.puntos || []).length, tabla: (e.filas || []).length, chat: 2, comparar: 2 })[e.tipo] || 0;
for (const L of lessons) {
  if (only.length && !only.includes(L.id)) continue;
  const gf = path.join(process.env.GUIONES || path.join(ROOT, 'guiones', curso), L.id + '.json'); if (!fs.existsSync(gf)) { console.log('sin guion', L.id); continue; }
  const G = JSON.parse(fs.readFileSync(gf, 'utf8')), dir = path.join(OUT, curso, L.id); fs.mkdirSync(dir, { recursive: true });
  const vis = [];
  for (const [i, e] of G.escenas.entries()) {
    const base = path.join(dir, `e${String(i + 1).padStart(2, '0')}`);
    const o = { color: C.color, color2: C.color2, curso: SHORT, pie: L.sec ? `Sección ${L.sec} · Clase ${L.n}` : 'Presentación del curso', logo: e.tipo === 'portada' ? STYLE.logo : STYLE.logoL,
      kicker: e.tipo === 'portada' ? (L.sec ? `Sección ${L.sec} · ${L.secT}` : 'Curso en vídeo') : '', hero: STYLE.hero };
    if (['puntos', 'resumen'].includes(e.tipo) && STYLE.char.length && (e.puntos || []).length <= 4) o.char = e.tipo === 'resumen' ? STYLE.fin : STYLE.char[i % STYLE.char.length];
    if (e.tipo === 'captura' || e.tipo === 'demo') {
      const [, sid, idx] = e.fuente.split(':');
      if (e.tipo === 'demo') {
        const mp4 = base + '.mp4';
        if (!fs.existsSync(mp4)) await demo(sid, +idx, base + '_f', mp4);
        if (fs.existsSync(mp4)) { vis.push({ k: 'video', file: mp4 }); continue; }
        if (!fs.existsSync(base + '.png')) await presenta(sid, +idx, base + '.png');   // no era una demo: captura
        vis.push({ k: 'img', frames: [{ at: 0, png: base + '.png' }] }); continue;
      }
      if (!fs.existsSync(base + '.png')) await presenta(sid, +idx, base + '.png');
      vis.push({ k: 'img', frames: [{ at: 0, png: base + '.png' }] }); continue;
    }
    const n = NREV(e), frames = [];
    if (n) for (let r = 1; r <= n; r++) { const f = `${base}_${r}.png`; await snap(e, { ...o, reveal: r }, f); frames.push({ at: (r - 1) / n * 0.75, png: f }); }
    else { await snap(e, o, base + '.png'); frames.push({ at: 0, png: base + '.png' }); }
    vis.push({ k: 'img', frames });
  }
  fs.writeFileSync(path.join(dir, 'visual.json'), JSON.stringify(vis, null, 1)); console.log('visual', L.id, vis.length);
}
await browser.close();
