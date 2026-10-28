import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagina } from "@/components/Marco";
import { PagoSimulado } from "@/components/PagoSimulado";
import { euros, precioCents } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string; f?: string }> }) {
  if (process.env.STRIPE_SECRET_KEY) notFound();
  const { id } = await params;
  const { s, f } = await searchParams;
  const formato = f === "pdf" ? "pdf" : "tapaDura";
  return (
    <Pagina idioma="ca">
      <div className="px-4 py-10"><PagoSimulado idioma="ca" pedidoId={id} sessionId={s ?? ""} formato={formato} importe={euros(precioCents(formato), "ca")} /></div>
    </Pagina>
  );
}
