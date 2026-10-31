// Páginas legales (LSSI, RGPD, cookies) y «Quiénes somos y método», generadas con los datos del titular.
// Revisión recomendada por un gestor antes de solicitar AdSense; el texto sigue la guía de la AEPD.
import type { Lang } from './def';
import { sitio, anunciosActivos } from './sitio';

export interface PaginaLegal { titulo: string; descripcion: string; html: string }

// Sitio de EE. UU.: mismo titular (español, por eso siguen la LSSI y el RGPD) pero otras fuentes y el aviso de que no es el IRS.
const OBJETO_US = (n: string) => `<h2>Objeto y uso</h2><p>${n} es un sitio independiente: <strong>no somos el IRS, la Administración del Seguro Social ni ninguna agencia del gobierno</strong> de Estados Unidos ni de ningún estado, y no tenemos relación con ellos. Ofrecemos calculadoras y tablas gratuitas con fines informativos, en español. Los resultados son orientativos: se calculan con las cifras publicadas por el IRS, la SSA, el Departamento de Trabajo y los departamentos de impuestos estatales citados en cada página, pero no sustituyen a un preparador de impuestos (CPA o agente inscrito), ni tu talón de pago ni tu declaración. No damos asesoría fiscal, migratoria ni legal, no tramitamos ITIN ni declaraciones y no recogemos los datos de los cálculos: todo se calcula en tu navegador.</p>`;
const METODO_US = `<h2>Cómo calculamos</h2><p>Cada calculadora aplica paso a paso las reglas que cita: el Código de Impuestos Internos (Internal Revenue Code), la Publicación 15-T del IRS para la retención, el Schedule SE para el trabajo por cuenta propia, la ley One Big Beautiful Bill de 2025, la Ley de Normas Justas de Trabajo (FLSA) y las leyes de impuestos de cada estado. El método y sus simplificaciones están publicados en cada página, debajo de la herramienta, con un ejemplo numérico.</p>
<h2>De dónde salen los datos</h2><p>Las cifras (tramos federales, deducción estándar, tope del Seguro Social, crédito por hijos, salario mínimo, tramos y deducciones de cada estado) están en archivos separados por año, cada una con su fuente oficial: IRS (Rev. Proc. 2025-32 para 2026), SSA, Departamento de Trabajo y departamentos de impuestos estatales. Las que no se han podido confirmar en la página oficial se marcan como pendientes de verificar y se revisan cada semana.</p>
<h2>Cómo se actualiza</h2><p>Cada semana se revisan las publicaciones del IRS, la SSA y los estados. Si cambia una cifra, se actualiza el archivo de parámetros, se ejecutan las pruebas automáticas de cálculo y se vuelve a publicar el sitio; la fecha de cada página indica su última revisión.</p>`;

export function legal(id: string, lang: Lang, actualizado: string): PaginaLegal {
  const us = sitio.pais === 'us';
  const t = sitio.titular, n = sitio.nombre, dom = sitio.dominio.replace(/^https?:\/\//, '');
  const ads = anunciosActivos();
  const es = lang === 'es';
  // Textos propios del sitio (sitio.json → «legal»): HogarClaro no habla de nóminas ni del SEPE. Sin ellos, los de siempre.
  const X: Record<string, string> = sitio.legal?.[lang] ?? {};
  switch (id) {
    case 'aviso':
      return es ? {
        titulo: `Aviso legal · ${n}`, descripcion: `Datos del titular de ${n} y condiciones de uso del sitio.`,
        html: `<p>En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI), se informa de que este sitio web, <strong>${dom}</strong>, es titularidad de <strong>${t.nombre}</strong>, con NIF ${t.nif} y domicilio en ${t.domicilio}. Contacto: <a href="mailto:${t.email}">${t.email}</a>.</p>
${us ? OBJETO_US(n) : `<h2>Objeto y uso</h2><p>${n} ofrece calculadoras y tablas de datos gratuitas con fines informativos. Los resultados son orientativos: se calculan con la normativa publicada en el BOE y en las fuentes oficiales citadas en cada página, pero no sustituyen ${X.sustituye ?? 'el asesoramiento de un profesional ni los cálculos de la empresa, la Seguridad Social, el SEPE o la Agencia Tributaria'}. No se prestan servicios de asesoría ni se recogen datos de los cálculos: todo se calcula en tu navegador.</p>`}
<h2>Responsabilidad</h2><p>El titular revisa los parámetros con cada cambio normativo y corrige los errores que se le comuniquen, pero no responde de las decisiones tomadas a partir de los resultados. Los enlaces a sitios de terceros se ofrecen como referencia.</p>
<h2>Propiedad intelectual</h2><p>El código, los textos y el diseño son del titular. Las tablas de datos pueden citarse libremente enlazando a la página de origen.</p>
<h2>Legislación</h2><p>Este aviso se rige por la ley española.</p>`,
      } : {
        titulo: `Avís legal · ${n}`, descripcion: `Dades del titular de ${n} i condicions d’ús del lloc.`,
        html: `<p>En compliment de l’article 10 de la Llei 34/2002 de serveis de la societat de la informació (LSSI), s’informa que aquest lloc web, <strong>${dom}</strong>, és titularitat de <strong>${t.nombre}</strong>, amb NIF ${t.nif} i domicili a ${t.domicilio}. Contacte: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Objecte i ús</h2><p>${n} ofereix calculadores i taules de dades gratuïtes amb finalitats informatives. Els resultats són orientatius: es calculen amb la normativa publicada al BOE i a les fonts oficials citades a cada pàgina, però no substitueixen ${X.sustituye ?? 'l’assessorament d’un professional ni els càlculs de l’empresa, la Seguretat Social, el SEPE o l’Agència Tributària'}. No es presten serveis d’assessoria ni es recullen dades dels càlculs: tot es calcula al teu navegador.</p>
<h2>Responsabilitat</h2><p>El titular revisa els paràmetres amb cada canvi normatiu i corregeix els errors que se li comuniquin, però no respon de les decisions preses a partir dels resultats. Els enllaços a llocs de tercers s’ofereixen com a referència.</p>
<h2>Propietat intel·lectual</h2><p>El codi, els textos i el disseny són del titular. Les taules de dades es poden citar lliurement enllaçant a la pàgina d’origen.</p>
<h2>Legislació</h2><p>Aquest avís es regeix per la llei espanyola.</p>`,
      };
    case 'privacidad':
      return es ? {
        titulo: `Política de privacidad · ${n}`, descripcion: `Qué datos se tratan en ${n}, con qué base legal y cómo ejercer tus derechos.`,
        html: `<p><strong>Responsable:</strong> ${t.nombre}, NIF ${t.nif}, ${t.domicilio}. Contacto: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Qué datos tratamos</h2><ul><li><strong>Calculadoras:</strong> los datos que escribes (salario, fechas, situación familiar) se procesan solo en tu navegador. No se envían ni se guardan en ningún servidor. Si usas «Copiar enlace», los datos van en la propia dirección que compartes.</li>
<li><strong>Estadísticas:</strong> usamos Umami, una analítica sin cookies que no guarda direcciones IP ni identifica a personas. Mide páginas vistas, país y tipo de dispositivo de forma agregada. Base legal: interés legítimo (art. 6.1.f RGPD) en saber qué herramientas se usan.</li>
<li><strong>Correo:</strong> si nos escribes, usamos tu dirección solo para responderte y la borramos cuando ya no es necesaria. Base legal: tu consentimiento.</li>
${ads ? `<li><strong>Publicidad:</strong> el sitio muestra anuncios de Google AdSense. Google y sus socios pueden usar cookies e identificadores para mostrar anuncios y medirlos, personalizados o no según lo que elijas en el aviso de consentimiento (marco TCF 2.2 de IAB Europe). Base legal: tu consentimiento, que puedes retirar en cualquier momento desde «Gestionar cookies». Más información en <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">cómo usa Google la información de los sitios que usan sus servicios</a>.</li>` : ''}</ul>
<h2>Encargados y transferencias</h2><p>El alojamiento lo presta Cloudflare, Inc. o Vercel Inc., con cláusulas contractuales tipo de la Comisión Europea para cualquier transferencia fuera del Espacio Económico Europeo.${ads ? ' Google Ireland Ltd. actúa como responsable independiente para la publicidad.' : ''}</p>
<h2>Tus derechos</h2><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${t.email}. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>`,
      } : {
        titulo: `Política de privacitat · ${n}`, descripcion: `Quines dades es tracten a ${n}, amb quina base legal i com exercir els teus drets.`,
        html: `<p><strong>Responsable:</strong> ${t.nombre}, NIF ${t.nif}, ${t.domicilio}. Contacte: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Quines dades tractem</h2><ul><li><strong>Calculadores:</strong> les dades que escrius (salari, dates, situació familiar) es processen només al teu navegador. No s’envien ni es desen en cap servidor. Si fas servir «Copia l’enllaç», les dades van a la mateixa adreça que comparteixes.</li>
<li><strong>Estadístiques:</strong> fem servir Umami, una analítica sense galetes que no desa adreces IP ni identifica persones. Mesura pàgines vistes, país i tipus de dispositiu de manera agregada. Base legal: interès legítim (art. 6.1.f RGPD) a saber quines eines es fan servir.</li>
<li><strong>Correu:</strong> si ens escrius, fem servir la teva adreça només per respondre’t i l’esborrem quan ja no cal. Base legal: el teu consentiment.</li>
${ads ? `<li><strong>Publicitat:</strong> el lloc mostra anuncis de Google AdSense. Google i els seus socis poden fer servir galetes i identificadors per mostrar anuncis i mesurar-los, personalitzats o no segons el que triïs a l’avís de consentiment (marc TCF 2.2 d’IAB Europe). Base legal: el teu consentiment, que pots retirar en qualsevol moment des de «Gestiona les galetes». Més informació a <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">com fa servir Google la informació dels llocs que utilitzen els seus serveis</a>.</li>` : ''}</ul>
<h2>Encarregats i transferències</h2><p>L’allotjament el presta Cloudflare, Inc. o Vercel Inc., amb clàusules contractuals tipus de la Comissió Europea per a qualsevol transferència fora de l’Espai Econòmic Europeu.${ads ? ' Google Ireland Ltd. actua com a responsable independent per a la publicitat.' : ''}</p>
<h2>Els teus drets</h2><p>Pots demanar accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a ${t.email}. Si no t’atenem bé, pots reclamar davant l’Agència Espanyola de Protecció de Dades (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>`,
      };
    case 'cookies':
      return es ? {
        titulo: `Política de cookies · ${n}`, descripcion: `Qué cookies usa ${n} y cómo gestionarlas.`,
        html: ads
          ? `<p>Este sitio no instala cookies propias. La analítica (Umami) funciona sin cookies.</p><p>Los anuncios de <strong>Google AdSense</strong> sí pueden usar cookies e identificadores de Google y de sus socios publicitarios. Antes de usarlos te pedimos permiso con el aviso de consentimiento de Google, certificado para el marco TCF 2.2 de IAB Europe. Puedes aceptar, rechazar o elegir por finalidades, y cambiar tu decisión cuando quieras con el enlace «Gestionar cookies» del pie de página.</p><p>Si rechazas, verás anuncios no personalizados, que solo usan cookies para limitar la frecuencia y detectar fraude. También puedes borrar o bloquear las cookies desde tu navegador. Lista de socios y finalidades: <a href="https://policies.google.com/technologies/cookies" rel="noopener">política de cookies de Google</a>.</p>`
          : `<p>Este sitio <strong>no usa cookies</strong>: ni propias ni de terceros. La analítica (Umami) funciona sin cookies y sin guardar datos personales, por eso no te mostramos ningún aviso.</p><p>Si en el futuro se incorporan anuncios, se te pedirá consentimiento con el aviso certificado de Google (marco TCF 2.2) antes de instalar ninguna cookie, y esta página se actualizará.</p>`,
      } : {
        titulo: `Política de galetes · ${n}`, descripcion: `Quines galetes fa servir ${n} i com gestionar-les.`,
        html: ads
          ? `<p>Aquest lloc no instal·la galetes pròpies. L’analítica (Umami) funciona sense galetes.</p><p>Els anuncis de <strong>Google AdSense</strong> sí que poden fer servir galetes i identificadors de Google i dels seus socis publicitaris. Abans de fer-los servir et demanem permís amb l’avís de consentiment de Google, certificat per al marc TCF 2.2 d’IAB Europe. Pots acceptar, rebutjar o triar per finalitats, i canviar la decisió quan vulguis amb l’enllaç «Gestiona les galetes» del peu de pàgina.</p><p>Si rebutges, veuràs anuncis no personalitzats, que només fan servir galetes per limitar la freqüència i detectar frau. També pots esborrar o bloquejar les galetes des del navegador. Llista de socis i finalitats: <a href="https://policies.google.com/technologies/cookies" rel="noopener">política de galetes de Google</a>.</p>`
          : `<p>Aquest lloc <strong>no fa servir galetes</strong>: ni pròpies ni de tercers. L’analítica (Umami) funciona sense galetes i sense desar dades personals, per això no et mostrem cap avís.</p><p>Si en el futur s’hi incorporen anuncis, se’t demanarà consentiment amb l’avís certificat de Google (marc TCF 2.2) abans d’instal·lar cap galeta, i aquesta pàgina s’actualitzarà.</p>`,
      };
    default: {
      const a = sitio.autor;
      return es ? {
        titulo: `Quiénes somos y método · ${n}`, descripcion: `Quién hace ${n}, cómo se calculan los resultados, de dónde salen los datos y cómo se actualizan.`,
        html: `<h2>Quién está detrás</h2><p><strong>${a.nombre}</strong> · ${a.rol.es}. ${a.bio.es}</p>
${us ? METODO_US : X.metodo ? X.metodo : `<h2>Cómo calculamos</h2><p>Cada calculadora aplica paso a paso la norma que cita: el Estatuto de los Trabajadores, la Ley General de la Seguridad Social, la Ley y el Reglamento del IRPF, la Ley del IVA o la Ley General Tributaria. El método está publicado en cada página, debajo de la herramienta, con un ejemplo numérico.</p>
<h2>De dónde salen los datos</h2><p>Los parámetros (SMI, IPREM, bases y tipos de cotización, escalas del IRPF de cada comunidad, topes del paro, tramos de autónomos) están en archivos separados por país y año, cada uno con su fuente oficial: BOE, boletines autonómicos, Seguridad Social, SEPE y Agencia Tributaria. Cuando un año aún no tiene todos los datos publicados, se marca como <em>provisional</em> y se usan los vigentes más los cambios ya aprobados.</p>
<h2>Cómo se actualiza</h2><p>Cada semana se revisan el BOE y los boletines autonómicos. Si cambia una cifra, se actualiza el archivo de parámetros, se ejecutan más de 180 pruebas automáticas de cálculo y se vuelve a publicar el sitio; la fecha de cada página indica su última revisión.</p>`}
<h2 id="financiacion">Cómo nos financiamos</h2><p>Las calculadoras son gratis y lo seguirán siendo. El sitio se paga con publicidad de Google AdSense y, en algunas páginas, con un enlace patrocinado a un servicio relacionado (${X.patrocinio ?? 'gestoría, facturación, banca para autónomos'}), siempre marcado como «Publicidad». Si contratas desde ese enlace cobramos una comisión y tu precio no cambia. Ningún anunciante influye en los cálculos ni en el orden de las calculadoras.</p>
<h2>Uso de inteligencia artificial</h2><p>El código y los borradores de los textos se preparan con ayuda de inteligencia artificial. Las cifras no las genera la IA: salen de la normativa y de las pruebas automáticas, y el editor revisa por muestreo las páginas nuevas cada semana.</p>
<h2>Errores y contacto</h2><p>Si ves un resultado que no cuadra con ${us ? 'tu talón de pago o tu declaración' : X.comparar ?? 'tu nómina o tu liquidación'}, escribe a <a href="mailto:${t.email}">${t.email}</a> con los datos del cálculo: se revisa y, si hay error, se corrige el mismo día.</p>`,
      } : {
        titulo: `Qui som i mètode · ${n}`, descripcion: `Qui fa ${n}, com es calculen els resultats, d’on surten les dades i com s’actualitzen.`,
        html: `<h2>Qui hi ha al darrere</h2><p><strong>${a.nombre}</strong> · ${a.rol.ca}. ${a.bio.ca}</p>
${X.metodo ? X.metodo : `<h2>Com calculem</h2><p>Cada calculadora aplica pas a pas la norma que cita: l’Estatut dels Treballadors, la Llei general de la Seguretat Social, la Llei i el Reglament de l’IRPF, la Llei de l’IVA o la Llei general tributària. El mètode està publicat a cada pàgina, sota l’eina, amb un exemple numèric.</p>
<h2>D’on surten les dades</h2><p>Els paràmetres (SMI, IPREM, bases i tipus de cotització, escales de l’IRPF de cada comunitat, límits de l’atur, trams d’autònoms) són en fitxers separats per país i any, cadascun amb la seva font oficial: BOE, butlletins autonòmics, Seguretat Social, SEPE i Agència Tributària. Quan un any encara no té totes les dades publicades, es marca com a <em>provisional</em> i s’utilitzen les vigents més els canvis ja aprovats.</p>
<h2>Com s’actualitza</h2><p>Cada setmana es revisen el BOE i els butlletins autonòmics. Si canvia una xifra, s’actualitza el fitxer de paràmetres, s’executen més de 180 proves automàtiques de càlcul i es torna a publicar el lloc; la data de cada pàgina indica la seva última revisió.</p>`}
<h2 id="financiacion">Com ens financem</h2><p>Les calculadores són gratuïtes i ho continuaran sent. El lloc es paga amb publicitat de Google AdSense i, en algunes pàgines, amb un enllaç patrocinat a un servei relacionat (${X.patrocinio ?? 'gestoria, facturació, banca per a autònoms'}), sempre marcat com a «Publicitat». Si contractes des d’aquest enllaç cobrem una comissió i el teu preu no canvia. Cap anunciant influeix en els càlculs ni en l’ordre de les calculadores.</p>
<h2>Ús d’intel·ligència artificial</h2><p>El codi i els esborranys dels textos es preparen amb ajuda d’intel·ligència artificial. Les xifres no les genera la IA: surten de la normativa i de les proves automàtiques, i l’editor revisa per mostreig les pàgines noves cada setmana.</p>
<h2>Errors i contacte</h2><p>Si veus un resultat que no quadra amb ${X.comparar ?? 'la teva nòmina o la teva liquidació'}, escriu a <a href="mailto:${t.email}">${t.email}</a> amb les dades del càlcul: es revisa i, si hi ha error, es corregeix el mateix dia.</p>`,
      };
    }
  }
}

// ——— Condiciones de la suscripción al widget para profesionales («Para profesionales», #condiciones) ———
// Al final del archivo y aparte del resto, para no chocar con otros cambios. Precios finales con IVA (MARCAS.md §3).
export function condicionesWidget(lang: Lang, p: { pro: number; proAnio: number; agencia: number; portal?: string }): string {
  const t = sitio.titular;
  const base = (x: number) => (x / 1.21).toFixed(2).replace('.', ',');
  const es = lang === 'es';
  const portal = p.portal ? `<a href="${p.portal}" rel="noopener">${es ? 'portal de cliente' : 'portal de client'}</a>` : es ? 'portal de cliente de Stripe' : 'portal de client de Stripe';
  return es
    ? `<h3>Quién presta el servicio</h3><p>${t.nombre}, NIF ${t.nif}, ${t.domicilio}. Contacto: <a href="mailto:${t.email}">${t.email}</a>. El cobro lo gestiona Stripe Payments Europe, Ltd.: nunca vemos los datos de tu tarjeta.</p>
<h3>Precio</h3><p>Los precios son finales e incluyen el IVA del 21 %: plan Profesional, ${p.pro} € al mes (${base(p.pro)} € + IVA) o ${p.proAnio} € al año (${base(p.proAnio)} € + IVA); plan Agencia, ${p.agencia} € al mes (${base(p.agencia)} € + IVA). En cada cobro recibes la factura por correo, con tu NIF si lo indicas al pagar. El plan Gratis no tiene coste ni caduca.</p>
<h3>Renovación</h3><p>La suscripción se renueva sola al final de cada mes o de cada año, al mismo precio, hasta que la canceles. Si algún día cambia el precio, te avisamos por correo con 30 días de antelación y puedes cancelar antes sin coste.</p>
<h3>Cancelación en un clic</h3><p>Cancelas cuando quieras desde el ${portal} (el enlace está en cada recibo), con un solo clic, sin llamadas ni preguntas. El widget sigue sin enlace hasta el final del periodo pagado; después vuelve solo a la versión gratis, con enlace, sin que tengas que tocar tu web. No se devuelve la parte no usada del periodo, salvo en el desistimiento.</p>
<h3>Desistimiento</h3><p>Si contratas como consumidor, tienes 14 días naturales para desistir y te devolvemos el importe íntegro: basta un correo a ${t.email}. Si contratas como empresa o profesional, también te devolvemos el primer cobro si lo pides en esos 14 días.</p>
<h3>Qué incluye</h3><p>Marca blanca (sin el enlace a nuestra web) en los dominios contratados (1 en Profesional y hasta 10 en Agencia), tu logo, tus colores y un aviso por correo cuando cambie una norma que afecte a las calculadoras (SMI, IRPF, cotizaciones, IVA…). Los resultados son orientativos: el widget no es asesoramiento, y lo que publicas en tu web es responsabilidad tuya. Procuramos un servicio continuo, pero no garantizamos una disponibilidad concreta.</p>
<h3>Ley aplicable</h3><p>Estas condiciones se rigen por la ley española.</p>`
    : `<h3>Qui presta el servei</h3><p>${t.nombre}, NIF ${t.nif}, ${t.domicilio}. Contacte: <a href="mailto:${t.email}">${t.email}</a>. El cobrament el gestiona Stripe Payments Europe, Ltd.: mai no veiem les dades de la teva targeta.</p>
<h3>Preu</h3><p>Els preus són finals i inclouen l’IVA del 21 %: pla Professional, ${p.pro} € al mes (${base(p.pro)} € + IVA) o ${p.proAnio} € l’any (${base(p.proAnio)} € + IVA); pla Agència, ${p.agencia} € al mes (${base(p.agencia)} € + IVA). A cada cobrament reps la factura per correu, amb el teu NIF si l’indiques en pagar. El pla Gratuït no té cost ni caduca.</p>
<h3>Renovació</h3><p>La subscripció es renova sola al final de cada mes o de cada any, al mateix preu, fins que la cancel·lis. Si algun dia canvia el preu, t’avisem per correu amb 30 dies d’antelació i pots cancel·lar abans sense cost.</p>
<h3>Cancel·lació en un clic</h3><p>Cancel·les quan vulguis des del ${portal} (l’enllaç és a cada rebut), amb un sol clic, sense trucades ni preguntes. El giny continua sense enllaç fins al final del període pagat; després torna sol a la versió gratuïta, amb enllaç, sense que hagis de tocar el teu web. No es retorna la part no utilitzada del període, llevat del desistiment.</p>
<h3>Desistiment</h3><p>Si contractes com a consumidor, tens 14 dies naturals per desistir i et retornem l’import íntegre: n’hi ha prou amb un correu a ${t.email}. Si contractes com a empresa o professional, també et retornem el primer cobrament si ho demanes en aquests 14 dies.</p>
<h3>Què inclou</h3><p>Marca blanca (sense l’enllaç al nostre web) als dominis contractats (1 al Professional i fins a 10 a l’Agència), el teu logo, els teus colors i un avís per correu quan canviï una norma que afecti les calculadores (SMI, IRPF, cotitzacions, IVA…). Els resultats són orientatius: el giny no és assessorament, i el que publiques al teu web és responsabilitat teva. Procurem un servei continu, però no garantim una disponibilitat concreta.</p>
<h3>Llei aplicable</h3><p>Aquestes condicions es regeixen per la llei espanyola.</p>`;
}
