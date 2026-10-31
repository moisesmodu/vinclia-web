// Fichas de datos «citables» del sitio de impuestos y autónomos.
import { tt } from '../lib/def';
import type { Ficha } from './tipos';
import { leerCSV } from '../lib/csv';
import { cuotaAnual, baseTrabajo, escalaAhorroTotal } from '../lib/calc/irpf';
import { cotizacion } from '../lib/calc/ss';
import { tipoMarginal } from '../lib/calc/base';
import paisES from '../../params/es/pais.json';
import { tr, MODELOS } from '../lib/traducciones';

const LIRPF = { nombre: tt('Ley 35/2006 del IRPF (BOE)', 'Llei 35/2006 de l’IRPF (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764' };
const AEAT_MANUAL = { nombre: tt('AEAT: manual práctico de Renta', 'AEAT: manual pràctic de Renda'), url: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos.html' };
const LIVA = { nombre: tt('Ley 37/1992 del IVA (BOE)', 'Llei 37/1992 de l’IVA (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740' };
const COM = Object.keys(paisES.comunidades);
const nom = (c: string, lang: 'es' | 'ca') => (paisES.comunidades as any)[c][lang];
const tramo = (desde: number, hasta: number | null) => `${desde.toLocaleString('es-ES')} – ${hasta == null ? '∞' : hasta.toLocaleString('es-ES')}`;

export const FICHAS: Ficha[] = [
  {
    id: 'escalas-irpf-comunidades',
    slug: tt('tramos-irpf-comunidades', 'trams-irpf-comunitats'),
    titulo: tt('Tramos del IRPF por comunidad autónoma 2026', 'Trams de l’IRPF per comunitat autònoma 2026'),
    h1: tt('Escalas autonómicas del IRPF por comunidad', 'Escales autonòmiques de l’IRPF per comunitat'),
    descripcion: tt('Tipo mínimo, tipo máximo, número de tramos y mínimo personal de la escala autonómica del IRPF de las 15 comunidades de régimen común y Ceuta y Melilla.', 'Tipus mínim, tipus màxim, nombre de trams i mínim personal de l’escala autonòmica de l’IRPF de les 15 comunitats de règim comú i Ceuta i Melilla.'),
    intro: tt('<p>El IRPF tiene dos mitades: la estatal, igual para todos, y la autonómica, que fija cada comunidad. Esta tabla resume la parte autonómica; el tipo total es la suma de las dos. País Vasco y Navarra tienen un IRPF propio (foral) y no están incluidos.</p>', '<p>L’IRPF té dues meitats: l’estatal, igual per a tothom, i l’autonòmica, que fixa cada comunitat. Aquesta taula resumeix la part autonòmica; el tipus total és la suma de totes dues. El País Basc i Navarra tenen un IRPF propi (foral) i no hi són inclosos.</p>'),
    fuentes: [LIRPF, AEAT_MANUAL],
    calc: 'irpf-renta',
    tablas: ({ P, lang }) => [{ cab: [tt('Comunidad', 'Comunitat'), tt('Tramos', 'Trams'), tt('Tipo mínimo', 'Tipus mínim'), tt('Tipo máximo', 'Tipus màxim'), tt('Máximo desde', 'Màxim des de'), tt('Mínimo personal', 'Mínim personal')], formatos: ['txt', 'num0', 'pct', 'pct', 'eur0', 'eur0'],
      filas: COM.map((c) => { const a = P.fiscal.irpf.escalas_autonomicas[c]; const e = a.escala; return [nom(c, lang), e.length, e[0].tipo, e[e.length - 1].tipo, e[e.length - 2]?.hasta ?? 0, a.minimo_personal ?? P.fiscal.irpf.minimos.personal]; }) }],
  },
  {
    id: 'irpf-por-salario-comunidad',
    slug: tt('irpf-por-comunidad-y-salario', 'irpf-per-comunitat-i-salari'),
    titulo: tt('Cuánto IRPF se paga en cada comunidad según el salario', 'Quant IRPF es paga a cada comunitat segons el salari'),
    h1: tt('IRPF anual por comunidad y salario', 'IRPF anual per comunitat i salari'),
    descripcion: tt('Comparativa del IRPF que paga un asalariado soltero sin hijos con 20.000, 30.000, 45.000, 60.000 y 100.000 € brutos en cada comunidad autónoma.', 'Comparativa de l’IRPF que paga un assalariat solter sense fills amb 20.000, 30.000, 45.000, 60.000 i 100.000 € bruts a cada comunitat autònoma.'),
    intro: tt('<p>Cuota líquida estimada del IRPF de un asalariado soltero, sin hijos y menor de 65 años, sin deducciones autonómicas ni otras rentas. Las diferencias entre comunidades crecen con el salario.</p>', '<p>Quota líquida estimada de l’IRPF d’un assalariat solter, sense fills i menor de 65 anys, sense deduccions autonòmiques ni altres rendes. Les diferències entre comunitats creixen amb el salari.</p>'),
    fuentes: [LIRPF, AEAT_MANUAL],
    calc: 'irpf-renta',
    tablas: ({ P, lang }) => {
      const brutos = [20000, 30000, 45000, 60000, 100000];
      const bases = brutos.map((b) => baseTrabajo(b, cotizacion({ brutoAnual: b }, P.laboral).trabajador.anual, P.fiscal).base);
      return [{ cab: [tt('Comunidad', 'Comunitat'), ...brutos.map((b) => `${(b / 1000).toLocaleString('es-ES')}.000 €`)], formatos: ['txt', 'eur0', 'eur0', 'eur0', 'eur0', 'eur0'],
        filas: COM.map((c) => [nom(c, lang), ...bases.map((bg, i) => cuotaAnual({ baseGeneral: bg, ccaa: c, rendimientosTrabajoIntegros: brutos[i] }, P.fiscal).total)]) }];
    },
  },
  {
    id: 'tipo-marginal-comunidades',
    slug: tt('tipo-maximo-irpf-comunidades', 'tipus-maxim-irpf-comunitats'),
    titulo: tt('Tipo marginal y máximo del IRPF por comunidad 2026', 'Tipus marginal i màxim de l’IRPF per comunitat 2026'),
    h1: tt('Tipo marginal del IRPF en cada comunidad', 'Tipus marginal de l’IRPF a cada comunitat'),
    descripcion: tt('Tipo marginal combinado (estatal más autonómico) a 20.000, 35.000, 60.000 y 150.000 € de base liquidable, y tipo máximo del IRPF en cada comunidad.', 'Tipus marginal combinat (estatal més autonòmic) a 20.000, 35.000, 60.000 i 150.000 € de base liquidable, i tipus màxim de l’IRPF a cada comunitat.'),
    intro: tt('<p>El tipo marginal es el porcentaje que pagas por el siguiente euro que ganas. Sirve para saber cuánto te quedas de una subida, de un plan de pensiones o de una factura extra.</p>', '<p>El tipus marginal és el percentatge que pagues per l’euro següent que guanyes. Serveix per saber quant et queda d’una pujada, d’un pla de pensions o d’una factura extra.</p>'),
    fuentes: [LIRPF, AEAT_MANUAL],
    calc: 'tipo-marginal-irpf',
    tablas: ({ P, lang }) => {
      const est = P.fiscal.irpf.escala_estatal;
      const bases = [20000, 35000, 60000, 150000];
      return [{ cab: [tt('Comunidad', 'Comunitat'), ...bases.map((b) => `${b.toLocaleString('es-ES')} €`), tt('Tipo máximo', 'Tipus màxim')], formatos: ['txt', 'pct', 'pct', 'pct', 'pct', 'pct'],
        filas: COM.map((c) => { const a = P.fiscal.irpf.escalas_autonomicas[c]; const bon = a.bonificacion_cuota_pct ? 1 - a.bonificacion_cuota_pct / 100 : 1; const m = (b: number) => Math.round((tipoMarginal(b, est) + tipoMarginal(b, a.escala)) * bon * 100) / 100; return [nom(c, lang), ...bases.map(m), m(1e9)]; }) }];
    },
  },
  {
    id: 'calendario-fiscal-2027',
    slug: tt('calendario-fiscal-2027', 'calendari-fiscal-2027'),
    titulo: tt('Calendario fiscal 2027 para autónomos: modelos y plazos', 'Calendari fiscal 2027 per a autònoms: models i terminis'),
    h1: tt('Calendario del contribuyente 2027', 'Calendari del contribuent 2027'),
    descripcion: tt('Fechas límite de 2027 de los modelos 303, 130, 111, 115, 390, 190, 180, 347 y la renta, con los días que pasan al siguiente hábil por caer en fin de semana.', 'Dates límit del 2027 dels models 303, 130, 111, 115, 390, 190, 180, 347 i la renda, amb els dies que passen al següent hàbil per caure en cap de setmana.'),
    intro: tt('<p>Calendario de las obligaciones trimestrales y anuales más habituales de autónomos y pymes. La Agencia Tributaria publica el calendario oficial en diciembre; si alguna fecha cambia, esta tabla se actualiza ese mismo día.</p>', '<p>Calendari de les obligacions trimestrals i anuals més habituals d’autònoms i pimes. L’Agència Tributària publica el calendari oficial al desembre; si alguna data canvia, aquesta taula s’actualitza aquell mateix dia.</p>'),
    fuentes: [{ nombre: tt('AEAT: calendario del contribuyente', 'AEAT: calendari del contribuent'), url: 'https://sede.agenciatributaria.gob.es/Sede/calendario-contribuyente.html' }],
    calc: 'modelo-303',
    tablas: ({ P, lang }) => {
      const cal: any[] = P.fiscal.modelos.calendario_2027 ?? [];
      return [{ cab: [tt('Fecha límite', 'Data límit'), tt('Modelos', 'Models'), tt('Qué se presenta', 'Què es presenta')], formatos: ['fecha', 'txt', 'txt'], filas: cal.map((x) => [x.fecha, (x.modelos ?? []).join(', '), (x.modelos ?? []).map((m: string) => `${m}: ${MODELOS[m]?.[lang] ?? ''}`).join('; ')]) }];
    },
  },
  {
    id: 'tipos-iva',
    slug: tt('tipos-iva', 'tipus-iva'),
    titulo: tt('Tipos de IVA en España 2026: 21, 10 y 4 % con ejemplos', 'Tipus d’IVA a Espanya 2026: 21, 10 i 4 % amb exemples'),
    h1: tt('Tipos de IVA y recargo de equivalencia', 'Tipus d’IVA i recàrrec d’equivalència'),
    descripcion: tt('Tipos de IVA general, reducido y superreducido con ejemplos de productos y servicios, operaciones exentas y recargo de equivalencia de cada tipo.', 'Tipus d’IVA general, reduït i superreduït amb exemples de productes i serveis, operacions exemptes i recàrrec d’equivalència de cada tipus.'),
    intro: tt('<p>En España hay tres tipos de IVA. El general se aplica a todo lo que la ley no rebaja expresamente. El recargo de equivalencia lo cobran los proveedores a los comercios minoristas que no presentan el modelo 303.</p>', '<p>A Espanya hi ha tres tipus d’IVA. El general s’aplica a tot el que la llei no rebaixa expressament. El recàrrec d’equivalència el cobren els proveïdors als comerços minoristes que no presenten el model 303.</p>'),
    fuentes: [LIVA, { nombre: 'AEAT: IVA', url: 'https://sede.agenciatributaria.gob.es/Sede/iva.html' }],
    calc: 'iva',
    tablas: ({ P, lang }) => {
      const I = P.fiscal.iva, E = I.ejemplos_por_tipo ?? {};
      return [{ cab: [tt('Tipo', 'Tipus'), tt('Recargo de equivalencia', 'Recàrrec d’equivalència'), tt('Ejemplos', 'Exemples')], formatos: ['txt', 'txt', 'txt'], filas: [
        [`${I.general} %`, `${I.recargo_equivalencia['21']} %`, (E['21'] ?? []).map((x: string) => tr(x, lang)).join(', ')],
        [`${I.reducido} %`, `${I.recargo_equivalencia['10']} %`, (E['10'] ?? []).map((x: string) => tr(x, lang)).join(', ')],
        [`${I.superreducido} %`, `${I.recargo_equivalencia['4']} %`, (E['4'] ?? []).map((x: string) => tr(x, lang)).join(', ')],
        [tt('0 % o exento', '0 % o exempt'), '—', (E['0_o_exento'] ?? []).map((x: string) => tr(x, lang)).join(', ')],
      ] }];
    },
  },
  {
    id: 'escala-ahorro',
    slug: tt('tramos-irpf-ahorro', 'trams-irpf-estalvi'),
    titulo: tt('Tramos del IRPF del ahorro 2026: intereses y ganancias', 'Trams de l’IRPF de l’estalvi 2026: interessos i guanys'),
    h1: tt('Escala del ahorro del IRPF', 'Escala de l’estalvi de l’IRPF'),
    descripcion: tt('Tipos del IRPF que se aplican a intereses, dividendos y ganancias por venta de acciones, fondos, criptomonedas o inmuebles: del 19 % al 30 %.', 'Tipus de l’IRPF que s’apliquen a interessos, dividends i guanys per venda d’accions, fons, criptomonedes o immobles: del 19 % al 30 %.'),
    intro: tt('<p>Los rendimientos del capital y las ganancias por ventas tributan en la base del ahorro, con una escala propia más baja que la del trabajo. Es igual en todas las comunidades.</p>', '<p>Els rendiments del capital i els guanys per vendes tributen a la base de l’estalvi, amb una escala pròpia més baixa que la del treball. És igual a totes les comunitats.</p>'),
    fuentes: [LIRPF, AEAT_MANUAL],
    calc: 'ganancias-patrimoniales',
    tablas: ({ P }) => { let d = 0; return [{ cab: [tt('Base del ahorro (€)', 'Base de l’estalvi (€)'), tt('Tipo total', 'Tipus total')], formatos: ['txt', 'pct'], filas: escalaAhorroTotal(P.fiscal).map((t) => { const f = [tramo(d, t.hasta), t.tipo]; d = t.hasta ?? d; return f; }) }]; },
  },
  {
    id: 'retenciones-tipos',
    slug: tt('tipos-retencion-irpf', 'tipus-retencio-irpf'),
    titulo: tt('Tipos de retención de IRPF 2026: profesionales, alquiler y más', 'Tipus de retenció d’IRPF 2026: professionals, lloguer i més'),
    h1: tt('Tipos fijos de retención del IRPF', 'Tipus fixos de retenció de l’IRPF'),
    descripcion: tt('Porcentajes de retención de IRPF en facturas de profesionales, nuevos autónomos, alquileres, intereses, administradores y cursos, con el modelo en que se ingresan.', 'Percentatges de retenció d’IRPF en factures de professionals, nous autònoms, lloguers, interessos, administradors i cursos, amb el model en què s’ingressen.'),
    intro: tt('<p>Además de la retención variable de las nóminas, hay retenciones a tipo fijo. Quien paga retiene el porcentaje y lo ingresa en Hacienda; para quien cobra, es un adelanto de su IRPF.</p>', '<p>A més de la retenció variable de les nòmines, hi ha retencions a tipus fix. Qui paga reté el percentatge i l’ingressa a Hisenda; per a qui cobra, és un avançament del seu IRPF.</p>'),
    fuentes: [{ nombre: tt('Reglamento del IRPF, arts. 95 a 101 (BOE)', 'Reglament de l’IRPF, arts. 95 a 101 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820' }],
    calc: 'factura',
    tablas: ({ P }) => { const R = P.fiscal.irpf.retenciones; return [{ cab: [tt('Concepto', 'Concepte'), tt('Retención', 'Retenció'), tt('Modelo', 'Model')], formatos: ['txt', 'pct', 'txt'], filas: [
      [tt('Actividades profesionales', 'Activitats professionals'), R.profesionales_pct, '111'],
      [tt('Profesionales en sus 3 primeros años', 'Professionals en els 3 primers anys'), R.profesionales_inicio_pct, '111'],
      [tt('Cursos, conferencias y obras literarias', 'Cursos, conferències i obres literàries'), 15, '111'],
      [tt('Alquiler de locales', 'Lloguer de locals'), R.alquiler_pct, '115'],
      [tt('Intereses y dividendos', 'Interessos i dividends'), R.capital_mobiliario_pct, '123'],
      [tt('Administradores (empresas de más de 100.000 € de cifra de negocio)', 'Administradors (empreses de més de 100.000 € de xifra de negoci)'), R.administradores_pct, '111'],
      [tt('Actividades en módulos (determinadas)', 'Activitats en mòduls (determinades)'), 1, '111'],
    ] }]; },
  },
  {
    id: 'intereses-historico',
    slug: tt('interes-legal-y-de-demora', 'interes-legal-i-de-demora'),
    titulo: tt('Interés legal del dinero y de demora 2026 e histórico', 'Interès legal dels diners i de demora 2026 i històric'),
    h1: tt('Interés legal del dinero e interés de demora', 'Interès legal dels diners i interès de demora'),
    descripcion: tt('Tipos del interés legal del dinero y del interés de demora tributario de cada año desde 2015, fijados en los Presupuestos Generales del Estado.', 'Tipus de l’interès legal dels diners i de l’interès de demora tributari de cada any des del 2015, fixats als pressupostos generals de l’Estat.'),
    intro: tt('<p>El interés de demora es lo que cobra Hacienda por cada día de retraso en un pago; el interés legal del dinero se usa en deudas civiles y en las devoluciones tardías. Sin presupuestos nuevos, se prorrogan los del año anterior.</p>', '<p>L’interès de demora és el que cobra Hisenda per cada dia de retard en un pagament; l’interès legal dels diners s’utilitza en deutes civils i en les devolucions tardanes. Sense pressupostos nous, es prorroguen els de l’any anterior.</p>'),
    fuentes: [{ nombre: tt('Leyes de Presupuestos Generales del Estado (BOE)', 'Lleis de pressupostos generals de l’Estat (BOE)'), url: 'https://www.boe.es/buscar/legislacion.php' }, { nombre: tt('Ley General Tributaria, art. 26 (BOE)', 'Llei general tributària, art. 26 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186' }],
    calc: 'intereses-demora',
    tablas: () => [{ cab: [tt('Año', 'Any'), tt('Interés legal del dinero', 'Interès legal dels diners'), tt('Interés de demora', 'Interès de demora')], formatos: ['txt', 'pct', 'pct'], filas: leerCSV('impuestos', 'datos', 'intereses-historico.csv').map((x) => [x.anio, +x.legal, +x.demora]).reverse() }],
  },
  {
    id: 'dietas-exentas',
    slug: tt('dietas-exentas-irpf', 'dietes-exemptes-irpf'),
    titulo: tt('Dietas exentas de IRPF 2026 y kilometraje (0,26 €/km)', 'Dietes exemptes d’IRPF 2026 i quilometratge (0,26 €/km)'),
    h1: tt('Importes de dietas y kilometraje exentos', 'Imports de dietes i quilometratge exempts'),
    descripcion: tt('Límites exentos de IRPF por manutención con y sin pernocta en España y en el extranjero y por kilometraje con vehículo propio, del Reglamento del IRPF.', 'Límits exempts d’IRPF per manutenció amb i sense pernoctació a Espanya i a l’estranger i per quilometratge amb vehicle propi, del Reglament de l’IRPF.'),
    intro: tt('<p>Lo que la empresa te paga por desplazamientos no tributa hasta estos límites diarios, siempre que el viaje sea fuera del municipio donde trabajas y vives. Por encima, el exceso tributa como salario.</p>', '<p>El que l’empresa et paga per desplaçaments no tributa fins a aquests límits diaris, sempre que el viatge sigui fora del municipi on treballes i vius. Per sobre, l’excés tributa com a salari.</p>'),
    fuentes: [{ nombre: tt('Reglamento del IRPF, art. 9 (BOE)', 'Reglament de l’IRPF, art. 9 (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820' }],
    calc: 'dietas-kilometraje',
    tablas: ({ P }) => { const D = P.fiscal.dietas_exentas; return [{ cab: [tt('Concepto', 'Concepte'), tt('España', 'Espanya'), tt('Extranjero', 'Estranger')], formatos: ['txt', 'eur', 'eur'], filas: [
      [tt('Manutención con pernocta (día)', 'Manutenció amb pernoctació (dia)'), D.espana.pernocta, D.extranjero.pernocta],
      [tt('Manutención sin pernocta (día)', 'Manutenció sense pernoctació (dia)'), D.espana.sin_pernocta, D.extranjero.sin_pernocta],
      [tt('Kilometraje (por km)', 'Quilometratge (per km)'), D.km_euros, D.km_euros],
    ] }]; },
  },
  {
    id: 'minimos-personales',
    slug: tt('minimo-personal-familiar-irpf', 'minim-personal-familiar-irpf'),
    titulo: tt('Mínimo personal y familiar del IRPF 2026: cuantías', 'Mínim personal i familiar de l’IRPF 2026: quanties'),
    h1: tt('Mínimo personal y familiar del IRPF', 'Mínim personal i familiar de l’IRPF'),
    descripcion: tt('Cuantías estatales del mínimo personal, por descendientes, ascendientes y discapacidad, y mínimo personal propio de cada comunidad autónoma.', 'Quanties estatals del mínim personal, per descendents, ascendents i discapacitat, i mínim personal propi de cada comunitat autònoma.'),
    intro: tt('<p>El mínimo personal y familiar es la parte de la renta que no tributa porque se destina a cubrir necesidades básicas. Algunas comunidades fijan cuantías más altas para su parte del impuesto.</p>', '<p>El mínim personal i familiar és la part de la renda que no tributa perquè es destina a cobrir necessitats bàsiques. Algunes comunitats fixen quanties més altes per a la seva part de l’impost.</p>'),
    fuentes: [LIRPF, AEAT_MANUAL],
    calc: 'irpf-renta',
    tablas: ({ P, lang }) => { const m = P.fiscal.irpf.minimos; return [
      { titulo: tt('Cuantías estatales', 'Quanties estatals'), cab: [tt('Concepto', 'Concepte'), tt('Importe anual', 'Import anual')], formatos: ['txt', 'eur'], filas: [
        [tt('Mínimo del contribuyente', 'Mínim del contribuent'), m.personal], [tt('Más de 65 años (incremento)', 'Més de 65 anys (increment)'), m.mayor_65], [tt('Más de 75 años (incremento adicional)', 'Més de 75 anys (increment addicional)'), m.mayor_75],
        [tt('Primer hijo', 'Primer fill'), m.descendientes[0]], [tt('Segundo hijo', 'Segon fill'), m.descendientes[1]], [tt('Tercer hijo', 'Tercer fill'), m.descendientes[2]], [tt('Cuarto hijo y siguientes', 'Quart fill i següents'), m.descendientes[3]],
        [tt('Hijo menor de 3 años (incremento)', 'Fill menor de 3 anys (increment)'), m.descendiente_menor_3], [tt('Ascendiente mayor de 65 años', 'Ascendent major de 65 anys'), m.ascendiente_mayor_65],
        [tt('Discapacidad del 33 % al 64 %', 'Discapacitat del 33 % al 64 %'), m.discapacidad_33], [tt('Discapacidad del 65 % o más', 'Discapacitat del 65 % o més'), m.discapacidad_65],
      ] },
      { titulo: tt('Mínimo personal autonómico', 'Mínim personal autonòmic'), cab: [tt('Comunidad', 'Comunitat'), tt('Mínimo personal', 'Mínim personal')], formatos: ['txt', 'eur'], filas: COM.filter((c) => c !== 'CE_ML').map((c) => [nom(c, lang), P.fiscal.irpf.escalas_autonomicas[c].minimo_personal ?? m.personal]) },
    ]; },
  },
];
