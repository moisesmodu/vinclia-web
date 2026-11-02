import { cache } from 'react';
import { leer } from './db';
import { intentar, memorizar, PROYECTOS_CONTROL, type ClaveProyecto, type Resultado } from './comun';

export type EstadoUsuario = 'gratis' | 'prueba' | 'pago' | 'cancelado';
export const ESTADOS: EstadoUsuario[] = ['gratis', 'prueba', 'pago', 'cancelado'];

export type UsuarioControl = {
  proyecto: ClaveProyecto;
  slug: string;
  email: string;
  alta: Date;
  estado: EstadoUsuario;
  plan: string;
  ultimoPago: Date | null;
  haPagado: boolean;
};

const ahora = () => new Date();
const fecha = (v: unknown) => (v == null ? null : new Date(v as string));
const LIMITE = 20000;

function deEstadoSuscripcion(estado: string | null, pruebaHasta?: Date | null): EstadoUsuario {
  switch (estado) {
    case 'active':
    case 'past_due':
    case 'unpaid':
    case 'passi':
      return 'pago';
    case 'trialing':
      return 'prueba';
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelado';
    default:
      return pruebaHasta && pruebaHasta > ahora() ? 'prueba' : 'gratis';
  }
}

const consultas: Record<ClaveProyecto, () => Promise<Omit<UsuarioControl, 'proyecto' | 'slug' | 'haPagado'>[]>> = {
  // CCSE Fácil: acceso de pago único (Pago) con fecha de caducidad en Usuario.accesoHasta.
  A: () =>
    leer('A', async (q) => {
      const filas = await q(
        `select lower(u.email) email, u.creado, u."accesoHasta" acceso, max(p.creado) ult, count(p.id)::int n
           from "Usuario" u left join "Pago" p on p."usuarioId" = u.id and p.modo = 'live'
          group by u.id order by u.creado desc limit ${LIMITE}`,
      );
      return filas.map((f) => {
        const acceso = fecha(f.acceso);
        const vigente = !!acceso && acceso > ahora();
        const estado: EstadoUsuario = f.n > 0 ? (vigente ? 'pago' : 'cancelado') : vigente ? 'prueba' : 'gratis';
        return { email: f.email, alta: new Date(f.creado), estado, plan: f.n > 0 ? `acceso${acceso ? ' hasta ' + acceso.toLocaleDateString('es-ES') : ''}` : '—', ultimoPago: fecha(f.ult) };
      });
    }),
  // Tus Papeles: plan «suscripcion» o «pack» con accesoHasta.
  N: () =>
    leer('N', async (q) => {
      const filas = await q(`select lower(email) email, creado, plan, "accesoHasta" acceso, "stripeSubscriptionId" sub from "Usuario" order by creado desc limit ${LIMITE}`);
      return filas.map((f) => {
        const acceso = fecha(f.acceso);
        const vigente = f.plan && (!acceso || acceso > ahora());
        const estado: EstadoUsuario = f.plan ? (vigente ? 'pago' : 'cancelado') : 'gratis';
        return { email: f.email, alta: new Date(f.creado), estado, plan: f.plan ?? '—', ultimoPago: null };
      });
    }),
  // Oposita: suscripción de Stripe reflejada en suscripcionEstado.
  B: () =>
    leer('B', async (q) => {
      const filas = await q(`select lower(email) email, creado, "suscripcionEstado" estado, "cancelaAlFinal" cancela from "Usuario" order by creado desc limit ${LIMITE}`);
      return filas.map((f) => ({
        email: f.email, alta: new Date(f.creado), estado: deEstadoSuscripcion(f.estado),
        plan: f.estado ? `${f.estado}${f.cancela ? ' · cancela al final' : ''}` : '—', ultimoPago: null,
      }));
    }),
  // Lunilla: no hay cuentas; cada email con pedido cuenta como usuario.
  G: () =>
    leer('G', async (q) => {
      const filas = await q(
        `select lower(email) email, min("creadoEn") alta, max("pagadoEn") ult,
                count(*) filter (where "pagadoEn" is not null)::int pagados, count(*)::int pedidos,
                (array_agg(formato order by "pagadoEn" desc nulls last))[1] formato
           from "Pedido" where email is not null and email <> '' group by lower(email) order by min("creadoEn") desc limit ${LIMITE}`,
      );
      return filas.map((f) => ({
        email: f.email, alta: new Date(f.alta), estado: (f.pagados > 0 ? 'pago' : 'gratis') as EstadoUsuario,
        plan: f.pagados > 0 ? `${f.pagados} pedido${f.pagados > 1 ? 's' : ''} pagado${f.pagados > 1 ? 's' : ''}${f.formato ? ' · ' + f.formato : ''}` : `${f.pedidos} borrador${f.pedidos > 1 ? 'es' : ''}`,
        ultimoPago: fecha(f.ult),
      }));
    }),
  // Aprova: suscripción o pase en subscripcioEstat; prueba de 7 días en provaFins.
  M: () =>
    leer('M', async (q) => {
      const filas = await q(
        `select lower(u.email) email, u.creat, u."subscripcioEstat" estat, u.pla, u."provaFins" prova, u."cancelaAlFinal" cancela,
                (select max(p.data) from "Pagament" p where p."usuariId" = u.id and p.tipus like 'checkout%') ult
           from "Usuari" u order by u.creat desc limit ${LIMITE}`,
      );
      return filas.map((f) => {
        const prova = fecha(f.prova);
        const estado = deEstadoSuscripcion(f.estat, prova);
        const plan = [f.pla, f.estat && f.estat !== 'active' ? f.estat : null, f.cancela ? 'cancela al final' : null, estado === 'prueba' && prova ? `prueba hasta ${prova.toLocaleDateString('es-ES')}` : null].filter(Boolean).join(' · ');
        return { email: f.email, alta: new Date(f.creat), estado, plan: plan || '—', ultimoPago: fecha(f.ult) };
      });
    }),
};

export type UsuariosPorProyecto = { clave: ClaveProyecto; slug: string; nombre: string; resultado: Resultado<UsuarioControl[]> }[];

export const usuariosPorProyecto = cache(async (): Promise<UsuariosPorProyecto> =>
  Promise.all(
    PROYECTOS_CONTROL.map(async (p) => ({
      clave: p.clave, slug: p.slug, nombre: p.nombre,
      resultado: await intentar(() =>
        memorizar(`usuarios:${p.clave}`, async () =>
          (await consultas[p.clave]()).map((u) => ({ ...u, proyecto: p.clave, slug: p.slug, haPagado: u.estado === 'pago' || !!u.ultimoPago })),
        ),
      ),
    })),
  ),
);
