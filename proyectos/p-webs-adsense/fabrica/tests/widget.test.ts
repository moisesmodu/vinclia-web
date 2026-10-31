// Widget para profesionales: validación de claves de marca blanca, opciones por URL, rutas embed, CSS del tema
// y, sobre el sitio compilado (NetoClaro), las páginas /embed/ (noindex, canónica, sin cabecera ni anuncios,
// fuera del sitemap) y las cabeceras que permiten incrustarlas.
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { colorValido, leerOpciones, dominioPermitido, hostDe, resolverPro, logoValido } from '../src/lib/embed';
import { claveCliente, erroresClientes, mapaPro, CLIENTES, rutasEmbed, PLANES, type Cliente } from '../src/lib/widget';
import { temaPorAtributo, minCss } from '../src/lib/cssTema';
import nomina from '../sitios/nomina/sitio.json';

const cli = (cliente: string, dominio: string, extra: Partial<Cliente> = {}): Cliente => ({ cliente, dominio, plan: 'profesional', clave: claveCliente(cliente, dominio), ...extra });

describe('claves de marca blanca', () => {
  it('la clave es el hash de cliente:dominio, estable y de 24 cifras', () => {
    const k = claveCliente('gestoria-puig', 'gestoriapuig.es');
    expect(k).toMatch(/^[0-9a-f]{24}$/);
    expect(claveCliente('gestoria-puig', 'www.GestoriaPuig.es')).toBe(k);
    expect(claveCliente('gestoria-puig', 'otra.es')).not.toBe(k);
  });
  it('widget-clientes.json es válido', () => {
    expect(erroresClientes(CLIENTES)).toEqual([]);
    expect(Object.keys(mapaPro()).length).toBeGreaterThan(0);
  });
  it('detecta claves manipuladas, dominios y colores no válidos, logos peligrosos y planes desbordados', () => {
    expect(erroresClientes([{ ...cli('a', 'a.es'), clave: 'f'.repeat(24) }])[0]).toMatch(/no es el hash/);
    expect(erroresClientes([cli('a', 'no es dominio')]).join()).toMatch(/dominio no válido/);
    expect(erroresClientes([cli('a', 'a.es', { color: 'red' })]).join()).toMatch(/color/);
    expect(erroresClientes([cli('a', 'a.es', { logo: 'javascript:alert(1)' })]).join()).toMatch(/logo/);
    expect(erroresClientes([cli('a', 'a.es'), cli('a', 'b.es')]).join()).toMatch(/admite 1/);
    const agencia = Array.from({ length: 10 }, (_, i) => cli('ag', `c${i}.es`, { plan: 'agencia' }));
    expect(erroresClientes(agencia)).toEqual([]);
    expect(erroresClientes([...agencia, cli('ag', 'c10.es', { plan: 'agencia' })]).join()).toMatch(/admite 10/);
    expect(() => mapaPro([{ ...cli('a', 'a.es'), clave: '0'.repeat(24) }])).toThrow();
  });
  it('los clientes dados de baja no entran en las páginas', () => {
    const m = mapaPro([cli('a', 'a.es'), cli('b', 'b.es', { activo: false })]);
    expect(Object.keys(m)).toEqual([claveCliente('a', 'a.es')]);
    expect(JSON.stringify(m)).not.toMatch(/"a"|notas|cliente/);
  });
  it('la clave solo vale desde el dominio del cliente o sus subdominios', () => {
    const k = claveCliente('a', 'gestoria.es');
    const m = mapaPro([cli('a', 'gestoria.es', { color: '#112233' })]);
    expect(resolverPro(m, k, 'https://gestoria.es')?.c).toBe('#112233');
    expect(resolverPro(m, k, 'https://www.gestoria.es')).not.toBeNull();
    expect(resolverPro(m, k, 'https://blog.gestoria.es')).not.toBeNull();
    expect(resolverPro(m, k, 'https://otra.es')).toBeNull();
    expect(resolverPro(m, k, 'https://xgestoria.es')).toBeNull();
    expect(resolverPro(m, k, 'https://gestoria.es.malo.com')).toBeNull();
    expect(resolverPro(m, k, '')).toBeNull(); // sin origen conocido se falla cerrado
    expect(resolverPro(m, 'f'.repeat(24), 'https://gestoria.es')).toBeNull();
    expect(resolverPro(m, null, 'https://gestoria.es')).toBeNull();
    expect(dominioPermitido('localhost', 'localhost')).toBe(true);
    expect(hostDe('http://localhost:4611/x')).toBe('localhost');
  });
});

describe('opciones por URL', () => {
  it('color: solo hexadecimal (sin inyección de CSS)', () => {
    expect(colorValido('0B6B7A')).toBe('#0b6b7a');
    expect(colorValido('#abc')).toBe('#aabbcc');
    expect(colorValido('red')).toBeNull();
    expect(colorValido('000;}body{display:none')).toBeNull();
  });
  it('tema, clave y valores', () => {
    expect(leerOpciones('?tema=oscuro&color=123456&pro=8227d517ef8da1c04fb6a272&bruto=30000')).toEqual({ color: '#123456', tema: 'oscuro', pro: '8227d517ef8da1c04fb6a272' });
    expect(leerOpciones('?tema=rosa&pro=<script>').tema).toBe('claro');
    expect(leerOpciones('?pro=<script>').pro).toBeNull();
  });
  it('logos admitidos', () => {
    expect(logoValido('https://gestoria.es/logo.svg')).toBe(true);
    expect(logoValido('http://gestoria.es/logo.svg')).toBe(false);
    expect(logoValido('data:image/svg+xml,%3Csvg%3E')).toBe(true);
    expect(logoValido('data:text/html,hola')).toBe(false);
  });
});

describe('rutas y planes', () => {
  it('una página embed por calculadora e idioma, con su calculadora completa', () => {
    for (const lang of ['es', 'ca'] as const) {
      const r = rutasEmbed(lang);
      expect(r.length).toBe(nomina.calculadoras.length);
      expect(new Set(r.map((x) => x.ruta)).size).toBe(r.length);
      for (const x of r) {
        expect(x.ruta).toBe(`${lang === 'es' ? '' : 'ca/'}embed/${x.slug}`);
        expect(x.completa).toBe(`${lang === 'es' ? '' : 'ca/'}${x.slug}`);
      }
    }
  });
  it('precios de los planes', () => {
    expect(PLANES.profesional).toMatchObject({ mes: 9, anio: 90, dominios: 1 });
    expect(PLANES.agencia).toMatchObject({ mes: 29, dominios: 10 });
  });
  it('el modo oscuro del sitio pasa a [data-tema=oscuro] dentro del widget', () => {
    const css = temaPorAtributo('a{x:1}@media (prefers-color-scheme:dark){:root{--f:#000}.b{c:d}}@media print{.c{d:e}}');
    expect(css).toBe('a{x:1}:root[data-tema=oscuro]{&{--f:#000}.b{c:d}}@media print{.c{d:e}}');
    expect(minCss('a { b: c; }\n/* x */ d{e:f}')).toBe('a{b: c}d{e:f}');
  });
});

describe('embed.js y cabeceras', () => {
  it('embed.js pesa menos de 2 KB', () => {
    expect(readFileSync('public/embed.js').length).toBeLessThan(2048);
  });
  it('/embed/ se deja incrustar en cualquier web y el resto solo en el propio sitio (Vercel y Cloudflare)', () => {
    const v = JSON.parse(readFileSync('vercel.json', 'utf8')).headers as { source: string; headers: { key: string; value: string }[] }[];
    const reglas = (ruta: string) => v.filter((h) => new RegExp('^' + h.source.replace(/\(\.\*\)/g, '.*') + '$').test(ruta)).flatMap((h) => h.headers);
    const emb = reglas('/embed/calculadora-sueldo-neto/'), emb2 = reglas('/ca/embed/calculadora-sou-net/'), normal = reglas('/calculadora-sueldo-neto/');
    for (const r of [emb, emb2]) {
      expect(r.find((h) => h.key === 'X-Frame-Options')).toBeUndefined();
      expect(r.find((h) => h.key === 'Content-Security-Policy')?.value).toBe('frame-ancestors *');
    }
    expect(normal.find((h) => h.key === 'X-Frame-Options')?.value).toBe('SAMEORIGIN');
    expect(normal.find((h) => h.key === 'Content-Security-Policy')?.value).toBe("frame-ancestors 'self'");
    const cf = readFileSync('public/_headers', 'utf8');
    expect(cf).toMatch(/\/embed\/\*\n\s+! X-Frame-Options\n\s+! Content-Security-Policy\n\s+Content-Security-Policy: frame-ancestors \*/);
    expect(cf).toMatch(/\/ca\/embed\/\*\n\s+! X-Frame-Options/);
  });
});

// ——— Sitio compilado (NetoClaro). Se compila aquí salvo con WIDGET_DIST_LISTO=1 (dist/nomina ya al día). ———
const DIST = 'dist/nomina';
describe('páginas embed compiladas (NetoClaro)', () => {
  beforeAll(() => {
    if (process.env.WIDGET_DIST_LISTO !== '1' || !existsSync(`${DIST}/embed`)) execSync('npx astro build', { env: { ...process.env, SITIO: 'nomina' }, stdio: 'ignore' });
  }, 180_000);
  const leer = (r: string) => readFileSync(`${DIST}/${r}/index.html`, 'utf8');

  it('existen todas, en castellano y catalán', () => {
    expect(readdirSync(`${DIST}/embed`).length).toBe(nomina.calculadoras.length);
    expect(readdirSync(`${DIST}/ca/embed`).length).toBe(nomina.calculadoras.length);
  });
  for (const lang of ['es', 'ca'] as const) {
    it(`${lang}: noindex, canónica a la calculadora completa, sin cabecera, pie ni anuncios, con enlace follow`, () => {
      for (const r of rutasEmbed(lang)) {
        const h = leer(r.ruta);
        expect(h, r.ruta).toMatch(/<meta name="robots" content="noindex, follow"/);
        const canon = h.match(/<link rel="canonical" href="([^"]+)"/)![1];
        expect(canon.endsWith(`/${r.completa}/`)).toBe(true);
        expect(existsSync(`${DIST}/${r.completa}/index.html`)).toBe(true);
        expect(h).not.toMatch(/<header class="cab|<footer|adsbygoogle|class="anuncio/);
        expect(h).toMatch(/data-embed/);
        expect(h).toMatch(/class="calc"[^>]*data-calc=/);
        const firma = h.match(/<p class="emb-firma"><a ([^>]+)>/)![1];
        expect(firma).toContain(`href="${canon}"`);
        expect(firma).not.toMatch(/rel=/);
        expect(h).toMatch(/Calculadora de NetoClaro<\/a>/);
        expect(h).toMatch(/id="claro-pro"/);
        expect(h).not.toMatch(/NaN|undefined/);
      }
    });
  }
  it('las páginas embed no están en el sitemap y «Para profesionales» sí', () => {
    const s = readFileSync(`${DIST}/sitemap.xml`, 'utf8');
    expect(s).not.toMatch(/\/embed\//);
    expect(s).toMatch(/\/para-profesionales\/<\/loc>/);
    expect(s).toMatch(/\/ca\/per-a-professionals\/<\/loc>/);
  });
  it('«Para profesionales»: configurador, planes con pago o «Pedir acceso», condiciones y enlaces desde el pie y cada calculadora', () => {
    const h = leer('para-profesionales');
    expect(h).toMatch(/id="configurador"/);
    expect(h).toMatch(/9 €/);
    expect(h).toMatch(/29 €/);
    expect(h).toMatch(/buy\.stripe\.com|mailto:hola@numimates\.com/);
    expect(h).toMatch(/id="condiciones"/);
    expect(h).toMatch(/Cancelación en un clic/);
    expect(leer('ca/per-a-professionals')).toMatch(/Configurador/);
    expect(leer('calculadora-sueldo-neto')).toMatch(/href="\/para-profesionales\/\?calc=sueldo-neto#configurador"/);
    expect(leer('')).toMatch(/href="\/para-profesionales\/"/);
  });
});
