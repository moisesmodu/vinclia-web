// Compila el sitio indicado en SITIO y deja el resultado en ./publicar (carpeta de salida única para
// Cloudflare Pages y Vercel, que no admiten una carpeta distinta por variable de entorno).
import { execSync } from 'node:child_process';
import { rmSync, cpSync } from 'node:fs';
const sitio = process.env.SITIO;
if (!sitio) { console.error('Falta la variable SITIO (nomina, impuestos…)'); process.exit(1); }
execSync('npx astro build', { stdio: 'inherit' });
rmSync('publicar', { recursive: true, force: true });
cpSync(`dist/${sitio}`, 'publicar', { recursive: true });
console.log(`Listo: ./publicar contiene ${sitio}`);
