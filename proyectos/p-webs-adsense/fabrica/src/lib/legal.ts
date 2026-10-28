// Páginas legales (LSSI, RGPD, cookies) y «Quiénes somos y método», generadas con los datos del titular.
// Revisión recomendada por un gestor antes de solicitar AdSense; el texto sigue la guía de la AEPD.
import type { Lang } from './def';
import { sitio, anunciosActivos } from './sitio';

export interface PaginaLegal { titulo: string; descripcion: string; html: string }

export function legal(id: string, lang: Lang, actualizado: string): PaginaLegal {
  const t = sitio.titular, n = sitio.nombre, dom = sitio.dominio.replace(/^https?:\/\//, '');
  const ads = anunciosActivos();
  const es = lang === 'es';
  switch (id) {
    case 'aviso':
      return es ? {
        titulo: `Aviso legal · ${n}`, descripcion: `Datos del titular de ${n} y condiciones de uso del sitio.`,
        html: `<p>En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI), se informa de que este sitio web, <strong>${dom}</strong>, es titularidad de <strong>${t.nombre}</strong>, con NIF ${t.nif} y domicilio en ${t.domicilio}. Contacto: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Objeto y uso</h2><p>${n} ofrece calculadoras y tablas de datos gratuitas con fines informativos. Los resultados son orientativos: se calculan con la normativa publicada en el BOE y en las fuentes oficiales citadas en cada página, pero no sustituyen el asesoramiento de un profesional ni los cálculos de la empresa, la Seguridad Social, el SEPE o la Agencia Tributaria. No se prestan servicios de asesoría ni se recogen datos de los cálculos: todo se calcula en tu navegador.</p>
<h2>Responsabilidad</h2><p>El titular revisa los parámetros con cada cambio normativo y corrige los errores que se le comuniquen, pero no responde de las decisiones tomadas a partir de los resultados. Los enlaces a sitios de terceros se ofrecen como referencia.</p>
<h2>Propiedad intelectual</h2><p>El código, los textos y el diseño son del titular. Las tablas de datos pueden citarse libremente enlazando a la página de origen.</p>
<h2>Legislación</h2><p>Este aviso se rige por la ley española.</p>`,
      } : {
        titulo: `Avís legal · ${n}`, descripcion: `Dades del titular de ${n} i condicions d’ús del lloc.`,
        html: `<p>En compliment de l’article 10 de la Llei 34/2002 de serveis de la societat de la informació (LSSI), s’informa que aquest lloc web, <strong>${dom}</strong>, és titularitat de <strong>${t.nombre}</strong>, amb NIF ${t.nif} i domicili a ${t.domicilio}. Contacte: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Objecte i ús</h2><p>${n} ofereix calculadores i taules de dades gratuïtes amb finalitats informatives. Els resultats són orientatius: es calculen amb la normativa publicada al BOE i a les fonts oficials citades a cada pàgina, però no substitueixen l’assessorament d’un professional ni els càlculs de l’empresa, la Seguretat Social, el SEPE o l’Agència Tributària. No es presten serveis d’assessoria ni es recullen dades dels càlculs: tot es calcula al teu navegador.</p>
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
<h2>Encargados y transferencias</h2><p>El alojamiento lo presta Vercel Inc., con cláusulas contractuales tipo de la Comisión Europea para cualquier transferencia fuera del Espacio Económico Europeo.${ads ? ' Google Ireland Ltd. actúa como responsable independiente para la publicidad.' : ''}</p>
<h2>Tus derechos</h2><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${t.email}. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>`,
      } : {
        titulo: `Política de privacitat · ${n}`, descripcion: `Quines dades es tracten a ${n}, amb quina base legal i com exercir els teus drets.`,
        html: `<p><strong>Responsable:</strong> ${t.nombre}, NIF ${t.nif}, ${t.domicilio}. Contacte: <a href="mailto:${t.email}">${t.email}</a>.</p>
<h2>Quines dades tractem</h2><ul><li><strong>Calculadores:</strong> les dades que escrius (salari, dates, situació familiar) es processen només al teu navegador. No s’envien ni es desen en cap servidor. Si fas servir «Copia l’enllaç», les dades van a la mateixa adreça que comparteixes.</li>
<li><strong>Estadístiques:</strong> fem servir Umami, una analítica sense galetes que no desa adreces IP ni identifica persones. Mesura pàgines vistes, país i tipus de dispositiu de manera agregada. Base legal: interès legítim (art. 6.1.f RGPD) a saber quines eines es fan servir.</li>
<li><strong>Correu:</strong> si ens escrius, fem servir la teva adreça només per respondre’t i l’esborrem quan ja no cal. Base legal: el teu consentiment.</li>
${ads ? `<li><strong>Publicitat:</strong> el lloc mostra anuncis de Google AdSense. Google i els seus socis poden fer servir galetes i identificadors per mostrar anuncis i mesurar-los, personalitzats o no segons el que triïs a l’avís de consentiment (marc TCF 2.2 d’IAB Europe). Base legal: el teu consentiment, que pots retirar en qualsevol moment des de «Gestiona les galetes». Més informació a <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">com fa servir Google la informació dels llocs que utilitzen els seus serveis</a>.</li>` : ''}</ul>
<h2>Encarregats i transferències</h2><p>L’allotjament el presta Vercel Inc., amb clàusules contractuals tipus de la Comissió Europea per a qualsevol transferència fora de l’Espai Econòmic Europeu.${ads ? ' Google Ireland Ltd. actua com a responsable independent per a la publicitat.' : ''}</p>
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
<h2>Cómo calculamos</h2><p>Cada calculadora aplica paso a paso la norma que cita: el Estatuto de los Trabajadores, la Ley General de la Seguridad Social, la Ley y el Reglamento del IRPF, la Ley del IVA o la Ley General Tributaria. El método está publicado en cada página, debajo de la herramienta, con un ejemplo numérico.</p>
<h2>De dónde salen los datos</h2><p>Los parámetros (SMI, IPREM, bases y tipos de cotización, escalas del IRPF de cada comunidad, topes del paro, tramos de autónomos) están en archivos separados por país y año, cada uno con su fuente oficial: BOE, boletines autonómicos, Seguridad Social, SEPE y Agencia Tributaria. Cuando un año aún no tiene todos los datos publicados, se marca como <em>provisional</em> y se usan los vigentes más los cambios ya aprobados.</p>
<h2>Cómo se actualiza</h2><p>Cada semana se revisan el BOE y los boletines autonómicos. Si cambia una cifra, se actualiza el archivo de parámetros, se ejecutan más de 180 pruebas automáticas de cálculo y se vuelve a publicar el sitio; la fecha de cada página indica su última revisión.</p>
<h2>Uso de inteligencia artificial</h2><p>El código y los borradores de los textos se preparan con ayuda de inteligencia artificial. Las cifras no las genera la IA: salen de la normativa y de las pruebas automáticas, y el editor revisa por muestreo las páginas nuevas cada semana.</p>
<h2>Errores y contacto</h2><p>Si ves un resultado que no cuadra con tu nómina o tu liquidación, escribe a <a href="mailto:${t.email}">${t.email}</a> con los datos del cálculo: se revisa y, si hay error, se corrige el mismo día.</p>`,
      } : {
        titulo: `Qui som i mètode · ${n}`, descripcion: `Qui fa ${n}, com es calculen els resultats, d’on surten les dades i com s’actualitzen.`,
        html: `<h2>Qui hi ha al darrere</h2><p><strong>${a.nombre}</strong> · ${a.rol.ca}. ${a.bio.ca}</p>
<h2>Com calculem</h2><p>Cada calculadora aplica pas a pas la norma que cita: l’Estatut dels Treballadors, la Llei general de la Seguretat Social, la Llei i el Reglament de l’IRPF, la Llei de l’IVA o la Llei general tributària. El mètode està publicat a cada pàgina, sota l’eina, amb un exemple numèric.</p>
<h2>D’on surten les dades</h2><p>Els paràmetres (SMI, IPREM, bases i tipus de cotització, escales de l’IRPF de cada comunitat, límits de l’atur, trams d’autònoms) són en fitxers separats per país i any, cadascun amb la seva font oficial: BOE, butlletins autonòmics, Seguretat Social, SEPE i Agència Tributària. Quan un any encara no té totes les dades publicades, es marca com a <em>provisional</em> i s’utilitzen les vigents més els canvis ja aprovats.</p>
<h2>Com s’actualitza</h2><p>Cada setmana es revisen el BOE i els butlletins autonòmics. Si canvia una xifra, s’actualitza el fitxer de paràmetres, s’executen més de 180 proves automàtiques de càlcul i es torna a publicar el lloc; la data de cada pàgina indica la seva última revisió.</p>
<h2>Ús d’intel·ligència artificial</h2><p>El codi i els esborranys dels textos es preparen amb ajuda d’intel·ligència artificial. Les xifres no les genera la IA: surten de la normativa i de les proves automàtiques, i l’editor revisa per mostreig les pàgines noves cada setmana.</p>
<h2>Errors i contacte</h2><p>Si veus un resultat que no quadra amb la teva nòmina o la teva liquidació, escriu a <a href="mailto:${t.email}">${t.email}</a> amb les dades del càlcul: es revisa i, si hi ha error, es corregeix el mateix dia.</p>`,
      };
    }
  }
}
