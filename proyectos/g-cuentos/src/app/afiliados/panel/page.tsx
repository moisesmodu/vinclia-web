import type { Metadata } from "next";
import { PanelAfiliado } from "@/components/PaginasAfiliados";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string; a?: string }> }) {
  const { t, a } = await searchParams;
  return <PanelAfiliado token={t} idioma={a === "ca" ? "ca" : "es"} />;
}
