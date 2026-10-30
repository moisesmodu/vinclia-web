// Lectura de los CSV de programáticas para las pruebas, sin pasar por rutas.ts (que depende del sitio compilado).
import { readFileSync } from 'node:fs';
import { parseCSV } from '../src/lib/csv';

export const leerCSV = (sitio: string, nombre: string) => parseCSV(readFileSync(`sitios/${sitio}/programaticas/${nombre}`, 'utf8'));
export const rellenar = (patron: string, fila: Record<string, string>) => patron.replace(/\{(\w+)\}/g, (_, k) => fila[k] ?? '');
