import { randomBytes } from "node:crypto";
import { db } from "./db";

export function codigoDesde(nombre: string) {
  const base = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "").slice(0, 12) || "amiga";
  return `${base}${randomBytes(2).toString("hex")}`;
}

export async function panelAfiliado(token: string) {
  const a = await db.afiliado.findUnique({ where: { token } });
  if (!a) return null;
  const ventas = await db.pedido.findMany({
    where: { afiliado: a.codigo, pagadoEn: { not: null } },
    select: { id: true, pagadoEn: true, formato: true, precioCents: true, comisionCents: true }, orderBy: { pagadoEn: "desc" },
  });
  const generado = ventas.reduce((s, v) => s + (v.comisionCents ?? 0), 0);
  return { afiliado: a, ventas, generadoCents: generado, pendienteCents: generado - a.pagadoCents };
}
