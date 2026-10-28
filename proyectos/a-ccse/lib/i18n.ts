import es from '@/messages/es.json';
import ca from '@/messages/ca.json';
import ar from '@/messages/ar.json';
import fr from '@/messages/fr.json';
import en from '@/messages/en.json';
import ro from '@/messages/ro.json';
import zh from '@/messages/zh.json';
import uk from '@/messages/uk.json';
import type { Locale } from './config';

export type Clave = keyof typeof es;
export type Mensajes = Record<Clave, string>;
const TODOS: Record<Locale, Partial<Mensajes>> = { es, ca, ar, fr, en, ro, zh, uk };

export function mensajes(l: Locale): Mensajes {
  return { ...es, ...TODOS[l] } as Mensajes;
}
export function formatear(s: string, v?: Record<string, string | number>) {
  return v ? s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`)) : s;
}
export function traductor(l: Locale) {
  const m = mensajes(l);
  return (k: Clave, v?: Record<string, string | number>) => formatear(m[k] ?? k, v);
}
export function fechaLarga(iso: string | Date, l: Locale) {
  const d = typeof iso === 'string' ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')) : iso;
  return new Intl.DateTimeFormat(l === 'zh' ? 'zh-CN' : l, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
