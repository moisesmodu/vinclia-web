import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };
export function db(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
  if (!g.prisma) g.prisma = new PrismaClient();
  return g.prisma;
}
export const hayBaseDeDatos = () => !!process.env.DATABASE_URL;
