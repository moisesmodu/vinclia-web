import pais from '@/config/paises/es.json';
import marca from '@/config/marca.json';
import type { Idioma } from './tipos';

type Doc = { titulo: string; secciones: { h: string; p: string[] }[] };
const L = {
  ...pais.legal,
  titular: process.env.LEGAL_NOM || pais.legal.titular,
  nif: process.env.LEGAL_NIF || pais.legal.nif,
  domicilio: process.env.LEGAL_ADRECA || pais.legal.domicilio,
  email: process.env.LEGAL_EMAIL || pais.legal.email,
};
const nif = L.nif || '(pendent)'; // LEGAL_NIF: obligatori abans de cobrar (art. 10 LSSI)
const eur = (c: number) => `${(c / 100).toFixed(2).replace('.', ',')} €`;
const g = pais.gratis;

export const DOCS = ['avis-legal', 'privadesa', 'galetes', 'condicions'] as const;
export type DocLegal = (typeof DOCS)[number];

export function legal(doc: DocLegal, idioma: Idioma): Doc {
  const ca = idioma === 'ca';
  const contacto = `${L.email} ${ca ? 'o el formulari de la pàgina Contacte' : 'o el formulario de la página Contacto'}`;
  switch (doc) {
    case 'avis-legal':
      return {
        titulo: ca ? 'Avís legal' : 'Aviso legal',
        secciones: [
          { h: 'Titular', p: [`${marca.nombre} (${marca.dominio}) ${ca ? 'és un servei de' : 'es un servicio de'} ${L.titular}, ${L.registro}, NIF ${nif}, ${L.domicilio}. ${ca ? 'Contacte' : 'Contacto'}: ${contacto}.`] },
          { h: ca ? 'Objecte' : 'Objeto', p: [ca ? "Plataforma de preparació dels certificats oficials de català (B1, B2, C1 i C2). No és una administració pública ni té cap vinculació amb la Direcció General de Política Lingüística, el CPNL, les universitats ni el Departament de Salut. Les convocatòries i els resultats oficials són els que publiquen aquests organismes. La probabilitat d'aprovar és una estimació estadística, no una garantia." : 'Plataforma de preparación de los certificados oficiales de catalán (B1, B2, C1 y C2). No es una administración pública ni tiene vinculación con la Direcció General de Política Lingüística, el CPNL, las universidades ni el Departament de Salut. Las convocatorias y los resultados oficiales son los que publican esos organismos. La probabilidad de aprobar es una estimación estadística, no una garantía.'] },
          { h: ca ? 'Contingut generat amb IA' : 'Contenido generado con IA', p: [ca ? "Els exercicis, textos i correccions es generen amb intel·ligència artificial (models entrenats en català) i es validen amb el corrector LanguageTool amb les regles de Softcatalà. Una mostra setmanal es revisa per una persona filòloga. Pot haver-hi errors: cada exercici té un botó per informar-ne i es corregeixen en menys de 24 hores. Quan la IA dubta, la correcció ho marca com a «possible error»." : 'Los ejercicios, textos y correcciones se generan con inteligencia artificial (modelos entrenados en catalán) y se validan con el corrector LanguageTool con las reglas de Softcatalà. Una muestra semanal la revisa una persona filóloga. Puede haber errores: cada ejercicio tiene un botón para informar y se corrigen en menos de 24 horas. Cuando la IA duda, la corrección lo marca como «posible error».'] },
          { h: ca ? 'Propietat intel·lectual' : 'Propiedad intelectual', p: [ca ? "Els textos, exercicis i el programari pertanyen al titular. Les fitxes normatives enllaçades són de l'Optimot i de l'Institut d'Estudis Catalans. No es reprodueixen proves oficials: els simulacres són originals i segueixen l'estructura publicada." : 'Los textos, ejercicios y el software pertenecen al titular. Las fichas normativas enlazadas son del Optimot y del Institut d\'Estudis Catalans. No se reproducen pruebas oficiales: los simulacros son originales y siguen la estructura publicada.'] },
          { h: ca ? 'Llei aplicable' : 'Ley aplicable', p: [`${L.ley}. ${L.jurisdiccion}.`] },
        ],
      };
    case 'privadesa':
      return {
        titulo: ca ? 'Política de privadesa' : 'Política de privacidad',
        secciones: [
          { h: 'Responsable', p: [`${L.titular}, NIF ${nif}, ${L.domicilio}. ${ca ? 'Contacte' : 'Contacto'}: ${contacto}.`] },
          { h: ca ? 'Quines dades' : 'Qué datos', p: [ca ? "Sense compte: el teu progrés es guarda només al teu navegador i un identificador anònim (galeta tècnica) controla les quotes gratuïtes i la comparació amb la cohort. Amb compte: correu i contrasenya (xifrada amb scrypt), el teu progrés, els textos que envies a corregir i les dades de pagament, que gestiona Stripe (no veiem el número de la targeta)." : 'Sin cuenta: tu progreso se guarda solo en tu navegador y un identificador anónimo (cookie técnica) controla las cuotas gratuitas y la comparación con la cohorte. Con cuenta: correo y contraseña (cifrada con scrypt), tu progreso, los textos que envías a corregir y los datos de pago, que gestiona Stripe (no vemos el número de la tarjeta).', ca ? "Veu: l'àudio que graves a la pràctica oral es processa per transcriure'l i puntuar la pronúncia i no es conserva un cop puntuat. Si el reconeixement es fa al mateix navegador, l'àudio no surt del teu dispositiu." : 'Voz: el audio que grabas en la práctica oral se procesa para transcribirlo y puntuar la pronunciación y no se conserva una vez puntuado. Si el reconocimiento se hace en el propio navegador, el audio no sale de tu dispositivo.'] },
          { h: ca ? 'Finalitat i base legal' : 'Finalidad y base legal', p: [ca ? 'Prestar el servei (art. 6.1.b RGPD), complir obligacions fiscals (art. 6.1.c) i, si t\'hi apuntes, enviar-te avisos de convocatòria (consentiment, art. 6.1.a, revocable en un clic amb l\'enllaç de baixa que porta cada correu). No fem perfils publicitaris ni venem dades.' : 'Prestar el servicio (art. 6.1.b RGPD), cumplir obligaciones fiscales (art. 6.1.c) y, si te apuntas, enviarte avisos de convocatoria (consentimiento, art. 6.1.a, revocable en un clic con el enlace de baja que lleva cada correo). No hacemos perfiles publicitarios ni vendemos datos.'] },
          { h: ca ? 'Encarregats' : 'Encargados', p: [ca ? "Vercel Inc. (allotjament), Neon Inc. (base de dades, UE), Stripe Payments Europe Ltd. (pagaments), Resend (correu), proveïdor de correcció i veu (Anthropic o el BSC per a la correcció per criteris; LanguageTool; Google o Microsoft per a la síntesi de veu si s'activa). Les transferències fora de l'UE es fan amb clàusules contractuals tipus." : 'Vercel Inc. (alojamiento), Neon Inc. (base de datos, UE), Stripe Payments Europe Ltd. (pagos), Resend (correo), proveedor de corrección y voz (Anthropic o el BSC para la corrección por criterios; LanguageTool; Google o Microsoft para la síntesis de voz si se activa). Las transferencias fuera de la UE se hacen con cláusulas contractuales tipo.'] },
          { h: ca ? 'Conservació' : 'Conservación', p: [ca ? "Mentre tinguis compte. L'historial es conserva encara que cancel·lis, perquè puguis tornar-hi. Pots esborrar el compte i totes les dades tu mateix des d'El meu compte («Esborrar el meu compte»), a l'instant; també pots demanar-nos-ho i ho fem en 30 dies. Les redaccions de la prova de validesa (sense nom) s'esborren als 90 dies. Factures: 6 anys." : 'Mientras tengas cuenta. El historial se conserva aunque canceles, para que puedas volver. Puedes borrar la cuenta y todos los datos tú mismo desde Mi cuenta («Borrar mi cuenta»), al instante; también puedes pedírnoslo y lo hacemos en 30 días. Las redacciones de la prueba de validez (sin nombre) se borran a los 90 días. Facturas: 6 años.'] },
          { h: ca ? 'Drets' : 'Derechos', p: [ca ? `Accés, rectificació, supressió, oposició, limitació i portabilitat (pots exportar el teu historial des de l'app). Escriu-nos a ${contacto}. Pots reclamar a l'Autoritat Catalana de Protecció de Dades o a l'AEPD.` : `Acceso, rectificación, supresión, oposición, limitación y portabilidad (puedes exportar tu historial desde la app). Escríbenos a ${contacto}. Puedes reclamar ante la Autoritat Catalana de Protecció de Dades o la AEPD.`] },
        ],
      };
    case 'galetes':
      return {
        titulo: ca ? 'Política de galetes' : 'Política de cookies',
        secciones: [
          { h: ca ? 'Què fem servir' : 'Qué usamos', p: [ca ? "Dues galetes tècniques: aprova_sessio (sessió iniciada) i aprova_anon (identificador anònim per a les quotes gratuïtes), i l'emmagatzematge local del navegador per guardar el teu progrés. Són necessàries per al servei i no requereixen consentiment (art. 22.2 LSSI)." : 'Dos cookies técnicas: aprova_sessio (sesión iniciada) y aprova_anon (identificador anónimo para las cuotas gratuitas), y el almacenamiento local del navegador para guardar tu progreso. Son necesarias para el servicio y no requieren consentimiento (art. 22.2 LSSI).', ca ? "No fem servir galetes publicitàries ni d'analítica." : 'No usamos cookies publicitarias ni de analítica.'] },
          { h: ca ? 'Pagaments' : 'Pagos', p: [ca ? "A la pàgina de pagament de Stripe s'apliquen les galetes de Stripe per prevenir el frau (stripe.com/cookies-policy)." : 'En la página de pago de Stripe se aplican las cookies de Stripe para prevenir el fraude (stripe.com/cookies-policy).'] },
        ],
      };
    case 'condicions':
      return {
        titulo: ca ? 'Condicions de venda i desistiment' : 'Condiciones de venta y desistimiento',
        secciones: [
          { h: ca ? 'Gratis' : 'Gratis', p: [ca ? `Diagnòstic complet, ${g.simulacresMes} simulacre complet al mes, minisessions il·limitades, ${g.correccionsMes} correccions escrites i ${g.oralMinutsMes} minuts de pràctica oral al mes. Sense targeta.` : `Diagnóstico completo, ${g.simulacresMes} simulacro completo al mes, minisesiones ilimitadas, ${g.correccionsMes} correcciones escritas y ${g.oralMinutsMes} minutos de práctica oral al mes. Sin tarjeta.`] },
          { h: 'Premium', p: [ca ? `En crear el compte tens 7 dies de prova amb tot obert, sense targeta; després, la minisessió i el repàs dels errors continuen sent gratuïts. Premium: mensual ${eur(999)}; anual ${eur(5999)}; passi de convocatòria de 3 mesos ${eur(2499)} (pagament únic, no es renova). IVA inclòs. Inclou pla complet, pràctica i simulacres il·limitats, correccions il·limitades i pràctica oral il·limitada.` : `Al crear la cuenta tienes 7 días de prueba con todo abierto, sin tarjeta; después, la minisesión y el repaso de errores siguen siendo gratuitos. Premium: mensual ${eur(999)}; anual ${eur(5999)}; pase de convocatoria de 3 meses ${eur(2499)} (pago único, no se renueva). IVA incluido. Incluye plan completo, práctica y simulacros ilimitados, correcciones ilimitadas y práctica oral ilimitada.`] },
          { h: ca ? 'Renovació i avisos' : 'Renovación y avisos', p: [ca ? `Les subscripcions es renoven automàticament fins que les cancel·lis. T'avisem per correu ${pais.avisRenovacioDies} dies abans de cada renovació i 2 dies abans que acabi la prova gratuïta de l'anual.` : `Las suscripciones se renuevan automáticamente hasta que las canceles. Te avisamos por correo ${pais.avisRenovacioDies} días antes de cada renovación y 2 días antes de que acabe la prueba gratuita del anual.`] },
          { h: ca ? 'Cancel·lació' : 'Cancelación', p: [ca ? "Des del teu compte, en un clic i en qualsevol moment. No es renova i mantens l'accés fins al final del període pagat. El teu historial no s'esborra." : 'Desde tu cuenta, en un clic y en cualquier momento. No se renueva y mantienes el acceso hasta el final del periodo pagado. Tu historial no se borra.'] },
          { h: ca ? 'Desistiment i devolució' : 'Desistimiento y devolución', p: [ca ? `Tens ${L.desistimientoDias} dies naturals des del primer pagament per desistir, sense donar motius, i et tornem l'import íntegre pel mateix mitjà (RDL 1/2007, art. 102 i seg.). Escriu-nos a ${contacto} indicant el correu del compte.` : `Tienes ${L.desistimientoDias} días naturales desde el primer pago para desistir, sin dar motivos, y te devolvemos el importe íntegro por el mismo medio (RDL 1/2007, art. 102 y ss.). Escríbenos a ${contacto} indicando el correo de la cuenta.`] },
          { h: ca ? 'Garantia' : 'Garantía', p: [ca ? "Si completes el 90 % del teu pla i no aproves la convocatòria que tenies triada, et donem 6 mesos més gratis (cal el justificant del resultat oficial)." : 'Si completas el 90 % de tu plan y no apruebas la convocatoria que tenías elegida, te damos 6 meses más gratis (hace falta el justificante del resultado oficial).'] },
          { h: ca ? 'Llei i conflictes' : 'Ley y conflictos', p: [`${L.ley}. ${L.jurisdiccion}. ${ca ? "Abans de qualsevol via judicial, pots reclamar-nos per escrit a " + contacto + " i acudir als serveis públics de consum (OMIC, Agència Catalana del Consum) o a una entitat de resolució alternativa de litigis acreditada." : 'Antes de cualquier vía judicial, puedes reclamarnos por escrito en ' + contacto + ' y acudir a los servicios públicos de consumo (OMIC, Agència Catalana del Consum) o a una entidad de resolución alternativa de litigios acreditada.'}`] },
        ],
      };
  }
}
