import 'server-only';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import type { Locale } from './config';
import { CONVOCATORIAS } from './convocatorias';
import { fechaLarga, traductor } from './i18n';

export type Doc = { meta: Record<string, string>; html: string; faq: { q: string; a: string }[] };
const BASE = path.join(process.cwd(), 'content');

function parse(src: string) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  if (m) for (const l of m[1].split('\n')) {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, cuerpo: m ? src.slice(m[0].length) : src };
}

export function tablaFechas(locale: Locale) {
  const t = traductor(locale);
  const hoy = new Date().toISOString().slice(0, 10);
  const filas = CONVOCATORIAS.filter((c) => c.examen >= hoy)
    .map((c) => `<tr><td>${fechaLarga(c.examen, locale)}</td><td>${c.cierre ? fechaLarga(c.cierre, locale) : '—'}</td><td>${c.oficial ? t('comun.oficial') : t('comun.prevista')}</td></tr>`)
    .join('');
  return `<table><thead><tr><th>CCSE</th><th>⏳</th><th>ℹ︎</th></tr></thead><tbody>${filas}</tbody></table>`;
}

/** Datos del titular leídos en tiempo de ejecución; si faltan se ve un marcador para no publicar un aviso legal incompleto sin notarlo. */
export function legal(v: 'LEGAL_NOM' | 'LEGAL_NIF' | 'LEGAL_EMAIL' | 'LEGAL_ADRECA') {
  const x = process.env[v]?.trim() || (v === 'LEGAL_EMAIL' ? 'hola@numimates.com' : '');
  return x ? x.replace(/[<>]/g, '') : `<mark>[falta ${v}]</mark>`;
}

function reemplazos(html: string, locale: Locale) {
  return html
    .replace(/<p>\s*\{\{FECHAS\}\}\s*<\/p>|\{\{FECHAS\}\}/g, tablaFechas(locale))
    .replace(/\{\{TITULAR\}\}/g, legal('LEGAL_NOM'))
    .replace(/\{\{NIF\}\}/g, legal('LEGAL_NIF'))
    .replace(/\{\{DOMICILIO\}\}/g, legal('LEGAL_ADRECA'))
    .replace(/\{\{EMAIL\}\}/g, legal('LEGAL_EMAIL'))
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener" target="_blank"');
}

/** Preguntas frecuentes de una guía (sección «## Preguntas frecuentes», pares «**pregunta**» + respuesta) para el FAQPage. */
export function faqDe(cuerpo: string): { q: string; a: string }[] {
  const i = cuerpo.search(/^## [^\n]*(Preguntas frecuentes|Preguntes freqüents|FAQ|Questions fréquentes|Întrebări frecvente|الأسئلة الشائعة|常见问题|Поширені запитання)/m);
  if (i < 0) return [];
  const bloque = cuerpo.slice(i).split('\n').slice(1).join('\n').split(/^## /m)[0];
  const out: { q: string; a: string }[] = [];
  const re = /\*\*([^*\n]+)\*\*\s*\n([^\n][\s\S]*?)(?=\n\s*\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloque))) out.push({ q: m[1].trim(), a: m[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim() });
  return out;
}

export function leerDoc(rel: string, locale: Locale): Doc | null {
  const f = path.join(BASE, rel);
  if (!existsSync(f)) return null;
  const { meta, cuerpo } = parse(readFileSync(f, 'utf8'));
  return { meta, html: reemplazos(marked.parse(cuerpo, { async: false }) as string, locale), faq: faqDe(cuerpo) };
}

export function guias(locale: string): { slug: string; meta: Record<string, string> }[] {
  const dir = path.join(BASE, 'guias', locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ slug: f.replace(/\.md$/, ''), meta: parse(readFileSync(path.join(dir, f), 'utf8')).meta }));
}
