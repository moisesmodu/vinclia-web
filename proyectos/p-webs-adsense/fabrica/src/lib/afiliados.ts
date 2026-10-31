// Enlaces de afiliado (AFILIACION.md). Un bloque como máximo por página, siempre identificado como publicidad
// (LSSI art. 20) y con rel="sponsored". Solo se muestra cuando el programa tiene enlace: en afiliados.json
// («enlace») o en la variable AFILIADO_<ID> (p. ej. AFILIADO_QUIPU), así no hay que tocar código al darse de alta.
import datos from '../../afiliados.json';
import { SITIO_ID } from './sitio';

export interface Programa { id: string; nombre: string; sitios: string[]; calculadoras: string[]; texto: { es: string; ca: string }; cta: { es: string; ca: string }; enlace: string }

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';
const enlace = (p: Programa) => env(`AFILIADO_${p.id.toUpperCase().replace(/-/g, '_')}`) || p.enlace;

export function afiliadoPara(calc: string): (Programa & { href: string }) | null {
  for (const p of (datos as { programas: Programa[] }).programas) {
    const href = enlace(p);
    if (href && /^https:\/\//.test(href) && p.sitios.includes(SITIO_ID) && p.calculadoras.includes(calc)) return { ...p, href };
  }
  return null;
}
