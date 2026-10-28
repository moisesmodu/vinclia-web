import type { Metadata } from "next";
import { EstadoPedido } from "@/components/EstadoPedido";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const { ok } = await searchParams;
  return <EstadoPedido id={id} idioma="es" ok={ok === "1"} />;
}
