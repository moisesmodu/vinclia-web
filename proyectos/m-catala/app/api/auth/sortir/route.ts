import { cerrarSesion } from '@/lib/auth';
import { json } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function POST() { await cerrarSesion(); return json({ ok: true }); }
