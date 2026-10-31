import { def } from '../lib/def';
import { es, usd } from '../lib/camposUS';
import { ahorro401k, impuestoEscala, deduccionEstandar } from '../lib/calc/us';

export default def({
  id: 'us-401k',
  anual: true,
  campos: [
    { id: 'salario', tipo: 'numero', def: 55000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario bruto anual') },
    { id: 'pct', tipo: 'numero', def: 6, min: 0, max: 100, paso: 1, sufijo: '%', etiqueta: es('Tu aporte (% del salario)') },
    { id: 'match', tipo: 'numero', def: 50, min: 0, max: 200, paso: 5, sufijo: '%', etiqueta: es('Aportación de la empresa (match)'), ayuda: es('Ejemplo: «50% hasta el 6%» significa que la empresa pone $0.50 por cada dólar tuyo hasta el 6% del salario.') },
    { id: 'tope', tipo: 'numero', def: 6, min: 0, max: 100, paso: 1, sufijo: '%', etiqueta: es('Hasta qué % del salario iguala la empresa') },
    { id: 'edad', tipo: 'numero', def: 35, min: 18, max: 75, paso: 1, etiqueta: es('Tu edad') },
    { id: 'retiro', tipo: 'numero', def: 65, min: 19, max: 80, paso: 1, etiqueta: es('Edad de jubilación') },
    { id: 'saldo', tipo: 'numero', def: 0, min: 0, paso: 500, sufijo: '$', etiqueta: es('Saldo actual del 401(k)') },
    { id: 'rent', tipo: 'numero', def: 6, min: 0, max: 15, paso: 0.5, sufijo: '%', etiqueta: es('Rentabilidad anual esperada'), ayuda: es('No está garantizada. Un 5–7% es una hipótesis habitual para una cartera diversificada a largo plazo, antes de inflación.') },
  ],
  calcular(v, { P }) {
    const anios = Math.max(1, Math.round(v.retiro - v.edad));
    const imp = Math.max(0, v.salario - deduccionEstandar('single', P.fiscal));
    const marginal = impuestoEscala(imp, 'single', P.fiscal).marginal;
    const r = ahorro401k({ salario: v.salario, pct: v.pct, matchPct: v.match, matchTope: v.tope, saldo: v.saldo, rentabilidad: v.rent, anios, edad: v.edad, marginal }, P.fiscal);
    const J = P.fiscal.jubilacion;
    const hitos = r.tabla.filter((x, i) => (i + 1) % 5 === 0 || i === r.tabla.length - 1).map((x) => [x.edad + 1, x.aporte, x.empresa, x.saldo]);
    const avisos = [es(`Límite de aporte del empleado en ${P.anio}: ${usd(J.aporte_401k)}; ${usd(J.recuperacion_50)} más desde los 50 años y ${usd(J.recuperacion_60_63)} más entre los 60 y los 63.`)];
    if (v.pct < v.tope && v.match > 0) avisos.push(es(`Aportas menos de lo que iguala tu empresa: subiendo al ${v.tope}% recibirías ${usd(v.salario * (v.tope - v.pct) / 100 * v.match / 100)} más al año de regalo.`));
    avisos.push(es('Valores nominales, sin descontar inflación ni comisiones del plan. Al retirar el dinero pagarás impuesto sobre la renta; antes de los 59 años y medio suele haber un 10% de penalidad.'));
    return {
      destacado: { e: es(`Saldo estimado a los ${v.retiro} años`), v: r.saldo, f: 'eur0', nota: es(`Después de ${anios} años aportando`) },
      secundarios: [
        { e: es('Aportado por ti'), v: r.aportado, f: 'eur0' },
        { e: es('Aportado por la empresa'), v: r.empresa, f: 'eur0' },
        { e: es('Rendimientos'), v: r.rendimiento, f: 'eur0' },
      ],
      filas: [
        { e: es('Tu aporte este año'), v: r.aporteAnio1 },
        { e: es('Aporte de la empresa este año'), v: r.tabla[0]?.empresa ?? 0 },
        { e: es(`Impuesto federal que te ahorras este año (tramo del ${marginal}%)`), v: r.ahorroFiscalAnio1 },
        { e: es('Coste real para tu bolsillo este año'), v: Math.round((r.aporteAnio1 - r.ahorroFiscalAnio1) * 100) / 100, fuerte: true },
      ],
      tablas: [{ titulo: es('Evolución del saldo'), cab: [es('Edad'), es('Tu aporte anual'), es('Empresa'), es('Saldo')], formatos: ['num0', 'eur0', 'eur0', 'eur0'], filas: hitos }],
      avisos,
    };
  },
});
