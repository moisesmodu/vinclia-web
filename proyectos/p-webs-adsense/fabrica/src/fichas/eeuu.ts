// Fichas de datos «citables» del sitio de EE. UU.: cifras oficiales de params/us/<año> y tablas calculadas con el motor.
import type { Ficha } from './tipos';
import { es, nombreEstado, ETIQUETA_EC, ESTADOS_FISCAL, ESTADOS_MINIMO } from '../lib/camposUS';
import { impuestoEstatal, chequePago, deduccionEstandar } from '../lib/calc/us';

const RP = { nombre: 'IRS Rev. Proc. 2025-32 (ajustes por inflación de 2026)', url: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' };
const SSA = { nombre: 'SSA: 2026 COLA Fact Sheet (tope del Seguro Social)', url: 'https://www.ssa.gov/cola/factsheets/2026.html' };
const DOL = { nombre: 'Departamento de Trabajo (DOL): State Minimum Wage Laws', url: 'https://www.dol.gov/agencies/whd/minimum-wage/state' };
const ECS = ['single', 'mfj', 'hoh', 'mfs'] as const;
const rango = (desde: number, hasta: number | null) => `${desde.toLocaleString('es-US')} – ${hasta == null ? 'en adelante' : hasta.toLocaleString('es-US')}`;

export const FICHAS: Ficha[] = [
  {
    id: 'tramos-federales',
    slug: es('tramos-impuestos-federales'),
    titulo: es('Tramos de impuestos federales 2026 por estado civil (tax brackets)'),
    h1: es('Tramos del impuesto federal sobre la renta 2026'),
    descripcion: es('Los siete tramos federales de 2026 (10% a 37%) para soltero, casados en conjunta o por separado y cabeza de familia, con la deducción estándar.'),
    intro: es('<p>El impuesto federal es progresivo: cada tramo de renta imponible paga su propio tipo. Estas son las cifras del año fiscal 2026 (la declaración que se presenta en 2027) publicadas por el IRS en la Rev. Proc. 2025-32, ya con los cambios de la ley One Big Beautiful Bill. La renta imponible es el ingreso menos la deducción estándar o las deducciones detalladas.</p>'),
    fuentes: [RP, { nombre: 'IRS: Federal income tax rates and brackets', url: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets' }],
    calc: 'us-impuesto-federal',
    tablas: ({ P }) => [
      ...ECS.map((ec) => {
        let d = 0;
        return { titulo: es(ETIQUETA_EC[ec]), cab: [es('Renta imponible ($)'), es('Tipo')], formatos: ['txt', 'pct'] as any, filas: P.fiscal.federal.tramos[ec].map((t: any) => { const f = [rango(d, t.hasta), t.tipo]; d = t.hasta ?? d; return f; }) };
      }),
      { titulo: es('Deducción estándar 2026'), cab: [es('Estado civil'), es('Deducción estándar')], formatos: ['txt', 'eur0'], filas: ECS.map((ec) => [es(ETIQUETA_EC[ec]), P.fiscal.federal.deduccion_estandar[ec]]) },
    ],
  },
  {
    id: 'cifras-2026',
    slug: es('cifras-impuestos-2026'),
    titulo: es('Cifras de impuestos 2026: deducción estándar, FICA, crédito por hijos, 401(k)'),
    h1: es('Cifras clave de impuestos y nómina de 2026'),
    descripcion: es('Deducción estándar, tope del Seguro Social, Medicare, crédito por hijos, límites del 401(k), deducciones por propinas y horas extra e impuesto a las remesas en 2026.'),
    intro: es('<p>Todas las cifras federales que usan las calculadoras de este sitio para 2026, en una tabla. Cada una viene de una publicación oficial del IRS o de la Administración del Seguro Social (SSA).</p>'),
    fuentes: [RP, SSA, { nombre: 'IRS Notice 2025-67 (límites de planes de jubilación 2026)', url: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' }, { nombre: 'IRS: One, Big, Beautiful Bill provisions', url: 'https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions' }],
    calc: 'us-reembolso',
    tablas: ({ P }) => {
      const F = P.fiscal, L = P.laboral;
      return [{
        cab: [es('Concepto'), es('2026')], formatos: ['txt', 'txt'],
        filas: [
          [es('Deducción estándar: soltero/a o casado/a por separado'), `$${F.federal.deduccion_estandar.single.toLocaleString('es-US')}`],
          [es('Deducción estándar: casados, conjunta'), `$${F.federal.deduccion_estandar.mfj.toLocaleString('es-US')}`],
          [es('Deducción estándar: cabeza de familia'), `$${F.federal.deduccion_estandar.hoh.toLocaleString('es-US')}`],
          [es('Seguro Social: tipo del empleado'), `${L.fica.seguro_social_pct}%`],
          [es('Seguro Social: salario máximo sujeto'), `$${L.fica.tope_salarial.toLocaleString('es-US')}`],
          [es('Medicare: tipo del empleado'), `${L.fica.medicare_pct}% (sin tope)`],
          [es('Medicare adicional'), `${L.fica.medicare_adicional_pct}% desde $${L.fica.umbrales_adicional.single.toLocaleString('es-US')} ($${L.fica.umbrales_adicional.mfj.toLocaleString('es-US')} en conjunta)`],
          [es('Self-employment tax'), `${L.autonomos.seguro_social_pct + L.autonomos.medicare_pct}% sobre el ${L.autonomos.base_pct}% de la ganancia`],
          [es('Crédito por hijo menor de 17'), `$${F.credito_hijos.por_hijo.toLocaleString('es-US')} (reembolsable hasta $${F.credito_hijos.reembolsable_max.toLocaleString('es-US')})`],
          [es('Crédito por otros dependientes'), `$${F.credito_hijos.otros_dependientes}`],
          [es('Reducción del crédito por hijos desde'), `$${F.credito_hijos.umbral_reduccion.single.toLocaleString('es-US')} ($${F.credito_hijos.umbral_reduccion.mfj.toLocaleString('es-US')} en conjunta)`],
          [es('Aporte máximo al 401(k)'), `$${F.jubilacion.aporte_401k.toLocaleString('es-US')} (+$${F.jubilacion.recuperacion_50.toLocaleString('es-US')} desde los 50; +$${F.jubilacion.recuperacion_60_63.toLocaleString('es-US')} de 60 a 63)`],
          [es('Aporte máximo a una IRA'), `$${F.jubilacion.ira.toLocaleString('es-US')} (+$${F.jubilacion.ira_recuperacion_50.toLocaleString('es-US')} desde los 50)`],
          [es('Deducción por propinas (2025–2028)'), `hasta $${F.obbba.propinas.max.toLocaleString('es-US')}`],
          [es('Deducción por horas extra (2025–2028)'), `hasta $${F.obbba.horas_extra.max.toLocaleString('es-US')} ($${F.obbba.horas_extra.max_mfj.toLocaleString('es-US')} en conjunta)`],
          [es('Deducción por intereses de auto nuevo (2025–2028)'), `hasta $${F.obbba.intereses_auto.max.toLocaleString('es-US')}`],
          [es('Impuesto a remesas pagadas en efectivo'), `${F.remesas.impuesto_pct}% desde el 1/1/2026`],
          [es('Salario mínimo federal'), `$${L.salario_minimo.federal.toFixed(2)} la hora`],
        ],
      }];
    },
  },
  {
    id: 'salario-minimo-estados',
    slug: es('salario-minimo-por-estado'),
    titulo: es('Salario mínimo por estado 2026: tabla con el mínimo de cada estado'),
    h1: es('Salario mínimo por estado en 2026'),
    descripcion: es('Salario mínimo por hora de California, Texas, Florida, Nueva York, Illinois y los estados con más población hispana, con el pago semanal y anual a tiempo completo.'),
    intro: es('<p>Cada estado puede fijar un salario mínimo más alto que el federal ($7.25 la hora desde 2009); si no lo hace, se aplica el federal. Muchas ciudades tienen además su propio mínimo. Esta tabla recoge el mínimo estatal general vigente en 2026, sin los mínimos para empleados con propinas ni los locales.</p>'),
    fuentes: [DOL, { nombre: 'California DIR: Minimum wage FAQ', url: 'https://www.dir.ca.gov/dlse/faq_minimumwage.htm' }, { nombre: 'New York State DOL: Minimum wage', url: 'https://dol.ny.gov/minimum-wage-0' }],
    calc: 'us-salario-minimo',
    tablas: ({ P }) => {
      const M = P.laboral.salario_minimo;
      return [{
        cab: [es('Estado'), es('Por hora'), es('Semana de 40 h'), es('Año (2.080 h)'), es('Vigente desde')], formatos: ['txt', 'eur', 'eur', 'eur0', 'fecha'],
        filas: [[es('Federal'), M.federal, M.federal * 40, M.federal * 2080, '2009-07-24'], ...ESTADOS_MINIMO.map((e) => { const h = Math.max(M.estados[e].hora, M.federal); return [nombreEstado(e) + (M.estados[e].hora_nyc ? ` (NYC, Long Island y Westchester: $${M.estados[e].hora_nyc.toFixed(2)})` : ''), h, h * 40, h * 2080, M.estados[e].desde]; }).sort((a, b) => (b[1] as number) - (a[1] as number))],
      }];
    },
  },
  {
    id: 'impuesto-estatal-estados',
    slug: es('impuesto-estatal-por-estado'),
    titulo: es('Impuesto estatal sobre la renta 2026 por estado: tipos y ejemplo'),
    h1: es('Impuesto estatal sobre la renta por estado (2026)'),
    descripcion: es('Qué estados no cobran impuesto sobre el salario, cuáles tienen un tipo único y cuáles son progresivos, con lo que paga un soltero con 40.000, 60.000 y $100,000.'),
    intro: es('<p>Además del impuesto federal, la mayoría de los estados cobra su propio impuesto sobre la renta. Texas, Florida, Nevada y Washington, entre otros, no gravan el salario. La tabla muestra el tipo de cada estado y el impuesto estatal anual de una persona soltera sin dependientes con tres niveles de ingreso, calculado con las deducciones y exenciones de cada estado.</p>'),
    fuentes: [{ nombre: 'California Franchise Tax Board: tax rates', url: 'https://www.ftb.ca.gov/file/personal/tax-calculator-tables-rates.asp' }, { nombre: 'NYS Department of Taxation and Finance: tax tables', url: 'https://www.tax.ny.gov/pit/file/tax_tables.htm' }, { nombre: 'Illinois Department of Revenue: income tax rates', url: 'https://tax.illinois.gov/research/taxrates/income.html' }, { nombre: 'New Jersey Division of Taxation: tax rate tables', url: 'https://www.nj.gov/treasury/taxation/taxtables.shtml' }],
    calc: 'us-impuesto-estatal',
    tablas: ({ P }) => {
      const F = P.fiscal;
      const tipo = (e: string) => { const d = F.estados[e]; if (d.tipo === 'ninguno') return 'Sin impuesto'; if (d.tipo === 'plano') return `Único ${d.pct}%`; const t = d.tramos.single; return `${t[0].tipo}% – ${t[t.length - 1].tipo}%`; };
      const imp = (e: string, b: number) => impuestoEstatal({ estado: e, ec: 'single', agi: b, salarioBruto: b, imponibleFederal: Math.max(0, b - deduccionEstandar('single', F)) }, F).impuesto;
      return [{
        cab: [es('Estado'), es('Tipo'), es('Con $40,000'), es('Con $60,000'), es('Con $100,000'), es('Neto quincenal con $60,000')], formatos: ['txt', 'txt', 'eur0', 'eur0', 'eur0', 'eur'],
        filas: ESTADOS_FISCAL.map((e) => [nombreEstado(e), tipo(e), imp(e, 40000), imp(e, 60000), imp(e, 100000), chequePago({ brutoAnual: 60000, periodos: 26, ec: 'single', estado: e }, P).porPeriodo.neto]),
      }];
    },
  },
];
