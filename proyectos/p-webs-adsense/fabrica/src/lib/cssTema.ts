// Hojas de estilo de las páginas embed. El sitio sigue el modo oscuro del sistema con @media (prefers-color-scheme:dark);
// dentro de un iframe manda la web que lo incrusta (?tema=claro|oscuro). Por eso cada bloque @media oscuro se convierte
// en una regla anidada bajo :root[data-tema=oscuro] (anidamiento CSS nativo) y las ':root{' de dentro pasan a '&{'.
// Así se reutilizan base.css y calc.css tal cual, sin tocarlos.

const OSCURO = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/g;

export function temaPorAtributo(css: string, selector = ':root[data-tema=oscuro]'): string {
  let out = '', i = 0;
  OSCURO.lastIndex = 0;
  for (let m = OSCURO.exec(css); m; m = OSCURO.exec(css)) {
    out += css.slice(i, m.index);
    // Cierre del bloque @media: llaves equilibradas
    let prof = 1, j = OSCURO.lastIndex;
    while (j < css.length && prof > 0) { if (css[j] === '{') prof++; else if (css[j] === '}') prof--; j++; }
    const dentro = css.slice(OSCURO.lastIndex, j - 1).replace(/(^|[{};\s]):root\s*\{/g, '$1&{');
    out += `${selector}{${dentro}}`;
    i = j;
    OSCURO.lastIndex = j;
  }
  return out + css.slice(i);
}

/** Minificado sencillo y seguro: comentarios y espacios sobrantes. */
export const minCss = (css: string) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
