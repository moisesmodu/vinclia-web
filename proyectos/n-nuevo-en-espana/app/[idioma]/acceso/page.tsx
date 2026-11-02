import { dicc } from "@/lib/i18n";
import FormAcceso from "@/components/FormAcceso";

export const metadata = { robots: { index: false } };

export default async function Acceso({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">{d.acceso.titulo}</h1>
      <p className="text-suave">{d.acceso.texto}</p>
      <FormAcceso idioma={idioma} textos={{ email: d.recordatorio.email, boton: d.acceso.boton, enviado: d.acceso.enviado }} />
    </div>
  );
}
