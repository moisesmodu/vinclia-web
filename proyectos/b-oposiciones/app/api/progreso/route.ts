import { usuarioActual } from '@/lib/auth';
import { db } from '@/lib/db';
import { banco } from '@/lib/datos';
import { json, error } from '@/lib/http';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  const op = new URL(req.url).searchParams.get('op') ?? '';
  const p = await db.progreso.findUnique({ where: { usuarioId_oposicion: { usuarioId: u.id, oposicion: op } } });
  return json({ datos: p?.datos ?? null });
}

export async function PUT(req: Request) {
  const u = await usuarioActual();
  if (!u) return error('sin sesión', 401);
  const op = new URL(req.url).searchParams.get('op') ?? '';
  if (!banco(op)) return error('oposición desconocida', 404);
  const texto = await req.text();
  if (texto.length > 2_000_000) return error('demasiado grande', 413);
  let datos: Prisma.InputJsonValue;
  try { datos = JSON.parse(texto); } catch { return error('json inválido'); }
  await db.progreso.upsert({
    where: { usuarioId_oposicion: { usuarioId: u.id, oposicion: op } },
    update: { datos },
    create: { usuarioId: u.id, oposicion: op, datos },
  });
  return json({ ok: true });
}
