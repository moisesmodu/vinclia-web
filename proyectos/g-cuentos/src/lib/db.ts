import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;

export async function evento(tipo: string, pedidoId?: string, detalle?: unknown) {
  try {
    await db.evento.create({ data: { tipo, pedidoId, detalle: detalle === undefined ? undefined : JSON.parse(JSON.stringify(detalle)) } });
  } catch (e) {
    console.error("evento", tipo, e);
  }
}
