// Archivos de los productos de pago, servidos solo bajo /descarga/<token>/ (productos.json). Se copian al compilar
// desde productos/<id>/; no están en public/, así que no hay otra dirección para descargarlos.
import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { productosSitio } from '../../../lib/productos';

const TIPOS: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export function getStaticPaths() {
  return productosSitio().flatMap((p) => p.archivos.map((a) => ({ params: { token: p.token, archivo: a.archivo }, props: { ruta: `productos/${p.id}/${a.archivo}`, tipo: a.tipo } })));
}

export const GET: APIRoute = ({ props }) => new Response(readFileSync(props.ruta as string), { headers: { 'Content-Type': TIPOS[props.tipo as string] ?? 'application/octet-stream' } });
