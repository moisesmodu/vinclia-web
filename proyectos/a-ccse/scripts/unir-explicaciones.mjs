// Une content/explicaciones/bloque-*.json en content/i18n/<lengua>.json y content/revision.json
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(raiz, 'content', 'explicaciones');
const LENGUAS = ['es', 'ar', 'fr', 'en', 'ro', 'zh', 'uk'];
const salida = Object.fromEntries(LENGUAS.map((l) => [l, {}]));
const revision = {};
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
  for (const [id, v] of Object.entries(d)) {
    for (const l of LENGUAS) if (v[l]) salida[l][id] = v[l];
    revision[id] = v.revision ?? { ok: null };
  }
}
mkdirSync(path.join(raiz, 'content', 'i18n'), { recursive: true });
for (const l of LENGUAS) writeFileSync(path.join(raiz, 'content', 'i18n', `${l}.json`), JSON.stringify(salida[l]));
writeFileSync(path.join(raiz, 'content', 'revision.json'), JSON.stringify(revision, null, 1));
console.log(LENGUAS.map((l) => `${l}:${Object.keys(salida[l]).length}`).join(' '));
