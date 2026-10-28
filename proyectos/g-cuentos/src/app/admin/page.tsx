import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tokenValido } from "@/lib/admin";
import { euros, margenEstimado } from "@/lib/config";
import { db } from "@/lib/db";
import { modoImprenta } from "@/lib/imprenta/gelato";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false }, title: "Admin" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  if (!tokenValido(t)) notFound();
  const [pedidos, afiliados, total] = await Promise.all([
    db.pedido.findMany({ where: { estado: { not: "borrador" } }, orderBy: { creadoEn: "desc" }, take: 100 }),
    db.afiliado.findMany({ orderBy: { creadoEn: "desc" } }),
    db.pedido.count(),
  ]);
  const modos = {
    stripe: process.env.STRIPE_SECRET_KEY ? (process.env.STRIPE_SECRET_KEY.startsWith("sk_live") ? "REAL" : "prueba") : "simulador",
    imprenta: modoImprenta(), correo: process.env.RESEND_API_KEY ? "Resend" : "simulado (disco)",
    texto: process.env.ANTHROPIC_API_KEY ? "Claude Sonnet 5.5" : "plantilla (sin IA)", almacen: process.env.BLOB_READ_WRITE_TOKEN ? "Vercel Blob" : "disco local",
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
      <h1 className="text-3xl mb-4">Lunilla · admin</h1>
      <div className="tarjeta p-4 mb-4 grid sm:grid-cols-5 gap-2">{Object.entries(modos).map(([k, v]) => <p key={k}><b>{k}</b>: {v}</p>)}</div>
      <p className="mb-4">Vistas previas totales: {total}. Margen estimado por venta: PDF {euros(margenEstimado("pdf", false))} ({euros(margenEstimado("pdf", true))} con afiliada) · tapa dura {euros(margenEstimado("tapaDura", false))} ({euros(margenEstimado("tapaDura", true))} con afiliada).</p>
      <h2 className="text-xl mb-2">Pedidos</h2>
      <div className="tarjeta overflow-x-auto mb-8">
        <table className="w-full"><thead><tr className="text-left">{["fecha", "id", "estado", "formato", "importe", "correo", "afiliada", "error", "PDF"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
          <tbody>{pedidos.map((p) => (
            <tr key={p.id} className="border-t border-[#eadfcb] align-top">
              <td className="p-2 whitespace-nowrap">{p.creadoEn.toLocaleString("es-ES")}</td><td className="p-2 font-mono">{p.id}</td>
              <td className="p-2 font-bold">{p.estado}</td><td className="p-2">{p.formato}</td><td className="p-2">{p.precioCents ? euros(p.precioCents) : ""}</td>
              <td className="p-2">{p.email}</td><td className="p-2">{p.afiliado}</td><td className="p-2 text-terracota-osc">{p.error}</td>
              <td className="p-2">{p.pdfUrl && <a className="underline" href={p.pdfUrl}>PDF</a>}</td>
            </tr>))}</tbody></table>
      </div>
      <h2 className="text-xl mb-2">Afiliadas</h2>
      <div className="tarjeta overflow-x-auto"><table className="w-full"><tbody>{afiliados.map((a) => (
        <tr key={a.codigo} className="border-t border-[#eadfcb]"><td className="p-2 font-mono">{a.codigo}</td><td className="p-2">{a.nombre}</td><td className="p-2">{a.email}</td><td className="p-2">{a.redSocial}</td><td className="p-2">{a.clics} clics</td><td className="p-2">{a.activo ? "activa" : "baja"}</td></tr>
      ))}</tbody></table></div>
    </div>
  );
}
