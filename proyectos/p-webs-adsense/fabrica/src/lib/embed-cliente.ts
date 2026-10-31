// Navegador, solo en /embed/…: marca blanca (?pro=) y altura del iframe para la web que lo incrusta.
// El color (?color=) y el tema (?tema=) se aplican antes, con un script en línea en <head>, para que no parpadee.
import { leerOpciones, resolverPro, logoValido, type MapaPro } from './embed';

const raiz = document.documentElement;
const caja = document.querySelector<HTMLElement>('.emb')!;
const o = leerOpciones(location.search);

// Origen de la web que incrusta: ancestorOrigins (no lo puede falsear la página padre) o, si no existe, el referrer
let padre = '';
try { padre = (location as any).ancestorOrigins?.[0] || (document.referrer ? new URL(document.referrer).origin : ''); } catch {}

if (o.pro) {
  let mapa: MapaPro = {};
  try { mapa = JSON.parse(document.getElementById('claro-pro')?.textContent || '{}'); } catch {}
  const c = resolverPro(mapa, o.pro, padre);
  if (c) {
    raiz.dataset.pro = '';
    document.querySelector('.emb-firma')?.remove();
    if (c.c && !o.color) {
      raiz.style.setProperty('--primario', c.c);
      raiz.style.setProperty('--marca', c.c);
      raiz.style.setProperty('--primarioOscuro', `color-mix(in srgb,${c.c} 80%,#000)`);
    }
    if (logoValido(c.l)) {
      const p = document.createElement('p');
      p.className = 'emb-logo';
      const img = document.createElement('img');
      img.src = c.l!; img.alt = ''; img.height = 28; img.decoding = 'async';
      p.append(img);
      caja.prepend(p);
    }
  }
}

// Altura: se manda al padre cada vez que cambia (recalcular, abrir «Situación familiar», girar el móvil…)
let ultima = 0;
const enviar = (forzar = false) => {
  if (window.parent === window) return;
  const h = Math.ceil(caja.getBoundingClientRect().height + parseFloat(getComputedStyle(document.body).marginTop || '0') * 2);
  if (!forzar && h === ultima) return;
  ultima = h;
  window.parent.postMessage({ claro: 'altura', h }, '*');
};
if ('ResizeObserver' in window) new ResizeObserver(() => enviar()).observe(caja);
addEventListener('load', () => enviar(true));
// embed.js saluda al cargar el iframe: a partir de ahí la altura la gestiona el padre y sobran las barras de scroll
addEventListener('message', (e) => {
  if (e.source !== window.parent || (e.data as any)?.claro !== 'hola') return;
  raiz.classList.add('emb-ajustado');
  enviar(true);
});
enviar(true);
