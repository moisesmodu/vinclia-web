import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';
import type { Idioma } from './tipos';
import { correoContacto } from './contacto';

type Doc = { titulo: string; secciones: { h: string; p: string[] }[] };
// Datos del titular desde el entorno (LEGAL_*, DESPLIEGUES.md §1); el archivo del país da los valores por defecto.
const L = {
  ...pais.legal,
  titular: process.env.LEGAL_NOM || pais.legal.titular,
  nif: process.env.LEGAL_NIF || pais.legal.nif,
  domicilio: process.env.LEGAL_ADRECA || pais.legal.domicilio,
  email: correoContacto(),
};
const nif = L.nif || '(NIF pendent de publicar / pendiente de publicar)';
const precios = pais.planes.filter((p) => p.activo).map((p) => `${p.id}: ${(p.importe / 100).toFixed(2).replace('.', ',')} €`).join(' · ');

export const DOCS = ['aviso-legal', 'privacidad', 'cookies', 'condiciones'] as const;
export type DocLegal = (typeof DOCS)[number];

export function legal(doc: DocLegal, idioma: Idioma): Doc {
  const ca = idioma === 'ca';
  const contacto = (L.email ? `${L.email} ${ca ? 'o ' : 'o '}` : '') + (ca ? 'el formulari de la pàgina Contacte' : 'el formulario de la página Contacto');
  switch (doc) {
    case 'aviso-legal':
      return {
        titulo: ca ? 'Avís legal' : 'Aviso legal',
        secciones: [
          { h: ca ? 'Titular' : 'Titular', p: [`${marca.nombre} (${marca.dominio}) ${ca ? 'és un servei de' : 'es un servicio de'} ${L.titular}, ${L.registro}, NIF ${nif}, ${L.domicilio}. ${ca ? 'Contacte' : 'Contacto'}: ${contacto}.`] },
          { h: ca ? 'Objecte' : 'Objeto', p: [ca ? 'Plataforma de preparació d\'oposicions amb tests, simulacres i repàs espaiat. No és una administració pública ni té cap vinculació amb els òrgans convocants. Les convocatòries oficials són les publicades al DOGC, al BOE i als butlletins provincials.' : 'Plataforma de preparación de oposiciones con tests, simulacros y repaso espaciado. No es una administración pública ni tiene vinculación con los órganos convocantes. Las convocatorias oficiales son las publicadas en el DOGC, el BOE y los boletines provinciales.'] },
          { h: ca ? 'Contingut generat amb IA' : 'Contenido generado con IA', p: [ca ? 'Les preguntes s\'han generat amb intel·ligència artificial a partir dels textos legals consolidats (font: Agència Estatal BOE, reutilitzats d\'acord amb les seves condicions) i s\'han verificat en dues passades: comprovació automàtica de la cita literal i revisió de la resposta contra la font. Pot haver-hi errors: cada pregunta té un botó per informar-ne i es corregeixen en menys de 24 hores.' : 'Las preguntas se han generado con inteligencia artificial a partir de los textos legales consolidados (fuente: Agencia Estatal BOE, reutilizados conforme a sus condiciones) y se han verificado en dos pasadas: comprobación automática de la cita literal y revisión de la respuesta contra la fuente. Puede haber errores: cada pregunta tiene un botón para informar y se corrigen en menos de 24 horas.'] },
          { h: ca ? 'Propietat intel·lectual' : 'Propiedad intelectual', p: [ca ? 'Els textos legals són de domini públic (art. 13 LPI). La selecció, redacció de preguntes, explicacions i programari pertanyen al titular.' : 'Los textos legales son de dominio público (art. 13 LPI). La selección, redacción de preguntas, explicaciones y software pertenecen al titular.'] },
          { h: ca ? 'Llei aplicable' : 'Ley aplicable', p: [`${L.ley}. ${L.jurisdiccion}.`] },
        ],
      };
    case 'privacidad':
      return {
        titulo: ca ? 'Política de privadesa' : 'Política de privacidad',
        secciones: [
          { h: ca ? 'Responsable' : 'Responsable', p: [`${L.titular}, NIF ${nif}, ${L.domicilio}. ${ca ? 'Contacte' : 'Contacto'}: ${contacto}.`] },
          { h: ca ? 'Quines dades' : 'Qué datos', p: [ca ? 'Correu electrònic i contrasenya (xifrada amb scrypt) si crees un compte; el teu progrés (respostes, repàs i simulacres); dades de pagament, que gestiona Stripe (nosaltres no veiem el número de la targeta).' : 'Correo electrónico y contraseña (cifrada con scrypt) si creas una cuenta; tu progreso (respuestas, repaso y simulacros); datos de pago, que gestiona Stripe (nosotros no vemos el número de la tarjeta).', ca ? 'Sense compte, el progrés es guarda només al teu navegador.' : 'Sin cuenta, el progreso se guarda solo en tu navegador.'] },
          { h: ca ? 'Finalitat i base legal' : 'Finalidad y base legal', p: [ca ? 'Prestar el servei contractat (art. 6.1.b RGPD) i complir obligacions fiscals (art. 6.1.c). No fem perfils publicitaris ni venem dades.' : 'Prestar el servicio contratado (art. 6.1.b RGPD) y cumplir obligaciones fiscales (art. 6.1.c). No hacemos perfiles publicitarios ni vendemos datos.'] },
          { h: ca ? 'Encarregats' : 'Encargados', p: [ca ? 'Vercel Inc. (allotjament), Neon Inc. (base de dades, UE), Stripe Payments Europe Ltd. (pagaments). Les transferències fora de l\'UE es fan amb clàusules contractuals tipus.' : 'Vercel Inc. (alojamiento), Neon Inc. (base de datos, UE), Stripe Payments Europe Ltd. (pagos). Las transferencias fuera de la UE se hacen con cláusulas contractuales tipo.'] },
          { h: ca ? 'Conservació' : 'Conservación', p: [ca ? 'Mentre tinguis compte. El teu historial es conserva encara que cancel·lis la subscripció, perquè puguis tornar-hi; si vols que s\'esborri, demana-ho i ho fem en 30 dies. Factures: 6 anys.' : 'Mientras tengas cuenta. Tu historial se conserva aunque canceles la suscripción, para que puedas volver; si quieres que se borre, pídelo y lo hacemos en 30 días. Facturas: 6 años.'] },
          { h: ca ? 'Drets' : 'Derechos', p: [ca ? `Accés, rectificació, supressió, oposició, limitació i portabilitat (pots exportar el teu historial des de l'app). Escriu-nos a ${contacto}. Pots reclamar a l'Autoritat Catalana de Protecció de Dades o a l'AEPD.` : `Acceso, rectificación, supresión, oposición, limitación y portabilidad (puedes exportar tu historial desde la app). Escríbenos en ${contacto}. Puedes reclamar ante la Autoritat Catalana de Protecció de Dades o la AEPD.`] },
        ],
      };
    case 'cookies':
      return {
        titulo: ca ? 'Política de galetes' : 'Política de cookies',
        secciones: [
          { h: ca ? 'Què fem servir' : 'Qué usamos', p: [ca ? 'Una sola galeta tècnica (placa_sesion) per mantenir la sessió iniciada, i l\'emmagatzematge local del navegador per guardar el teu progrés. Són necessàries per al servei i no requereixen consentiment (art. 22.2 LSSI).' : 'Una sola cookie técnica (placa_sesion) para mantener la sesión iniciada, y el almacenamiento local del navegador para guardar tu progreso. Son necesarias para el servicio y no requieren consentimiento (art. 22.2 LSSI).', ca ? 'No fem servir galetes publicitàries ni d\'analítica. Si mai s\'afegeix analítica, serà sense galetes.' : 'No usamos cookies publicitarias ni de analítica. Si alguna vez se añade analítica, será sin cookies.'] },
          { h: ca ? 'Pagaments' : 'Pagos', p: [ca ? 'A la pàgina de pagament de Stripe s\'apliquen les galetes de Stripe per prevenir el frau (vegeu stripe.com/cookies-policy).' : 'En la página de pago de Stripe se aplican las cookies de Stripe para prevenir el fraude (ver stripe.com/cookies-policy).'] },
        ],
      };
    case 'condiciones':
      return {
        titulo: ca ? 'Condicions de venda i desistiment' : 'Condiciones de venta y desistimiento',
        secciones: [
          { h: ca ? 'Servei' : 'Servicio', p: [ca ? `Accés a totes les preguntes, simulacres i funcions de totes les oposicions de ${marca.nombre} mentre la subscripció estigui activa. Sense subscripció: ${pais.gratisPorOposicion} preguntes gratuïtes per oposició.` : `Acceso a todas las preguntas, simulacros y funciones de todas las oposiciones de ${marca.nombre} mientras la suscripción esté activa. Sin suscripción: ${pais.gratisPorOposicion} preguntas gratuitas por oposición.`] },
          { h: ca ? 'Preu i renovació' : 'Precio y renovación', p: [`${precios} (${ca ? 'IVA inclòs' : 'IVA incluido'}). ${ca ? 'La subscripció es renova automàticament al final de cada període fins que la cancel·lis. Stripe t\'envia un avís per correu abans de cada renovació anual.' : 'La suscripción se renueva automáticamente al final de cada periodo hasta que la canceles. Stripe te envía un aviso por correo antes de cada renovación anual.'}`] },
          { h: ca ? 'Cancel·lació' : 'Cancelación', p: [ca ? 'Des del teu compte, en un clic i en qualsevol moment. No es renova i mantens l\'accés fins al final del període pagat. El teu historial no s\'esborra.' : 'Desde tu cuenta, en un clic y en cualquier momento. No se renueva y mantienes el acceso hasta el final del periodo pagado. Tu historial no se borra.'] },
          { h: ca ? 'Desistiment i devolució' : 'Desistimiento y devolución', p: [ca ? `Tens ${L.desistimientoDias} dies naturals des del primer pagament per desistir, sense donar motius, i et tornem l'import íntegre pel mateix mitjà de pagament (RDL 1/2007, art. 102 i seg.). Escriu-nos des de ${contacto} indicant el correu del compte.` : `Tienes ${L.desistimientoDias} días naturales desde el primer pago para desistir, sin dar motivos, y te devolvemos el importe íntegro por el mismo medio de pago (RDL 1/2007, art. 102 y ss.). Escríbenos desde ${contacto} indicando el correo de la cuenta.`] },
          { h: ca ? 'Garantia de qualitat' : 'Garantía de calidad', p: [ca ? 'Les preguntes es basen en la normativa vigent i en el temari de la convocatòria citada. Si una pregunta és incorrecta, la corregim en menys de 24 hores des de l\'avís.' : 'Las preguntas se basan en la normativa vigente y en el temario de la convocatoria citada. Si una pregunta es incorrecta, la corregimos en menos de 24 horas desde el aviso.'] },
          { h: ca ? 'Llei i conflictes' : 'Ley y conflictos', p: [`${L.ley}. ${L.jurisdiccion}. ${ca ? 'Plataforma europea de resolució de litigis en línia: ec.europa.eu/consumers/odr.' : 'Plataforma europea de resolución de litigios en línea: ec.europa.eu/consumers/odr.'}`] },
        ],
      };
  }
}
