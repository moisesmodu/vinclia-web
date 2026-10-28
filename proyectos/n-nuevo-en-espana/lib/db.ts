import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export function hayBaseDeDatos(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export const db: PrismaClient = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
