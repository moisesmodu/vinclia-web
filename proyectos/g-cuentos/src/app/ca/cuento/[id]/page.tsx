import type { Metadata } from "next";
import { VistaPrevia } from "@/components/VistaPrevia";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VistaPrevia id={id} idioma="ca" />;
}
