import { cache } from 'react';
import { leer } from './db';
import { intentar, memorizar, PROYECTOS_CONTROL, variableBase, type ClaveProyecto, type Resultado } from './comun';

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

type FilaUsuario = Omit<UsuarioControl, 'proyecto' | 'slug' | 'haPagado'>;

// Numi Mates y Numitech: una sola app (proyecto Vercel mates-numi) y una sola base. Cada alumno guarda la variante en
// state.variant (o survey.variant): mates, pro y ment son Numi Mates; tech es Numitech. No hay email (los alumnos son
// menores con un código); se muestra el código del alumno. La suscripción Premium se refleja en pla / pla_fins.
const alumnosNumi = () =>
  memorizar('usuarios:NUMI', () =>
    leer('NM', async (q) => {
      const hoy = ahora();
      const filas = await q(
        `select code, created_at, pla, pla_fins, pla_periode, stripe_status, pla_cancel, grup_id is not null aula,
                coalesce(state->>'variant', survey->>'variant', 'mates') variante
           from mates.alumnes order by created_at desc nulls last limit ${LIMITE}`,
      );
      return filas.map((f) => {
        const fins = fecha(f.pla_fins);
        const premium = f.pla === 'premium';
        const estado: EstadoUsuario = premium ? (fins && fins >= hoy ? (f.stripe_status === 'trialing' ? 'prueba' : 'pago') : 'cancelado') : 'gratis';
        const plan = [premium ? `premium${f.pla_periode ? ' ' + f.pla_periode : ''}` : f.pla ?? null, f.aula ? 'aula' : null, f.variante !== 'mates' && f.variante !== 'tech' ? f.variante : null, f.pla_cancel ? 'cancela al final' : null].filter(Boolean).join(' · ');
        return { tech: f.variante === 'tech', fila: { email: String(f.code ?? '').toLowerCase(), alta: new Date(f.created_at ?? 0), estado, plan: plan || '—', ultimoPago: null } as FilaUsuario };
      });
    }),
  );

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
  NM: async () => (await alumnosNumi()).filter((a) => !a.tech).map((a) => a.fila),
  NT: async () => (await alumnosNumi()).filter((a) => a.tech).map((a) => a.fila),
};

/** `pendiente`: la base todavía no está conectada (falta la variable); no es un fallo y no se avisa en cada página. */
export type UsuariosPorProyecto = { clave: ClaveProyecto; slug: string; nombre: string; pendiente: boolean; resultado: Resultado<UsuarioControl[]> }[];

export const usuariosPorProyecto = cache(async (): Promise<UsuariosPorProyecto> =>
  Promise.all(
    PROYECTOS_CONTROL.map(async (p) => ({
      clave: p.clave, slug: p.slug, nombre: p.nombre, pendiente: !process.env[variableBase(p.clave)],
      resultado: !process.env[variableBase(p.clave)] ? { ok: false as const, error: `Base de datos sin conectar (falta ${variableBase(p.clave)})` } : await intentar(() =>
        memorizar(`usuarios:${p.clave}`, async () =>
          (await consultas[p.clave]()).map((u) => ({ ...u, proyecto: p.clave, slug: p.slug, haPagado: u.estado === 'pago' || !!u.ultimoPago })),
        ),
      ),
    })),
  ),
);
