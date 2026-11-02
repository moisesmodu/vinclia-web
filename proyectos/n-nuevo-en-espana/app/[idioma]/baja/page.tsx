import Link from "next/link";
import { dicc } from "@/lib/i18n";

export const metadata = { robots: { index: false } };

export default async function Baja({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  return (
    <div className="tarjeta p-6 text-center space-y-3">
      <div className="text-4xl" aria-hidden>✓</div>
      <p className="font-semibold">{d.correo.baja}</p>
      <Link className="enlace" href={`/${idioma}`}>{d.comun.inicio}</Link>
    </div>
  );
}
