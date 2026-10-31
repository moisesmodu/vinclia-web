import type { APIRoute } from 'astro';
import { rutasCsv, csvFicha } from '../../../lib/csvFichas';
export const getStaticPaths = () => rutasCsv('ca');
export const GET: APIRoute = ({ props }) => new Response(csvFicha(props.id, 'ca'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
