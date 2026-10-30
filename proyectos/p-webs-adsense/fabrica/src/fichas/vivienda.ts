// Fichas de datos «citables» de PisoClaro: Euríbor, ITP y AJD, gastos de compra, plusvalía, cuotas, IRAV, aranceles,
// hipotecas del INE y esfuerzo por sueldo. Las cifras salen de params/es/<año>/vivienda.json o del motor.
import { tt, type Lang } from '../lib/def';
import type { Ficha } from './tipos';
import { leerCSV } from '../lib/csv';
import { r2 } from '../lib/calc/base';
import { cuota, cuotaComunidad, datosITP, datosAJD, gastosCompra, notaria, registro, capitalParaCuota, nombreMes } from '../lib/calc/vivienda';
import { COD_VIV, nomViv } from '../lib/camposVivienda';

const BDE = { nombre: tt('Banco de España: tipos de interés de referencia oficiales', 'Banc d’Espanya: tipus d’interès de referència oficials'), url: 'https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html' };
const BOE_ITP = { nombre: tt('Texto refundido del ITP y AJD, RDLeg 1/1993 (BOE)', 'Text refós de l’ITP i AJD, RDLeg 1/1993 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1993-25359' };
const ATC = { nombre: tt('Agència Tributària de Catalunya: ITP-AJD', 'Agència Tributària de Catalunya: ITP-AJD'), url: 'https://atc.gencat.cat/es/tributs/itp-ajd/' };
const INE_H = { nombre: tt('INE: Estadística de Hipotecas, julio de 2026', 'INE: Estadística d’Hipoteques, juliol del 2026'), url: 'https://www.ine.es/dyngs/Prensa/H0726.htm' };
const NOT = { nombre: tt('RD 1426/1989, arancel de los notarios (BOE)', 'RD 1426/1989, aranzel dels notaris (BOE)'), url: 'https://www.boe.es/eli/es/rd/1989/11/17/1426/con' };
const REG = { nombre: tt('RD 1427/1989, arancel de los registradores (BOE)', 'RD 1427/1989, aranzel dels registradors (BOE)'), url: 'https://www.boe.es/eli/es/rd/1989/11/17/1427' };
const L = (l: Lang, es: string, ca: string) => (l === 'es' ? es : ca);
const F = (f: (l: Lang) => string) => ({ es: f('es'), ca: f('ca') });
const N = (n: number, l: Lang) => new Intl.NumberFormat(l === 'es' ? 'es-ES' : 'ca-ES', { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
const estado = (pend: boolean) => (pend ? tt('Sin cotejar', 'Sense confrontar') : tt('Verificado', 'Verificat'));
const IMPORTES = [80000, 100000, 120000, 150000, 180000, 200000, 250000, 300000, 350000, 400000];

export const FICHAS: Ficha[] = [
  {
    id: 'euribor-historico',
    slug: tt('euribor-historico', 'euribor-historic'),
    titulo: tt('Euríbor a 12 meses: histórico mensual y por años', 'Euríbor a 12 mesos: històric mensual i per anys'),
    h1: tt('Euríbor a 12 meses: últimos meses y diciembre de cada año', 'Euríbor a 12 mesos: últims mesos i desembre de cada any'),
    descripcion: tt('Media mensual del Euríbor a un año desde septiembre de 2025 y valor de diciembre de cada año desde 2017, con el estado de cada dato.', 'Mitjana mensual de l’Euríbor a un any des de setembre del 2025 i valor de desembre de cada any des del 2017, amb l’estat de cada dada.'),
    intro: tt('<p>El Euríbor a 12 meses es el índice de la mayoría de hipotecas variables en España. Lo publica EMMI y el Banco de España confirma la media de cada mes en el BOE a primeros del mes siguiente. Es la cifra que usa tu banco en la revisión. Marcamos qué datos ya hemos cotejado con el Banco de España y cuáles salen de la prensa especializada.</p>', '<p>L’Euríbor a 12 mesos és l’índex de la majoria d’hipoteques variables a Espanya. El publica EMMI i el Banc d’Espanya confirma la mitjana de cada mes al BOE a primers del mes següent. És la xifra que fa servir el teu banc a la revisió. Marquem quines dades ja hem confrontat amb el Banc d’Espanya i quines surten de la premsa especialitzada.</p>'),
    fuentes: [BDE, { nombre: tt('BOE-A-2026-18507: tipos de referencia de agosto de 2026', 'BOE-A-2026-18507: tipus de referència d’agost del 2026'), url: 'https://boe.es/boe/dias/2026/09/02/pdfs/BOE-A-2026-18507.pdf' }],
    calc: 'viv-revision-euribor',
    tablas: ({ P }) => {
      const s = P.vivienda.euribor_12m.serie.filter((x: any) => x.valor != null);
      const d = leerCSV('vivienda', 'datos', 'euribor-diciembre.csv');
      return [
        { titulo: tt('Media mensual', 'Mitjana mensual'), cab: [tt('Mes', 'Mes'), tt('Euríbor', 'Euríbor'), tt('Variación anual (puntos)', 'Variació anual (punts)'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'num', 'txt'],
          filas: [...s].reverse().map((x: any) => { const [y, m] = x.mes.split('-'); const prev = s.find((z: any) => z.mes === `${+y - 1}-${m}`); return [{ es: nombreMes(x.mes, 'es'), ca: nombreMes(x.mes, 'ca') }, x.valor, prev ? r2(x.valor - prev.valor) : '—', estado(!!x.pendiente_cotejo)]; }) },
        { titulo: tt('Diciembre de cada año', 'Desembre de cada any'), cab: [tt('Año', 'Any'), tt('Euríbor de diciembre', 'Euríbor de desembre'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'txt'],
          filas: [...d].reverse().map((x) => [x.anio, +x.valor, estado(x.verificado !== 'si')]) },
      ];
    },
  },
  {
    id: 'itp-por-comunidad',
    slug: tt('itp-por-comunidad', 'itp-per-comunitat'),
    titulo: tt('ITP de vivienda por comunidad autónoma 2027', 'ITP d’habitatge per comunitat autònoma 2027'),
    h1: tt('ITP de la vivienda de segunda mano en cada comunidad', 'ITP de l’habitatge de segona mà a cada comunitat'),
    descripcion: tt('Tipo general o escala del ITP de vivienda usada en las 19 comunidades y ciudades autónomas, tipos reducidos citados y estado de verificación de cada dato.', 'Tipus general o escala de l’ITP d’habitatge usat a les 19 comunitats i ciutats autònomes, tipus reduïts citats i estat de verificació de cada dada.'),
    intro: tt('<p>El impuesto de transmisiones patrimoniales (ITP) grava la compra de una vivienda de segunda mano. Es un tributo cedido: cada comunidad fija su tipo, que va del 4 % del País Vasco al 13 % del tramo más alto de Cataluña y Baleares. La base es el precio o el valor de referencia de Catastro, el mayor.</p>', '<p>L’impost de transmissions patrimonials (ITP) grava la compra d’un habitatge de segona mà. És un tribut cedit: cada comunitat en fixa el tipus, que va del 4 % del País Basc al 13 % del tram més alt de Catalunya i les Balears. La base és el preu o el valor de referència del Cadastre, el més alt.</p>'),
    fuentes: [BOE_ITP, ATC, { nombre: tt('Comunidad de Madrid: tributos', 'Comunitat de Madrid: tributs'), url: 'https://www.comunidad.madrid/servicios/atencion-contribuyente' }],
    calc: 'viv-itp',
    tablas: ({ P, lang }) => {
      const C = P.vivienda.itp_vivienda_usada.comunidades;
      return [{ cab: [tt('Comunidad', 'Comunitat'), tt('Tipo general', 'Tipus general'), tt('ITP con 200.000 €', 'ITP amb 200.000 €'), tt('Escala o tramo alto', 'Escala o tram alt'), tt('Reducidos citados', 'Reduïts citats'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'eur0', 'txt', 'txt', 'txt'],
        filas: COD_VIV.map((k) => { const c = C[k]; const d = datosITP(P.vivienda, k); return [nomViv(k, lang), c.tipo_general, cuotaComunidad(200000, d).cuota, d.escala ? d.escala.map((t) => `${t.tipo} %`).join(' / ') : d.tramoAlto ? L(lang, `${d.tramoAlto.tipo} % desde ${d.tramoAlto.desde / 1e6} M€`, `${d.tramoAlto.tipo} % des de ${d.tramoAlto.desde / 1e6} M€`) : '—', (c.reducidos ?? []).map((r: any) => `${r.tipo} %`).join(', ') || '—', estado(d.pendiente)]; }) }];
    },
  },
  {
    id: 'ajd-por-comunidad',
    slug: tt('ajd-por-comunidad', 'ajd-per-comunitat'),
    titulo: tt('AJD de vivienda nueva por comunidad autónoma 2027', 'AJD d’habitatge nou per comunitat autònoma 2027'),
    h1: tt('Actos jurídicos documentados en la compra de vivienda nueva', 'Actes jurídics documentats en la compra d’habitatge nou'),
    descripcion: tt('Tipo general del AJD que se paga con el IVA al comprar vivienda nueva, por comunidad, con el importe para 250.000 € y las comunidades aún sin dato cotejado.', 'Tipus general de l’AJD que es paga amb l’IVA en comprar habitatge nou, per comunitat, amb l’import per a 250.000 € i les comunitats encara sense dada confrontada.'),
    intro: tt('<p>Quien compra una vivienda nueva al promotor paga IVA y, además, la cuota gradual de actos jurídicos documentados (AJD) por la escritura. El AJD de la escritura de hipoteca lo paga el banco desde 2018. Las comunidades sin dato se irán completando con su boletín.</p>', '<p>Qui compra un habitatge nou al promotor paga IVA i, a més, la quota gradual d’actes jurídics documentats (AJD) per l’escriptura. L’AJD de l’escriptura d’hipoteca el paga el banc des del 2018. Les comunitats sense dada s’aniran completant amb el seu butlletí.</p>'),
    fuentes: [BOE_ITP, { nombre: tt('Ley 37/1992 del IVA, art. 91 (BOE)', 'Llei 37/1992 de l’IVA, art. 91 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740' }],
    calc: 'viv-iva-ajd',
    tablas: ({ P, lang }) => [{ cab: [tt('Comunidad', 'Comunitat'), tt('Tipo de AJD', 'Tipus d’AJD'), tt('AJD con 250.000 €', 'AJD amb 250.000 €'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'eur0', 'txt'],
      filas: COD_VIV.map((k) => { const d = datosAJD(P.vivienda, k); return { k, d }; }).filter((x) => x.d.tipo != null).sort((a, b) => a.d.tipo! - b.d.tipo!).map(({ k, d }) => [nomViv(k, lang), d.tipo!, r2(250000 * d.tipo! / 100), estado(d.pendiente)])
        .concat(COD_VIV.filter((k) => datosAJD(P.vivienda, k).tipo == null).map((k) => [nomViv(k, lang), '—', '—', tt('Pendiente', 'Pendent')] as any)) }],
  },
  {
    id: 'gastos-compraventa-por-comunidad',
    slug: tt('gastos-compraventa-por-comunidad', 'despeses-compravenda-per-comunitat'),
    titulo: tt('Cuánto cuesta comprar una vivienda de 200.000 € en cada comunidad', 'Quant costa comprar un habitatge de 200.000 € a cada comunitat'),
    h1: tt('Impuestos y gastos de comprar una vivienda de 200.000 €', 'Impostos i despeses de comprar un habitatge de 200.000 €'),
    descripcion: tt('ITP, notaría, registro, gestoría y tasación de una vivienda usada de 200.000 € en las 19 comunidades, ordenadas de la más barata a la más cara.', 'ITP, notaria, registre, gestoria i taxació d’un habitatge usat de 200.000 € a les 19 comunitats, ordenades de la més barata a la més cara.'),
    intro: tt('<p>Calculado con nuestra calculadora de gastos para una vivienda de segunda mano de 200.000 €, con el tipo general de ITP, la escala de notaría con su rebaja, el arancel del registro, 300 € de gestoría y 350 € de tasación de ejemplo, más el IVA de esos honorarios.</p>', '<p>Calculat amb la nostra calculadora de despeses per a un habitatge de segona mà de 200.000 €, amb el tipus general d’ITP, l’escala de notaria amb la rebaixa, l’aranzel del registre, 300 € de gestoria i 350 € de taxació d’exemple, més l’IVA d’aquests honoraris.</p>'),
    fuentes: [BOE_ITP, NOT, REG],
    calc: 'viv-gastos-compraventa',
    tablas: ({ P, lang }) => [{ cab: [tt('Comunidad', 'Comunitat'), tt('ITP', 'ITP'), tt('Notaría y registro', 'Notaria i registre'), tt('Total gastos', 'Total despeses'), tt('Sobre el precio', 'Sobre el preu')], formatos: ['txt', 'eur0', 'eur', 'eur0', 'pct'],
      filas: COD_VIV.map((k) => ({ k, g: gastosCompra({ precio: 200000, ccaa: k, nueva: false, gestoria: 300, tasacion: 350 }, P.vivienda) })).sort((a, b) => a.g.total - b.g.total).map(({ k, g }) => [nomViv(k, lang), g.itp, r2(g.notaria + g.registro), g.total, g.pctSobrePrecio]) }],
  },
  {
    id: 'coeficientes-plusvalia',
    slug: tt('coeficientes-plusvalia', 'coeficients-plusvalua'),
    titulo: tt('Coeficientes de plusvalía municipal vigentes y RDL 29/2026', 'Coeficients de plusvàlua municipal vigents i RDL 29/2026'),
    h1: tt('Coeficientes máximos de la plusvalía municipal por años', 'Coeficients màxims de la plusvàlua municipal per anys'),
    descripcion: tt('Coeficientes máximos del método objetivo de la plusvalía según los años de tenencia: los vigentes de 2024 y los del RDL 29/2026, pendientes de convalidación.', 'Coeficients màxims del mètode objectiu de la plusvàlua segons els anys de tinença: els vigents del 2024 i els del RDL 29/2026, pendents de convalidació.'),
    intro: tt('<p>En el método objetivo, la base de la plusvalía es el valor catastral del suelo por un coeficiente que depende de los años que has tenido la vivienda. Siguen vigentes los coeficientes de 2024 (RDL 8/2023), porque los de 2025 y 2026 decayeron. El RDL 29/2026 los cambia desde el 1/12/2026 (unos bajan y otros suben) solo si se convalida; de momento conocemos algunos.</p>', '<p>En el mètode objectiu, la base de la plusvàlua és el valor cadastral del sòl per un coeficient que depèn dels anys que has tingut l’habitatge. Continuen vigents els coeficients del 2024 (RDL 8/2023), perquè els del 2025 i el 2026 van decaure. El RDL 29/2026 els canvia des de l’1/12/2026 (uns baixen i d’altres pugen) només si es convalida; de moment en coneixem alguns.</p>'),
    fuentes: [{ nombre: tt('Texto refundido de la Ley de Haciendas Locales, art. 107 (BOE)', 'Text refós de la Llei d’hisendes locals, art. 107 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2004-4214' }, { nombre: tt('Ayuntamiento de Santa Cruz de Tenerife: coeficientes de 2024', 'Ajuntament de Santa Cruz de Tenerife: coeficients del 2024'), url: 'https://sede.santacruzdetenerife.es/sede/fileadmin/user_upload/Sede/tramites/Tributos/T239_CALCULO_DE_LA_CUOTA_TRIBUTARIA_DE_LA_PLUSVALIA_2024.pdf' }],
    calc: 'viv-plusvalia',
    tablas: ({ P }) => {
      const V = P.vivienda.plusvalia_municipal;
      return [{ cab: [tt('Años de tenencia', 'Anys de tinença'), tt('Vigente (RDL 8/2023)', 'Vigent (RDL 8/2023)'), tt('RDL 29/2026, si se convalida', 'RDL 29/2026, si es convalida')], formatos: ['num0', 'num', 'num'],
        filas: Object.entries<number>(V.coeficientes_maximos_vigentes.por_anios).map(([k, c]) => [k === '20_o_mas' ? 20 : +k, c, V.coeficientes_rdl_29_2026.conocidos[k] ?? '—']) }];
    },
  },
  {
    id: 'cuota-hipoteca-por-importe',
    slug: tt('cuota-hipoteca-por-importe', 'quota-hipoteca-per-import'),
    titulo: tt('Tabla de cuotas de hipoteca por importe y plazo', 'Taula de quotes d’hipoteca per import i termini'),
    h1: tt('Cuota mensual de la hipoteca por importe y plazo', 'Quota mensual de la hipoteca per import i termini'),
    descripcion: tt('Cuota mensual de hipotecas de 80.000 a 400.000 € a 15, 20, 25, 30 y 35 años con el tipo medio del INE, calculada con el sistema francés.', 'Quota mensual d’hipoteques de 80.000 a 400.000 € a 15, 20, 25, 30 i 35 anys amb el tipus mitjà de l’INE, calculada amb el sistema francès.'),
    intro: tt('<p>Cada celda es la cuota mensual de una hipoteca a tipo fijo con el interés medio de las hipotecas sobre vivienda que publica el INE. Para otro interés, usa el simulador.</p>', '<p>Cada cel·la és la quota mensual d’una hipoteca a tipus fix amb l’interès mitjà de les hipoteques sobre habitatge que publica l’INE. Per a un altre interès, fes servir el simulador.</p>'),
    fuentes: [INE_H, { nombre: tt('Ley 5/2019 de crédito inmobiliario (BOE)', 'Llei 5/2019 de crèdit immobiliari (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3814' }],
    calc: 'viv-simulador-hipoteca',
    tablas: ({ P }) => {
      const tin = P.vivienda.hipotecas_ine.tipo_interes_medio_pct;
      return [{ titulo: { es: `Interés del ${String(tin).replace('.', ',')} %`, ca: `Interès del ${String(tin).replace('.', ',')} %` }, cab: [tt('Importe', 'Import'), tt('15 años', '15 anys'), tt('20 años', '20 anys'), tt('25 años', '25 anys'), tt('30 años', '30 anys'), tt('35 años', '35 anys')], formatos: ['eur0', 'eur', 'eur', 'eur', 'eur', 'eur'],
        filas: IMPORTES.map((i) => [i, ...[15, 20, 25, 30, 35].map((a) => r2(cuota(i, tin, a * 12)))]) }];
    },
  },
  {
    id: 'irav-mensual',
    slug: tt('irav-mensual', 'irav-mensual'),
    titulo: tt('IRAV: índice de actualización del alquiler mes a mes', 'IRAV: índex d’actualització del lloguer mes a mes'),
    h1: tt('Índice de referencia del alquiler de vivienda (IRAV)', 'Índex de referència del lloguer d’habitatge (IRAV)'),
    descripcion: tt('Valor mensual del IRAV del INE, el índice que actualiza los contratos de alquiler firmados desde el 26 de mayo de 2023, y subida de una renta de 900 €.', 'Valor mensual de l’IRAV de l’INE, l’índex que actualitza els contractes de lloguer signats des del 26 de maig del 2023, i pujada d’una renda de 900 €.'),
    intro: tt('<p>El IRAV sustituye al IPC en los contratos de alquiler de vivienda firmados desde el 26/5/2023 que remiten a un índice (Ley 12/2023). Lo publica el INE cada mes. Las cifras de esta tabla salen de prensa especializada y están pendientes de cotejo en ine.es.</p>', '<p>L’IRAV substitueix l’IPC en els contractes de lloguer d’habitatge signats des del 26/5/2023 que remeten a un índex (Llei 12/2023). El publica l’INE cada mes. Les xifres d’aquesta taula surten de premsa especialitzada i estan pendents de confrontació a ine.es.</p>'),
    fuentes: [{ nombre: tt('INE: Índice de Referencia de Arrendamientos de Vivienda', 'INE: Índex de Referència d’Arrendaments d’Habitatge'), url: 'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736177033' }, { nombre: tt('Ley 12/2023 por el derecho a la vivienda (BOE)', 'Llei 12/2023 pel dret a l’habitatge (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-12203' }],
    calc: 'viv-subida-alquiler',
    tablas: ({ P }) => [{ cab: [tt('Mes', 'Mes'), tt('IRAV', 'IRAV'), tt('Renta de 900 € pasa a', 'Renda de 900 € passa a'), tt('Estado', 'Estat')], formatos: ['txt', 'pct', 'eur', 'txt'],
      filas: [...P.vivienda.irav_alquiler.serie].filter((x: any) => x.valor != null).reverse().map((x: any) => [{ es: nombreMes(x.mes, 'es'), ca: nombreMes(x.mes, 'ca') }, x.valor, r2(900 * (1 + x.valor / 100)), estado(!!x.pendiente_cotejo)]) }],
  },
  {
    id: 'aranceles-notaria-registro',
    slug: tt('aranceles-notaria-registro', 'aranzels-notaria-registre'),
    titulo: tt('Aranceles de notaría y registro por precio de la vivienda', 'Aranzels de notaria i registre per preu de l’habitatge'),
    h1: tt('Notaría y registro de la compraventa según el precio', 'Notaria i registre de la compravenda segons el preu'),
    descripcion: tt('Arancel notarial con la rebaja del 5 % y arancel registral de la escritura de compraventa, de 100.000 a 600.000 €, sin y con IVA, sin copias ni folios.', 'Aranzel notarial amb la rebaixa del 5 % i aranzel registral de l’escriptura de compravenda, de 100.000 a 600.000 €, sense i amb IVA, sense còpies ni folis.'),
    intro: tt('<p>Los honorarios de notarios y registradores están regulados por arancel: una escala acumulativa sobre el precio. Esta tabla aplica el número 2 de cada arancel. No incluye copias, folios ni suplidos, que dependen de cada notaría. Los tramos del registro desde 150.253,03 € están pendientes de cotejo.</p>', '<p>Els honoraris de notaris i registradors estan regulats per aranzel: una escala acumulativa sobre el preu. Aquesta taula aplica el número 2 de cada aranzel. No inclou còpies, folis ni suplerts, que depenen de cada notaria. Els trams del registre des de 150.253,03 € estan pendents de confrontació.</p>'),
    fuentes: [NOT, REG],
    calc: 'viv-notaria-registro',
    tablas: ({ P }) => {
      const iva = P.vivienda.iva_vivienda.general_servicios.tipo;
      return [{ cab: [tt('Precio', 'Preu'), tt('Notaría', 'Notaria'), tt('Registro', 'Registre'), tt('Suma sin IVA', 'Suma sense IVA'), tt('Total con IVA', 'Total amb IVA')], formatos: ['eur0', 'eur', 'eur', 'eur', 'eur'],
        filas: [100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000].map((p) => { const a = notaria(p, P.vivienda).conRebaja, b = registro(p, P.vivienda); return [p, a, b, r2(a + b), r2((a + b) * (1 + iva / 100))]; }) }];
    },
  },
  {
    id: 'hipotecas-ine',
    slug: tt('hipotecas-ine', 'hipoteques-ine'),
    titulo: tt('Hipotecas sobre viviendas: datos del INE de julio de 2026', 'Hipoteques sobre habitatges: dades de l’INE de juliol del 2026'),
    h1: tt('Hipotecas sobre viviendas según el INE', 'Hipoteques sobre habitatges segons l’INE'),
    descripcion: tt('Número de hipotecas, importe medio, tipo de interés medio, plazo y reparto entre fijo y variable de la Estadística de Hipotecas del INE de julio de 2026.', 'Nombre d’hipoteques, import mitjà, tipus d’interès mitjà, termini i repartiment entre fix i variable de l’Estadística d’Hipoteques de l’INE de juliol del 2026.'),
    intro: tt('<p>La Estadística de Hipotecas del INE recoge cada mes las hipotecas sobre viviendas inscritas en los registros. Estos son los datos provisionales de julio de 2026, publicados el 28 de septiembre. Los usamos como valores por defecto del simulador.</p>', '<p>L’Estadística d’Hipoteques de l’INE recull cada mes les hipoteques sobre habitatges inscrites als registres. Aquestes són les dades provisionals de juliol del 2026, publicades el 28 de setembre. Les fem servir com a valors per defecte del simulador.</p>'),
    fuentes: [INE_H, { nombre: tt('INE: Estadística de Hipotecas (metodología)', 'INE: Estadística d’Hipoteques (metodologia)'), url: 'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736170236' }],
    calc: 'viv-simulador-hipoteca',
    tablas: ({ P }) => {
      const h = P.vivienda.hipotecas_ine;
      return [
        { titulo: tt('Tipo de interés medio al constituir la hipoteca', 'Tipus d’interès mitjà en constituir la hipoteca'), cab: [tt('Tipo de hipoteca', 'Tipus d’hipoteca'), tt('Interés medio', 'Interès mitjà'), F((l) => `${l === 'es' ? 'Cuota de' : 'Quota de'} ${N(h.importe_medio_eur, l)} € ${l === 'es' ? 'a' : 'a'} ${h.plazo_medio_anios} ${l === 'es' ? 'años' : 'anys'}`)], formatos: ['txt', 'pct', 'eur'],
          filas: [[tt('Fija', 'Fixa'), h.tipo_inicial_medio_fijo_pct, r2(cuota(h.importe_medio_eur, h.tipo_inicial_medio_fijo_pct, h.plazo_medio_anios * 12))], [tt('Todas', 'Totes'), h.tipo_interes_medio_pct, r2(cuota(h.importe_medio_eur, h.tipo_interes_medio_pct, h.plazo_medio_anios * 12))], [tt('Variable (tipo inicial)', 'Variable (tipus inicial)'), h.tipo_inicial_medio_variable_pct, r2(cuota(h.importe_medio_eur, h.tipo_inicial_medio_variable_pct, h.plazo_medio_anios * 12))]] },
        { titulo: tt('Resumen del mes', 'Resum del mes'), cab: [tt('Dato', 'Dada'), tt('Valor', 'Valor')], formatos: ['txt', 'txt'], filas: [
          [tt('Hipotecas sobre viviendas', 'Hipoteques sobre habitatges'), F((l) => `${N(h.numero_hipotecas_vivienda, l)} (${N(h.variacion_anual_numero_pct, l)} % ${l === 'es' ? 'en un año' : 'en un any'})`)],
          [tt('Importe medio', 'Import mitjà'), F((l) => `${N(h.importe_medio_eur, l)} € (+${N(h.variacion_anual_importe_pct, l)} % ${l === 'es' ? 'en un año' : 'en un any'})`)],
          [tt('Plazo medio', 'Termini mitjà'), F((l) => `${h.plazo_medio_anios} ${l === 'es' ? 'años' : 'anys'}`)],
          [tt('A tipo fijo', 'A tipus fix'), F((l) => `${N(h.porcentaje_tipo_fijo, l)} %`)],
          [tt('A tipo variable', 'A tipus variable'), F((l) => `${N(h.porcentaje_tipo_variable, l)} %`)],
        ] },
      ];
    },
  },
  {
    id: 'esfuerzo-hipotecario-por-sueldo',
    slug: tt('esfuerzo-hipotecario-por-sueldo', 'esforc-hipotecari-per-sou'),
    titulo: tt('Hipoteca máxima según el sueldo neto', 'Hipoteca màxima segons el sou net'),
    h1: tt('Cuánta hipoteca te dan según lo que cobras', 'Quanta hipoteca et donen segons el que cobres'),
    descripcion: tt('Hipoteca máxima para sueldos netos de 1.200 a 5.000 € al mes con un esfuerzo del 30, 35 y 40 %, a 30 años y con el tipo medio del INE.', 'Hipoteca màxima per a sous nets de 1.200 a 5.000 € al mes amb un esforç del 30, 35 i 40 %, a 30 anys i amb el tipus mitjà de l’INE.'),
    intro: tt('<p>Los bancos suelen limitar la cuota a un porcentaje de los ingresos netos. No es una norma: es un criterio de riesgo que cada entidad fija. La tabla calcula el préstamo cuya cuota a 30 años, con el interés medio del INE, cabe en el 30, 35 o 40 % del sueldo neto mensual.</p>', '<p>Els bancs solen limitar la quota a un percentatge dels ingressos nets. No és una norma: és un criteri de risc que cada entitat fixa. La taula calcula el préstec la quota del qual a 30 anys, amb l’interès mitjà de l’INE, cap en el 30, 35 o 40 % del sou net mensual.</p>'),
    fuentes: [INE_H, { nombre: tt('Banco de España: Portal del Cliente Bancario, hipotecas', 'Banc d’Espanya: Portal del Client Bancari, hipoteques'), url: 'https://clientebancario.bde.es/pcb/es/menu-horizontal/productoservici/financiacion/prestamohipotec/' }],
    calc: 'viv-cuanta-hipoteca',
    tablas: ({ P }) => {
      const tin = P.vivienda.hipotecas_ine.tipo_interes_medio_pct;
      return [{ cab: [tt('Sueldo neto al mes', 'Sou net al mes'), tt('Esfuerzo 30 %', 'Esforç 30 %'), tt('Esfuerzo 35 %', 'Esforç 35 %'), tt('Esfuerzo 40 %', 'Esforç 40 %')], formatos: ['eur0', 'eur0', 'eur0', 'eur0'],
        filas: [1200, 1500, 1800, 2000, 2200, 2500, 3000, 3500, 4000, 4500, 5000].map((s) => [s, ...[30, 35, 40].map((e) => Math.round(capitalParaCuota(s * e / 100, tin, 360) / 100) * 100)]) }];
    },
  },
];
