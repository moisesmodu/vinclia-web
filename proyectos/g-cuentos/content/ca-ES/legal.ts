import type { DocumentoLegal } from "../tipos";

// Esborranys per revisar amb el gestor. Les variables {TITULAR}, {NIF}, {DOMICILIO}, {EMAIL} es substitueixen en mostrar-les.
export const LEGAL_CA: DocumentoLegal[] = [
  {
    slug: "aviso-legal",
    titulo: "Avís legal",
    secciones: [
      { h2: "Titular", parrafos: ["En compliment de l'article 10 de la Llei 34/2002 (LSSI-CE), aquest web és titularitat de {TITULAR}, amb NIF {NIF} i domicili a {DOMICILIO}. Correu de contacte: {EMAIL}. Lunilla és el nom comercial amb què opera."] },
      { h2: "Objecte", parrafos: ["El web permet crear i comprar contes infantils personalitzats en format digital (PDF) i imprès (tapa dura)."] },
      { h2: "Propietat intel·lectual", parrafos: ["Les plantilles narratives, els personatges, el disseny i el codi del web pertanyen al titular. El client pot fer servir el conte comprat per a ús privat i familiar, imprimir-lo i compartir-lo amb la família; no el pot revendre."] },
      { h2: "Contingut creat amb intel·ligència artificial", parrafos: ["Els textos i les il·lustracions de cada conte es generen amb ajuda d'eines d'intel·ligència artificial a partir de plantilles escrites i revisades pel titular. Així s'indica també al colofó de cada llibre."] },
    ],
  },
  {
    slug: "privacidad",
    titulo: "Política de privacitat",
    secciones: [
      { h2: "Responsable", parrafos: ["{TITULAR}, NIF {NIF}, {DOMICILIO}. Contacte: {EMAIL}."] },
      { h2: "Quines dades tractem i per a què", parrafos: ["Per escriure el conte: el nom de pila de l'infant, l'edat, la ciutat, el nom i el tipus de mascota, l'afició, el tema triat i la dedicatòria. No demanem ni tractem fotografies ni cognoms del menor.", "Per lliurar la comanda: el teu correu i, si compres el llibre imprès, el teu nom, adreça i telèfon.", "Per al programa d'afiliades: nom, correu, xarxa social i dades de cobrament de qui s'hi apunta."] },
      { h2: "Base legal", parrafos: ["L'execució del contracte (article 6.1.b del RGPD), el compliment d'obligacions legals (6.1.c) per a la facturació i el teu consentiment (6.1.a) per a la galeta d'afiliació."] },
      { h2: "Conservació", parrafos: ["Els esborranys no comprats s'eliminen als 30 dies. Les comandes es conserven el temps que exigeix la normativa fiscal (6 anys) i els fitxers del conte, 12 mesos perquè el puguis tornar a descarregar."] },
      { h2: "Qui ens ajuda", parrafos: ["Vercel (allotjament), Neon (base de dades), Stripe (pagaments), Resend (correu), Gelato (impressió i enviament), Anthropic (text) i Higgsfield (il·lustracions). Alguns són fora de l'Espai Econòmic Europeu; les transferències s'emparen en el Marc de Privacitat de Dades UE-EUA o en clàusules contractuals tipus. Als serveis d'IA només s'envien les dades necessàries per al conte."] },
      { h2: "Els teus drets", parrafos: ["Pots demanar accés, rectificació, supressió, oposició, limitació i portabilitat a {EMAIL}. També pots reclamar davant l'Agència Espanyola de Protecció de Dades (aepd.es) o l'Autoritat Catalana de Protecció de Dades si escau."] },
    ],
  },
  {
    slug: "cookies",
    titulo: "Política de galetes",
    secciones: [
      { h2: "Quines galetes fem servir", parrafos: ["Aquest web no fa servir galetes de publicitat ni d'analítica de tercers.", "Galeta «afiliado» (pròpia, 30 dies): només s'instal·la si arribes des de l'enllaç d'una col·laboradora i acceptes l'avís; serveix per atribuir-li la venda.", "Stripe pot instal·lar galetes tècniques per prevenir el frau a la seva pàgina de pagament."] },
    ],
  },
  {
    slug: "condiciones",
    titulo: "Condicions de venda",
    secciones: [
      { h2: "Producte", parrafos: ["Conte infantil personalitzat de 12 pàgines il·lustrades, en PDF descarregable o en llibre imprès de tapa dura de 20 × 20 cm i 28 pàgines interiors (que inclou també el PDF). Abans de pagar pots veure gratis una vista prèvia; les il·lustracions de la vista prèvia són de mostra."] },
      { h2: "Preus", parrafos: ["Preus en euros amb l'IVA inclòs (4 % per a llibres). El llibre imprès inclou l'enviament a la península i les Illes Balears. De moment no enviem a Canàries, Ceuta ni Melilla."] },
      { h2: "Lliurament", parrafos: ["El PDF s'envia al correu indicat, normalment en menys de 2 hores. El llibre imprès es fabrica sota demanda i sol arribar en uns 5 a 7 dies feiners."] },
      { h2: "Dret de desistiment", parrafos: ["En ser un producte personalitzat segons les especificacions del consumidor, no s'aplica el dret de desistiment (article 103.c del Reial decret legislatiu 1/2007). Per al PDF, en acceptar la compra consents que el lliurament comenci immediatament i reconeixes que perds el dret de desistiment (article 103.m)."] },
      { h2: "La nostra garantia", parrafos: ["Si el conte no t'agrada, te'l refem gratis una vegada. Si el llibre arriba malmès o amb un defecte d'impressió, el reimprimim sense cost: escriu-nos a {EMAIL} amb una foto dins dels 14 dies següents."] },
      { h2: "Llei aplicable", parrafos: ["Aquestes condicions es regeixen per la llei espanyola. Són competents els jutjats del domicili del consumidor."] },
    ],
  },
];
