import Link from "next/link";
import { dicc, fechaLarga } from "@/lib/i18n";
import { emailSesion } from "@/lib/sesion";
import { db, hayBaseDeDatos } from "@/lib/db";
import { config } from "@/lib/config";
import AccionesCuenta from "@/components/AccionesCuenta";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Cuenta({ params }: { params: Promise<{ idioma: string }> }) {
  const { idioma } = await params;
  const d = dicc(idioma);
  const email = await emailSesion();
  const u = email && hayBaseDeDatos() ? await db.usuario.findUnique({ where: { email } }) : null;
  const activo = Boolean(u?.accesoHasta && u.accesoHasta > new Date());
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">{d.cuenta.titulo}</h1>
      {!email ? (
        <div className="tarjeta p-5 space-y-3">
          <p>{d.cuenta.sinSesion}</p>
          <Link className="boton boton-marca w-full" href={`/${idioma}/acceso`}>{d.acceso.titulo}</Link>
          <Link className="boton boton-borde w-full" href={`/${idioma}/precios`}>{d.guia.verPrecios}</Link>
        </div>
      ) : (
        <div className="tarjeta p-5 space-y-3">
          <p className="font-medium break-all">{email}</p>
          <p>{d.cuenta.plan}: <strong>{activo ? (u?.plan === "pack" ? d.cuenta.pack : d.cuenta.suscripcion) : d.cuenta.sinPlan}</strong></p>
          {activo && u?.accesoHasta ? <p>{d.cuenta.hasta}: <strong>{fechaLarga(u.accesoHasta.toISOString().slice(0, 10), idioma)}</strong></p> : null}
          {!activo ? <Link className="boton boton-marca w-full" href={`/${idioma}/precios`}>{d.guia.verPrecios}</Link> : null}
          <AccionesCuenta idioma={idioma} puedeCancelar={activo && u?.plan === "suscripcion" && Boolean(u?.stripeSubscriptionId)} textos={{ cancelar: d.cuenta.cancelar, canceladaOk: d.cuenta.canceladaOk, salir: d.cuenta.salir }} />
          <p className="text-sm text-suave">{d.cuenta.borrar} <a className="enlace" href={`mailto:${config.titular.correo}`}>{config.titular.correo}</a></p>
        </div>
      )}
    </div>
  );
}
