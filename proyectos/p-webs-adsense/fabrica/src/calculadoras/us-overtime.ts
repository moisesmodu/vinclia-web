import { def } from '../lib/def';
import { es } from '../lib/camposUS';
import { horasExtra } from '../lib/calc/us';

export default def({
  id: 'us-overtime',
  anual: true,
  campos: [
    { id: 'tarifa', tipo: 'numero', def: 20, min: 0, paso: 0.25, sufijo: '$/h', etiqueta: es('Pago normal por hora') },
    { id: 'horas', tipo: 'numero', def: 50, min: 0, max: 120, paso: 0.5, sufijo: 'h', etiqueta: es('Horas trabajadas en la semana') },
    { id: 'ca', tipo: 'casilla', def: false, etiqueta: es('Trabajo en California (horas extra diarias)') },
    { id: 'dias', tipo: 'numero', def: 5, min: 1, max: 7, paso: 1, etiqueta: es('Días trabajados en la semana'), si: (v) => !!v.ca, ayuda: es('Se reparten las horas por igual entre los días.') },
  ],
  calcular(v, { P }) {
    const dias = Math.max(1, Math.min(7, Math.round(v.dias || 5)));
    const horasDia = v.ca ? Array.from({ length: dias }, () => v.horas / dias) : undefined;
    const r = horasExtra({ tarifa: v.tarifa, horasSemana: v.horas, estado: v.ca ? 'CA' : undefined, horasDia }, P.laboral);
    const sin = horasExtra({ tarifa: v.tarifa, horasSemana: Math.min(v.horas, 40) }, P.laboral);
    return {
      destacado: { e: es('Pago bruto de la semana'), v: r.total, nota: es(`${r.extra + r.doble} horas extra a ${r.tarifaExtra.toLocaleString('es-US', { style: 'currency', currency: 'USD' })} la hora${r.doble ? ' y parte al doble' : ''}`) },
      secundarios: [
        { e: es('Pago por horas extra'), v: r.pagoExtra + r.pagoDoble },
        { e: es('Tarifa de tiempo y medio'), v: r.tarifaExtra },
        { e: es('Prima deducible (ley de 2025)'), v: r.prima },
      ],
      filas: [
        { e: es(`Horas normales (${r.normales} h)`), v: r.pagoNormal },
        { e: es(`Horas extra a tiempo y medio (${Math.round(r.extra * 100) / 100} h)`), v: r.pagoExtra, signo: '+' },
        ...(r.doble ? [{ e: es(`Horas al doble (${Math.round(r.doble * 100) / 100} h)`), v: r.pagoDoble, signo: '+' as const }] : []),
        { e: es('Total de la semana'), v: r.total, fuerte: true },
        { e: es('Lo que ganas de más por las horas extra'), v: Math.round((r.total - sin.total) * 100) / 100, sub: true },
        { e: es('Equivalente anual si se repite cada semana'), v: Math.round(r.total * 52), sub: true },
      ],
      avisos: [
        es('Las horas extra federales (FLSA) se cuentan por semana: tiempo y medio a partir de la hora 41. Los empleados exentos (algunos con salario fijo) no las cobran.'),
        es('Con la ley de 2025, la «media» del tiempo y medio federal se puede deducir en la declaración de 2025 a 2028 (hasta $12,500). En el cheque se siguen reteniendo impuestos normalmente.'),
      ],
    };
  },
});
