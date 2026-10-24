// Genera una versión de un solo archivo del panel (para publicarla como página en claude.ai).
// Misma información que la web de Vercel; navegación por #ancla.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const raiz = path.resolve(process.cwd(), '..');
const datos = path.resolve(process.cwd(), 'data');
const c = JSON.parse(fs.readFileSync(path.join(datos, 'cartera.json'), 'utf8'));
const lista = JSON.parse(fs.readFileSync(path.join(datos, 'proyectos.json'), 'utf8')).sort((a, b) => a.orden - b.orden);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const euros = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fecha = (iso) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
const md = (archivo) => fs.existsSync(path.join(raiz, archivo)) ? marked.parse(fs.readFileSync(path.join(raiz, archivo), 'utf8'), { async: false }) : '<p>No existe.</p>';
function promptDe(clave) {
  const t = fs.readFileSync(path.join(raiz, 'PROMPTS-SESIONES.md'), 'utf8');
  const i = t.indexOf(`proyectos/${clave}`); if (i < 0) return null;
  const a = t.indexOf('```', i), b = t.indexOf('```', a + 3); return t.slice(a + 3, b).trim();
}
const lis = (arr) => (arr ?? []).map((x) => `<li>${esc(x)}</li>`).join('');
const enlace = (txt, url) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(txt)}</a>` : esc(txt);

let css = fs.readFileSync('app/globals.css', 'utf8');
css = css.replace('--sombra: 0 1px 0 rgba(24, 42, 46, 0.06);', '--sombra: 0 1px 0 rgba(24, 42, 46, 0.06); color-scheme: light;');
css = css.replace(/--sombra: none;\n  }\n}/, '--sombra: none; color-scheme: dark;\n  }\n}');
css = css.replace(/--rojo: #e07a70; --sombra: none;\n}/, '--rojo: #e07a70; --sombra: none; color-scheme: dark;\n}');
css = css.replace(/padding: 1\.1rem 16px; max-width: 1100px;/, 'padding: 1.1rem 0; max-width: 1100px;')
         .replace(/\.contenido \{ max-width: 1100px; margin: 0 auto; padding: 0 16px 3rem; \}/, '.contenido { max-width: 1100px; margin: 0 auto; padding: 0 0 3rem; }')
         .replace(/\.pie \{ max-width: 1100px; margin: 0 auto; padding: 1\.5rem 16px 2\.5rem;/, '.pie { max-width: 1100px; margin: 0 auto; padding: 1.5rem 0 2.5rem;');
css += `
.pagina { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 0 1rem; }
.vista[hidden] { display: none !important; }
.aviso-instantanea { font-size: 0.85rem; color: var(--tinta-2); margin: 0 0 1rem; }
`;

const actual = lista.reduce((s, p) => s + p.ingresosMes, 0);
const costes = lista.reduce((s, p) => s + p.costesMes, 0) + c.costesFijosMes;
const previsto = lista.reduce((s, p) => s + p.objetivoMes12, 0);
const max = Math.max(...c.objetivos.map((h) => h.mensual), previsto, 1);
const pct = (n) => `${Math.min(100, (n / max) * 100)}%`;
const hitosOrd = [...c.objetivos].sort((a, b) => a.mensual - b.mensual);

const inicio = `
<section class="camino" aria-label="Camino hacia la libertad financiera">
  <div class="camino-cifra"><span class="camino-num">${euros(actual)}</span><span class="camino-sub">al mes, recurrentes, hoy</span></div>
  <div class="pista" role="img" aria-label="Ingresos actuales ${euros(actual)} al mes; previstos en el mes 12 ${euros(previsto)}">
    <div class="pista-previsto" style="width:${pct(previsto)}"></div><div class="pista-real" style="width:${pct(actual)}"></div>
    ${c.objetivos.map((h) => `<div class="hito" style="left:${pct(h.mensual)}"><span class="hito-marca"></span><span class="hito-texto"><b>${euros(h.mensual)}</b> ${esc(h.nombre)}<small>${esc(h.plazo)}</small></span></div>`).join('')}
  </div>
  <ul class="hitos-lista" aria-hidden="true">${hitosOrd.map((h) => `<li><b>${euros(h.mensual)}</b> ${esc(h.nombre)} <small>${esc(h.plazo)}</small></li>`).join('')}</ul>
  <p class="camino-leyenda"><span class="leyenda-real"></span> ingresos reales <span class="leyenda-previsto"></span> previsión del mes 12 en el escenario prudente (${euros(previsto)})</p>
</section>
<section class="cifras">
  <div><b>${euros(costes)}</b><span>costes al mes</span></div><div><b>${euros(actual - costes)}</b><span>resultado al mes</span></div>
  <div><b>${euros(c.inversionAcumulada)}</b><span>invertido hasta hoy</span></div><div><b>${lista.filter((p) => p.estado !== 'pendiente' && p.estado !== 'descartado').length} de ${lista.length}</b><span>proyectos en marcha</span></div>
</section>
<div class="dos">
  <section><h2>Lo que te toca a ti</h2><ol class="tareas">${c.decisionesPendientes.map((d) => `<li>${esc(d.texto)} ${d.donde ? (d.donde.startsWith('http') ? `<a href="${esc(d.donde)}" target="_blank" rel="noopener">abrir</a>` : `<span class="donde">${esc(d.donde)}</span>`) : ''}</li>`).join('')}</ol>
  ${lista.filter((p) => p.fechaLimite).map((p) => `<p class="aviso"><b>${esc(p.nombre)}</b> tiene fecha límite el ${fecha(p.fechaLimite)}.</p>`).join('')}</section>
  <section><h2>Cómo funciona</h2><ul class="reglas">${lis(c.reglas)}</ul><p class="nota">Escenario de marketing: ${esc(c.escenario)}. Actualizado el ${fecha(c.actualizado)}.</p></section>
</div>
<section><h2>Los proyectos</h2><div class="libro">
  <div class="fila fila-cab"><span>Proyecto</span><span>Estado</span><span>Ingresos</span><span>Objetivo mes 12</span><span>Última acción</span></div>
  ${lista.map((p) => { const u = [...p.acciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0]; return `<a href="#${p.clave}" class="fila estado-${p.estado.replace(' ', '-')}"><span class="fila-nombre"><span class="letra">${esc(p.letra)}</span><span><b>${esc(p.nombre)}</b><small>${esc(p.marca)}</small></span></span><span><span class="pastilla">${esc(p.estado)}</span></span><span class="num" data-etiqueta="Ingresos">${euros(p.ingresosMes)}<small>/mes</small></span><span class="num" data-etiqueta="Objetivo mes 12">${euros(p.objetivoMes12)}<small>/mes</small></span><span class="accion">${u ? `${esc(u.texto)}<small>${fecha(u.fecha)}</small>` : '<small>sin acciones</small>'}</span></a>`; }).join('')}
</div></section>`;

function lider(l, titulo) {
  if (!l) return '';
  const m = l.modelo ?? {};
  const filas = [['Qué promete', m.propuesta], ['Precio', m.precio], ['Embudo', m.embudo], ['Retención', m.retencion], ['Captación', m.adquisicion], ['Tecnología', m.tecnologia], ['Cifras', m.metricas]].filter(([, v]) => v);
  const bloque = (t, arr) => arr?.length ? `<div class="lider-bloque"><h3>${t}</h3><ul>${lis(arr)}</ul></div>` : '';
  return `<section class="lider"><h2>${titulo}</h2><p class="lider-cab"><b>${enlace(l.nombre, l.url)}</b> ${esc(l.porQue ?? '')}</p>
  <dl class="lider-modelo">${filas.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}${m.funciones?.length ? `<div><dt>Funciones</dt><dd><ol class="compacta">${lis(m.funciones)}</ol></dd></div>` : ''}</dl>
  <div class="lider-grid">${bloque('Lo que le funciona', l.loQueFunciona)}${bloque('Donde falla', l.loQueFalla)}</div>
  <div class="lider-grid tres">${bloque('Copiamos', l.copiar)}${bloque('Mejoramos', l.mejorar)}${bloque('Adaptamos', l.adaptar)}</div>
  ${l.planAccion?.length ? `<div class="lider-bloque plan"><h3>Plan para superarlo</h3><ol class="tareas">${lis(l.planAccion)}</ol></div>` : ''}</section>`;
}

const fichas = lista.map((p) => {
  const acciones = [...p.acciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const cpo = p.margenCliente > 0 ? Math.ceil(p.objetivoMes12 / p.margenCliente) : null;
  const res = p.ingresosMes - p.costesMes;
  const prompt = promptDe(p.clave);
  const tabla = (cab, filas) => filas.length ? `<table class="tabla"><thead><tr>${cab.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table>` : '<p class="vacio">Pendiente de investigación.</p>';
  return `<section class="vista ficha" id="v-${p.clave}" hidden>
  <p class="volver"><a href="#inicio">Todos los proyectos</a></p>
  <header class="ficha-cab"><span class="letra grande">${esc(p.letra)}</span><div><h1>${esc(p.nombre)}</h1><p class="resumen">${esc(p.resumen)}</p><p class="meta"><span class="pastilla">${esc(p.estado)}</span> ${esc(p.marca)}${p.fechaLimite ? ` · fecha límite ${fecha(p.fechaLimite)}` : ''}</p></div></header>
  <section class="rentabilidad"><div><b>${euros(p.ingresosMes)}</b><span>ingresos al mes</span></div><div><b>${euros(p.costesMes)}</b><span>costes al mes</span></div><div class="${res < 0 ? 'rojo' : ''}"><b>${euros(res)}</b><span>resultado</span></div><div><b>${p.clientes}</b><span>clientes</span></div><div><b>${euros(p.objetivoMes12)}</b><span>objetivo mes 12</span></div><div><b>${cpo ?? '—'}</b><span>${cpo ? 'clientes para llegar' : 'depende de la plataforma'}</span></div></section>
  <p class="modelo"><b>Cómo cobra:</b> ${esc(p.modelo)}. <b>Cómo llegan:</b> ${esc(p.canal)}.</p>
  <div class="dos"><div>
    <section><h2>Últimas acciones</h2><ol class="linea">${acciones.map((a) => `<li><time>${fecha(a.fecha)}</time> ${esc(a.texto)}</li>`).join('')}</ol></section>
    <section><h2>Próximos pasos</h2><ul>${lis(p.proximos)}</ul></section>
    <section><h2>Mercados de salida</h2>${p.expansion?.length ? `<ol class="tareas">${lis(p.expansion)}</ol>` : '<p class="vacio">Solo España por ahora.</p>'}</section>
    <section><h2>Lo que te toca a ti</h2>${p.paraMoises.length ? `<ol class="tareas">${lis(p.paraMoises)}</ol>` : '<p class="vacio">Nada.</p>'}</section>
  </div><div>
    <section><h2>Mejoras posibles</h2>${p.mejoras.length ? `<ul>${lis(p.mejoras)}</ul>` : '<p class="vacio">Pendiente.</p>'}</section>
    <section><h2>Hallazgos</h2>${p.hallazgos.length ? `<ul>${lis(p.hallazgos)}</ul>` : '<p class="vacio">Pendiente.</p>'}</section>
  </div></div>
  ${lider(p.lider, 'Ingeniería inversa del líder')}${lider(p.segundoLider, 'Segundo referente')}
  <section><h2>Competencia</h2>${tabla(['Quién', 'Precio', 'Dónde flaquea'], p.competidores.map((x) => `<tr><td>${enlace(x.nombre, x.url)}</td><td>${esc(x.precio ?? '—')}</td><td>${esc(x.debilidad ?? '—')}</td></tr>`).join(''))}</section>
  <section><h2>Código abierto reutilizable</h2>${tabla(['Repositorio', 'Licencia', 'Para qué'], p.repos.map((r) => `<tr><td>${enlace(r.nombre, r.url)}${r.estrellas ? `<small> ${esc(r.estrellas)}</small>` : ''}</td><td>${esc(r.licencia ?? '—')}</td><td>${esc(r.uso ?? '—')}</td></tr>`).join(''))}</section>
  <section><h2>Prompt de la sesión</h2>${prompt ? `<button type="button" class="boton" data-copiar="pr-${p.clave}">Copiar prompt</button><pre class="prompt" id="pr-${p.clave}">${esc(prompt)}</pre>` : '<p class="vacio">Sin prompt.</p>'}</section>
</section>`;
}).join('');

const docs = [['plan', 'CARTERA.md'], ['viabilidad', 'VIABILIDAD.md'], ['reglas', 'SESIONES.md'], ['prompts', 'PROMPTS-SESIONES.md']]
  .map(([slug, archivo]) => `<section class="vista doc" id="v-${slug}" hidden><p class="volver"><a href="#inicio">Panel</a></p><div class="md">${md(archivo)}</div></section>`).join('');

const html = `<title>La cartera</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style>
<div class="pagina">
<header class="cabecera"><a href="#inicio" class="marca">La cartera</a><nav class="nav"><a href="#plan">Plan</a><a href="#viabilidad">Viabilidad</a><a href="#reglas">Reglas</a><a href="#prompts">Prompts</a></nav></header>
<main class="contenido">
<p class="aviso-instantanea">Copia publicada el ${fecha(new Date().toISOString().slice(0, 10))} desde el repositorio. La versión que se actualiza sola con cada sesión es la de Vercel.</p>
<section class="vista" id="v-inicio">${inicio}</section>
${fichas}
${docs}
</main>
<footer class="pie">Los datos salen del repositorio: cada sesión de proyecto los actualiza al terminar.</footer>
</div>
<script>
(function(){
  var vistas=document.querySelectorAll('.vista');
  function mostrar(){
    var t=(location.hash||'#inicio').slice(1).replace(/[^A-Za-z0-9._~-]/g,'');
    var obj=document.getElementById('v-'+t)||document.getElementById('v-inicio');
    for(var i=0;i<vistas.length;i++){vistas[i].hidden=(vistas[i]!==obj);}
    window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',mostrar); mostrar();
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-copiar]'); if(!b) return;
    var pre=document.getElementById(b.getAttribute('data-copiar')); var txt=pre?pre.textContent:'';
    function ok(){b.textContent='Copiado';setTimeout(function(){b.textContent='Copiar prompt';},1800);}
    try{navigator.clipboard.writeText(txt).then(ok,function(){var r=document.createRange();r.selectNodeContents(pre);var s=getSelection();s.removeAllRanges();s.addRange(r);});}
    catch(err){var r=document.createRange();r.selectNodeContents(pre);var s=getSelection();s.removeAllRanges();s.addRange(r);}
  });
})();
</script>
`;
fs.writeFileSync('instantanea/panel.html', html);
console.log('instantánea escrita:', (html.length / 1024).toFixed(0), 'KB');
