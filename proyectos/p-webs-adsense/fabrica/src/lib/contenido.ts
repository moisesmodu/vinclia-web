// Carga el texto de cada calculadora (sitios/<sitio>/contenido/<id>.<lang>.md): frontmatter YAML + Markdown.
import YAML from 'yaml';
import { marked } from 'marked';
import type { Lang } from './def';

const raw = import.meta.glob('../../sitios/*/contenido/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Texto {
  slug: string;
  titulo: string;
  h1: string;
  descripcion: string;
  resumen: string;
  palabraClave?: string;
  actualizado: string;
  fuentes: { nombre: string; url: string }[];
  faq: { p: string; r: string }[];
  html: string;
}

marked.setOptions({ gfm: true });

export function texto(sitio: string, id: string, lang: Lang): Texto {
  const s = raw[`../../sitios/${sitio}/contenido/${id}.${lang}.md`];
  if (!s) throw new Error(`Falta contenido: sitios/${sitio}/contenido/${id}.${lang}.md`);
  const m = s.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`Frontmatter inválido en ${id}.${lang}.md`);
  const fm = YAML.parse(m[1]);
  const act = fm.actualizado instanceof Date ? fm.actualizado.toISOString().slice(0, 10) : String(fm.actualizado);
  return { ...fm, actualizado: act, fuentes: fm.fuentes ?? [], faq: fm.faq ?? [], html: marked.parse(m[2]) as string };
}

export function existeTexto(sitio: string, id: string, lang: Lang): boolean {
  return !!raw[`../../sitios/${sitio}/contenido/${id}.${lang}.md`];
}
