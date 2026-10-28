// Fichas de datos «citables» del sitio de nómina: tablas con datos oficiales o calculados con el motor.
import { tt } from '../lib/def';
import type { Ficha } from './tipos';
import { leerCSV } from '../lib/csv';
import { params } from '../lib/params';
import { sueldoNeto, indemnizacion, requisitoAnio } from '../lib/calc/laboral';
import { cotizacion } from '../lib/calc/ss';
import { retencion } from '../lib/calc/irpf';
import { r2 } from '../lib/calc/base';

const BOE_COT = { nombre: tt('Orden PJC/297/2026 de cotización (BOE)', 'Ordre PJC/297/2026 de cotització (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296' };
const LGSS = { nombre: tt('Ley General de la Seguridad Social (BOE)', 'Llei general de la Seguretat Social (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724' };
const ET = { nombre: tt('Estatuto de los Trabajadores (BOE)', 'Estatut dels Treballadors (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430' };
const RIRPF = { nombre: tt('Reglamento del IRPF (BOE)', 'Reglament de l’IRPF (BOE)'), url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820' };
const meses = (m: number, lang: string) => `${Math.floor(m / 12)} ${lang === 'es' ? 'años' : 'anys'}${m % 12 ? ` ${lang === 'es' ? 'y' : 'i'} ${m % 12} ${lang === 'es' ? 'meses' : 'mesos'}` : ''}`;

export const FICHAS: Ficha[] = [
  {
    id: 'smi-historico',
    slug: tt('salario-minimo-historico', 'salari-minim-historic'),
    titulo: tt('Salario mínimo en España: evolución 2000–2026', 'Salari mínim a Espanya: evolució 2000–2026'),
    h1: tt('Evolución del salario mínimo interprofesional (2000–2026)', 'Evolució del salari mínim interprofessional (2000–2026)'),
    descripcion: tt('Tabla del SMI de cada año desde 2000: mensual en 14 pagas, anual y subida respecto al año anterior, con el real decreto que lo fija.', 'Taula del SMI de cada any des del 2000: mensual en 14 pagues, anual i pujada respecte a l’any anterior, amb el reial decret que el fixa.'),
    intro: tt('<p>El salario mínimo interprofesional (SMI) lo fija cada año el Gobierno por real decreto. Esta tabla recoge el importe mensual en 14 pagas, el anual y la subida porcentual de cada año. Entre 2018 y 2026 el SMI ha subido un 66 %.</p>', '<p>El salari mínim interprofessional (SMI) el fixa cada any el Govern per reial decret. Aquesta taula recull l’import mensual en 14 pagues, l’anual i la pujada percentual de cada any. Entre el 2018 i el 2026 el SMI ha pujat un 66 %.</p>'),
    fuentes: [{ nombre: tt('Reales decretos anuales del SMI (BOE)', 'Reials decrets anuals del SMI (BOE)'), url: 'https://www.boe.es/buscar/legislacion.php' }, { nombre: 'RD 126/2026 (BOE)', url: 'https://www.boe.es/eli/es/rd/2026/02/18/126/con' }],
    calc: 'salario-minimo',
    tablas: ({ lang }) => {
      const f = leerCSV('nomina', 'datos', 'smi-historico.csv');
      return [{
        cab: [tt('Año', 'Any'), tt('Mensual (14 pagas)', 'Mensual (14 pagues)'), tt('Anual', 'Anual'), tt('Subida', 'Pujada'), tt('Norma', 'Norma'), tt('Nota', 'Nota')],
        formatos: ['txt', 'eur', 'eur', 'pct', 'txt', 'txt'],
        filas: f.map((x, i) => [x.anio, +x.mensual14, r2(+x.mensual14 * 14), i ? r2((+x.mensual14 / +f[i - 1].mensual14 - 1) * 100) : '—', x.norma, lang === 'es' ? x.nota_es : x.nota_ca]).reverse(),
      }];
    },
  },
  {
    id: 'tabla-sueldo-neto',
    slug: tt('tabla-sueldo-neto', 'taula-sou-net'),
    titulo: tt('Tabla de sueldo neto por salario bruto 2027', 'Taula de sou net per salari brut 2027'),
    h1: tt('Tabla de sueldo bruto a neto', 'Taula de sou brut a net'),
    descripcion: tt('De 15.000 a 100.000 € brutos: neto mensual en 14 y 12 pagas, retención de IRPF y Seguridad Social, para un soltero sin hijos con contrato indefinido.', 'De 15.000 a 100.000 € bruts: net mensual en 14 i 12 pagues, retenció d’IRPF i Seguretat Social, per a un solter sense fills amb contracte indefinit.'),
    intro: tt('<p>Cada fila es el resultado de nuestra calculadora de sueldo neto para una persona soltera, sin hijos, menor de 65 años y con contrato indefinido. La retención es la misma en toda España; el IRPF real de cada comunidad se ajusta después en la renta.</p>', '<p>Cada fila és el resultat de la nostra calculadora de sou net per a una persona soltera, sense fills, menor de 65 anys i amb contracte indefinit. La retenció és la mateixa a tot Espanya; l’IRPF real de cada comunitat s’ajusta després a la renda.</p>'),
    fuentes: [RIRPF, BOE_COT],
    calc: 'sueldo-neto',
    tablas: ({ P }) => {
      const brutos = [15000, 16000, 17094, 18000, 20000, 22000, 24000, 25000, 26000, 28000, 30000, 32000, 35000, 38000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 80000, 90000, 100000];
      return [{
        cab: [tt('Bruto anual', 'Brut anual'), tt('Neto mes (14 pagas)', 'Net mes (14 pagues)'), tt('Neto mes (12 pagas)', 'Net mes (12 pagues)'), tt('Neto anual', 'Net anual'), tt('Retención IRPF', 'Retenció IRPF'), tt('Seg. Social al mes', 'Seg. Social al mes')],
        formatos: ['eur0', 'eur', 'eur', 'eur', 'pct', 'eur'],
        filas: brutos.map((b) => { const a = sueldoNeto({ brutoAnual: b, pagas: 14 }, P); const c = sueldoNeto({ brutoAnual: b, pagas: 12 }, P); return [b, a.netoOrdinaria, c.netoOrdinaria, a.netoAnual, a.ret.tipo, a.ss.trabajador.mensual]; }),
      }];
    },
  },
  {
    id: 'bases-cotizacion',
    slug: tt('bases-cotizacion', 'bases-cotitzacio'),
    titulo: tt('Bases de cotización 2026 y 2027 por grupo', 'Bases de cotització 2026 i 2027 per grup'),
    h1: tt('Bases mínimas y máxima de cotización por grupo', 'Bases mínimes i màxima de cotització per grup'),
    descripcion: tt('Bases mínimas por grupo de cotización (1 a 11) y base máxima del Régimen General, mensuales y diarias, de la orden de cotización vigente.', 'Bases mínimes per grup de cotització (1 a 11) i base màxima del Règim General, mensuals i diàries, de l’ordre de cotització vigent.'),
    intro: tt('<p>La base de cotización es el salario sobre el que se calcula lo que pagas a la Seguridad Social. Nunca puede ser menor que la mínima de tu grupo ni mayor que la máxima. El grupo depende de tu categoría profesional y aparece en la nómina.</p>', '<p>La base de cotització és el salari sobre el qual es calcula el que pagues a la Seguretat Social. Mai no pot ser inferior a la mínima del teu grup ni superior a la màxima. El grup depèn de la teva categoria professional i surt a la nòmina.</p>'),
    fuentes: [BOE_COT, LGSS],
    calc: 'nomina',
    tablas: ({ P }) => {
      const c = P.laboral.cotizacion;
      const filas: (string | number)[][] = Object.entries(c.bases_min_mensual_por_grupo).map(([g, v]) => [g, v as number, r2((v as number) / 30), c.base_max_mensual]);
      for (const [g, v] of Object.entries(c.bases_min_diaria_por_grupo)) filas.push([g, r2((v as number) * 30), v as number, c.base_max_mensual]);
      return [{ cab: [tt('Grupo', 'Grup'), tt('Base mínima mensual', 'Base mínima mensual'), tt('Base mínima diaria', 'Base mínima diària'), tt('Base máxima mensual', 'Base màxima mensual')], formatos: ['txt', 'eur', 'eur', 'eur'], filas }];
    },
  },
  {
    id: 'tipos-cotizacion',
    slug: tt('tipos-cotizacion', 'tipus-cotitzacio'),
    titulo: tt('Tipos de cotización a la Seguridad Social 2026–2027', 'Tipus de cotització a la Seguretat Social 2026–2027'),
    h1: tt('Tipos de cotización: trabajador y empresa', 'Tipus de cotització: treballador i empresa'),
    descripcion: tt('Porcentajes de cotización por contingencias comunes, desempleo, FOGASA, formación, MEI y solidaridad, a cargo del trabajador y de la empresa.', 'Percentatges de cotització per contingències comunes, atur, FOGASA, formació, MEI i solidaritat, a càrrec del treballador i de l’empresa.'),
    intro: tt('<p>Estos son los porcentajes que se aplican sobre la base de cotización cada mes. Los dos años se muestran juntos para ver qué cambia: en 2027 sube el MEI y la cotización de solidaridad, según el calendario fijado por ley.</p>', '<p>Aquests són els percentatges que s’apliquen sobre la base de cotització cada mes. Els dos anys es mostren junts per veure què canvia: el 2027 puja el MEI i la cotització de solidaritat, segons el calendari fixat per llei.</p>'),
    fuentes: [BOE_COT, LGSS],
    calc: 'coste-empresa',
    tablas: () => {
      const a = params('es', 2026).laboral.cotizacion, b = params('es', 2027).laboral.cotizacion;
      const fila = (es: string, ca: string, x: (c: any) => number) => [tt(es, ca), x(a), x(b)];
      return [
        { titulo: tt('Trabajador', 'Treballador'), cab: [tt('Concepto', 'Concepte'), '2026', tt('2027 (provisional)', '2027 (provisional)')], formatos: ['txt', 'pct', 'pct'], filas: [
          fila('Contingencias comunes', 'Contingències comunes', (c) => c.trabajador.cc),
          fila('Desempleo (indefinido)', 'Atur (indefinit)', (c) => c.trabajador.desempleo_indefinido),
          fila('Desempleo (temporal)', 'Atur (temporal)', (c) => c.trabajador.desempleo_temporal),
          fila('Formación profesional', 'Formació professional', (c) => c.trabajador.fp),
          fila('MEI', 'MEI', (c) => c.trabajador.mei),
          fila('Total contrato indefinido', 'Total contracte indefinit', (c) => r2(c.trabajador.cc + c.trabajador.desempleo_indefinido + c.trabajador.fp + c.trabajador.mei)),
        ] },
        { titulo: tt('Empresa', 'Empresa'), cab: [tt('Concepto', 'Concepte'), '2026', tt('2027 (provisional)', '2027 (provisional)')], formatos: ['txt', 'pct', 'pct'], filas: [
          fila('Contingencias comunes', 'Contingències comunes', (c) => c.empresa.cc),
          fila('Desempleo (indefinido)', 'Atur (indefinit)', (c) => c.empresa.desempleo_indefinido),
          fila('Desempleo (temporal)', 'Atur (temporal)', (c) => c.empresa.desempleo_temporal),
          fila('FOGASA', 'FOGASA', (c) => c.empresa.fogasa),
          fila('Formación profesional', 'Formació professional', (c) => c.empresa.fp),
          fila('MEI', 'MEI', (c) => c.empresa.mei),
        ] },
        { titulo: tt('Cotización de solidaridad (sobre el salario que supera la base máxima)', 'Cotització de solidaritat (sobre el salari que supera la base màxima)'), cab: [tt('Tramo del exceso', 'Tram de l’excés'), '2026', tt('2027 (provisional)', '2027 (provisional)')], formatos: ['txt', 'pct', 'pct'], filas: a.solidaridad.map((t: any, i: number) => [`${Math.round((t.desde_x_base_max - 1) * 100)} %–${t.hasta_x_base_max ? Math.round((t.hasta_x_base_max - 1) * 100) + ' %' : '∞'}`, t.tipo_total, b.solidaridad[i]?.tipo_total ?? t.tipo_total]) },
      ];
    },
  },
  {
    id: 'tramos-autonomos',
    slug: tt('tramos-cuota-autonomos', 'trams-quota-autonoms'),
    titulo: tt('Tramos de la cuota de autónomos 2026 y 2027', 'Trams de la quota d’autònoms 2026 i 2027'),
    h1: tt('Tabla de tramos de la cuota de autónomos', 'Taula de trams de la quota d’autònoms'),
    descripcion: tt('Los 15 tramos por rendimientos netos con base mínima, base máxima y cuota mínima y máxima al mes del sistema de cotización por ingresos reales.', 'Els 15 trams per rendiments nets amb base mínima, base màxima i quota mínima i màxima al mes del sistema de cotització per ingressos reals.'),
    intro: tt('<p>Desde 2023 los autónomos cotizan según sus rendimientos netos. Cada tramo fija una base mínima y una máxima; la cuota es la base elegida por el tipo de cotización. La tabla de 2027 no está aprobada y se mantiene la vigente con el nuevo MEI.</p>', '<p>Des del 2023 els autònoms cotitzen segons els seus rendiments nets. Cada tram fixa una base mínima i una màxima; la quota és la base triada pel tipus de cotització. La taula del 2027 no està aprovada i es manté la vigent amb el nou MEI.</p>'),
    fuentes: [LGSS, BOE_COT, { nombre: 'Seguridad Social: importass', url: 'https://importass.seg-social.es' }],
    calc: 'cuota-autonomos',
    tablas: ({ P }) => {
      const A = P.laboral.autonomos;
      return [{ cab: [tt('Tramo', 'Tram'), tt('Rendimiento neto mensual', 'Rendiment net mensual'), tt('Base mínima', 'Base mínima'), tt('Base máxima', 'Base màxima'), tt('Cuota mínima', 'Quota mínima'), tt('Cuota máxima', 'Quota màxima')], formatos: ['num0', 'txt', 'eur', 'eur', 'eur', 'eur'],
        filas: A.tramos.map((t: any, i: number) => [i + 1, t.rend_max == null ? `> ${t.rend_min.toFixed(2)} €` : `${t.rend_min.toFixed(2)} – ${t.rend_max.toFixed(2)} €`, t.base_min, t.base_max, r2(t.base_min * A.tipo_total_pct / 100), r2(t.base_max * A.tipo_total_pct / 100)]) }];
    },
  },
  {
    id: 'paro-cuantias',
    slug: tt('cuantias-paro', 'quanties-atur'),
    titulo: tt('Cuantías y duración del paro 2026: tabla oficial', 'Quanties i durada de l’atur 2026: taula oficial'),
    h1: tt('Paro: mínimos, máximos y duración', 'Atur: mínims, màxims i durada'),
    descripcion: tt('Prestación por desempleo: importe mínimo y máximo al mes según hijos, porcentajes sobre la base reguladora y días de paro según lo cotizado.', 'Prestació per atur: import mínim i màxim al mes segons fills, percentatges sobre la base reguladora i dies d’atur segons el que s’ha cotitzat.'),
    intro: tt('<p>El paro contributivo se calcula sobre la base reguladora (la media de tus bases de los últimos 180 días), pero siempre entre un mínimo y un máximo ligados al IPREM y al número de hijos. La duración depende de los días cotizados en los últimos 6 años.</p>', '<p>L’atur contributiu es calcula sobre la base reguladora (la mitjana de les teves bases dels últims 180 dies), però sempre entre un mínim i un màxim lligats a l’IPREM i al nombre de fills. La durada depèn dels dies cotitzats en els últims 6 anys.</p>'),
    fuentes: [LGSS, { nombre: 'SEPE', url: 'https://www.sepe.es' }],
    calc: 'paro',
    tablas: ({ P }) => {
      const D = P.laboral.desempleo;
      return [
        { titulo: tt('Importes mensuales', 'Imports mensuals'), cab: [tt('Situación', 'Situació'), tt('Mínimo', 'Mínim'), tt('Máximo', 'Màxim')], formatos: ['txt', 'eur', 'eur'], filas: [
          [tt('Sin hijos', 'Sense fills'), D.tope_min_sin_hijos, D.tope_max_sin_hijos], [tt('1 hijo', '1 fill'), D.tope_min_con_hijos, D.tope_max_1_hijo], [tt('2 o más hijos', '2 o més fills'), D.tope_min_con_hijos, D.tope_max_2_o_mas]] },
        { titulo: tt('Porcentaje sobre la base reguladora', 'Percentatge sobre la base reguladora'), cab: [tt('Días', 'Dies'), tt('Porcentaje', 'Percentatge')], formatos: ['txt', 'pct'], filas: D.porcentajes.map((p: any) => [`${p.desde_dia}–${p.hasta_dia ?? '…'}`, p.pct]) },
        { titulo: tt('Duración según días cotizados', 'Durada segons dies cotitzats'), cab: [tt('Días cotizados', 'Dies cotitzats'), tt('Días de paro', 'Dies d’atur')], formatos: ['txt', 'num0'], filas: D.duracion.map((d: any) => [`${d.cotizados_desde_dias}–${d.cotizados_hasta_dias ?? '…'}`, d.prestacion_dias]) },
      ];
    },
  },
  {
    id: 'iprem-historico',
    slug: tt('iprem-historico', 'iprem-historic'),
    titulo: tt('IPREM 2026 y evolución desde 2004', 'IPREM 2026 i evolució des del 2004'),
    h1: tt('IPREM: valor de cada año', 'IPREM: valor de cada any'),
    descripcion: tt('Indicador Público de Renta de Efectos Múltiples (IPREM) de cada año desde 2004: mensual, anual en 12 y 14 pagas. Sirve para ayudas, becas y el paro.', 'Indicador públic de renda d’efectes múltiples (IPREM) de cada any des del 2004: mensual, anual en 12 i 14 pagues. Serveix per a ajuts, beques i l’atur.'),
    intro: tt('<p>El IPREM sustituyó al SMI como referencia para ayudas públicas, becas, el subsidio por desempleo y los topes del paro. Se fija en los Presupuestos Generales del Estado; sin presupuestos nuevos, se mantiene el del año anterior.</p>', '<p>L’IPREM va substituir el SMI com a referència per a ajuts públics, beques, el subsidi per atur i els límits de l’atur. Es fixa als pressupostos generals de l’Estat; sense pressupostos nous, es manté el de l’any anterior.</p>'),
    fuentes: [{ nombre: tt('Leyes de Presupuestos Generales del Estado (BOE)', 'Lleis de pressupostos generals de l’Estat (BOE)'), url: 'https://www.boe.es/buscar/legislacion.php' }, { nombre: 'SEPE', url: 'https://www.sepe.es' }],
    calc: 'subsidio-desempleo',
    tablas: () => {
      const f = leerCSV('nomina', 'datos', 'iprem-historico.csv');
      return [{ cab: [tt('Año', 'Any'), tt('Mensual', 'Mensual'), tt('Anual (12 pagas)', 'Anual (12 pagues)'), tt('Anual (14 pagas)', 'Anual (14 pagues)'), tt('Diario', 'Diari')], formatos: ['txt', 'eur', 'eur', 'eur', 'eur'], filas: f.map((x) => [x.anio, +x.mensual, r2(+x.mensual * 12), r2(+x.mensual * 14), r2(+x.mensual / 30)]).reverse() }];
    },
  },
  {
    id: 'calendario-jubilacion',
    slug: tt('calendario-edad-jubilacion', 'calendari-edat-jubilacio'),
    titulo: tt('Edad de jubilación por año (2013–2027): tabla', 'Edat de jubilació per any (2013–2027): taula'),
    h1: tt('Calendario de la edad de jubilación', 'Calendari de l’edat de jubilació'),
    descripcion: tt('Edad ordinaria de jubilación de cada año y años cotizados necesarios para jubilarse a los 65, según el calendario transitorio de la Ley 27/2011.', 'Edat ordinària de jubilació de cada any i anys cotitzats necessaris per jubilar-se als 65, segons el calendari transitori de la Llei 27/2011.'),
    intro: tt('<p>La edad de jubilación ha subido poco a poco desde 2013 y llega a los 67 años en 2027. Quien ha cotizado lo suficiente puede seguir jubilándose a los 65. La edad aplicable es la del año en que se cumple.</p>', '<p>L’edat de jubilació ha pujat a poc a poc des del 2013 i arriba als 67 anys el 2027. Qui ha cotitzat prou pot continuar jubilant-se als 65. L’edat aplicable és la de l’any en què es compleix.</p>'),
    fuentes: [LGSS, { nombre: 'Seguridad Social: jubilación', url: 'https://www.seg-social.es' }],
    calc: 'jubilacion-edad',
    tablas: ({ lang }) => [{ cab: [tt('Año', 'Any'), tt('Cotización para jubilarse a los 65', 'Cotització per jubilar-se als 65'), tt('Edad si no se llega', 'Edat si no s’hi arriba')], formatos: ['txt', 'txt', 'txt'],
      filas: Array.from({ length: 15 }, (_, i) => 2013 + i).map((a) => { const r = requisitoAnio(a); return [String(a), meses(r.cotizacion, lang), meses(r.edad, lang)]; }) }],
  },
  {
    id: 'indemnizacion-por-anos',
    slug: tt('tabla-indemnizacion-despido', 'taula-indemnitzacio-acomiadament'),
    titulo: tt('Tabla de indemnización por despido según antigüedad', 'Taula d’indemnització per acomiadament segons antiguitat'),
    h1: tt('Indemnización por despido según años trabajados', 'Indemnització per acomiadament segons anys treballats'),
    descripcion: tt('Días de salario y euros de indemnización por despido improcedente, objetivo y fin de contrato de 1 a 30 años de antigüedad, con los topes legales.', 'Dies de salari i euros d’indemnització per acomiadament improcedent, objectiu i fi de contracte d’1 a 30 anys d’antiguitat, amb els límits legals.'),
    intro: tt('<p>Tabla calculada con un salario de referencia de 25.000 € brutos al año y contratos iniciados después del 12 de febrero de 2012. Para otro salario, multiplica los días por tu salario diario (bruto anual / 365) o usa la calculadora.</p>', '<p>Taula calculada amb un salari de referència de 25.000 € bruts l’any i contractes iniciats després del 12 de febrer de 2012. Per a un altre salari, multiplica els dies pel teu salari diari (brut anual / 365) o fes servir la calculadora.</p>'),
    fuentes: [ET],
    calc: 'indemnizacion-despido',
    tablas: ({ P }) => [{ cab: [tt('Años', 'Anys'), tt('Improcedente (días)', 'Improcedent (dies)'), tt('Improcedente (€)', 'Improcedent (€)'), tt('Objetivo (días)', 'Objectiu (dies)'), tt('Objetivo (€)', 'Objectiu (€)'), tt('Temporal (€)', 'Temporal (€)')], formatos: ['num0', 'num', 'eur0', 'num', 'eur0', 'eur0'],
      filas: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 22, 25, 30].map((a) => {
        const fin = `${2013 + a}-01-01`; const ini = '2013-01-02';
        const i = indemnizacion({ inicio: ini, fin, brutoAnual: 25000, tipo: 'improcedente' }, P.laboral);
        const o = indemnizacion({ inicio: ini, fin, brutoAnual: 25000, tipo: 'objetivo' }, P.laboral);
        const t = indemnizacion({ inicio: ini, fin, brutoAnual: 25000, tipo: 'temporal' }, P.laboral);
        return [a, i.dias, i.importe, o.dias, o.importe, t.importe];
      }) }],
  },
  {
    id: 'tabla-retencion-irpf',
    slug: tt('tabla-retencion-irpf', 'taula-retencio-irpf'),
    titulo: tt('Tabla de retenciones de IRPF 2027 por salario e hijos', 'Taula de retencions d’IRPF 2027 per salari i fills'),
    h1: tt('Tipo de retención de IRPF según salario e hijos', 'Tipus de retenció d’IRPF segons salari i fills'),
    descripcion: tt('Porcentaje de retención de IRPF en nómina para salarios de 16.000 a 100.000 € con 0, 1, 2 o 3 hijos, calculado con el algoritmo de la Agencia Tributaria.', 'Percentatge de retenció d’IRPF en nòmina per a salaris de 16.000 a 100.000 € amb 0, 1, 2 o 3 fills, calculat amb l’algoritme de l’Agència Tributària.'),
    intro: tt('<p>Retención para un contrato indefinido, situación familiar 3 (soltero o cónyuge con rentas), menor de 65 años y con los hijos computados al 50 %, como es habitual cuando trabajan los dos progenitores.</p>', '<p>Retenció per a un contracte indefinit, situació familiar 3 (solter o cònjuge amb rendes), menor de 65 anys i amb els fills computats al 50 %, com és habitual quan treballen tots dos progenitors.</p>'),
    fuentes: [RIRPF, { nombre: tt('AEAT: cálculo de retenciones', 'AEAT: càlcul de retencions'), url: 'https://sede.agenciatributaria.gob.es/Sede/irpf.html' }],
    calc: 'retencion-irpf',
    tablas: ({ P }) => [{ cab: [tt('Bruto anual', 'Brut anual'), tt('Sin hijos', 'Sense fills'), tt('1 hijo', '1 fill'), tt('2 hijos', '2 fills'), tt('3 hijos', '3 fills')], formatos: ['eur0', 'pct', 'pct', 'pct', 'pct'],
      filas: [16000, 18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000].map((b) => {
        const ss = cotizacion({ brutoAnual: b }, P.laboral).trabajador.anual;
        return [b, ...[0, 1, 2, 3].map((h) => retencion({ brutoAnual: b, ssAnual: ss, hijos: h }, P.fiscal).tipo)];
      }) }],
  },
];
