import { def } from '../lib/def';
import { es, usd } from '../lib/camposUS';
import { fica, impuestoAutonomo } from '../lib/calc/us';

export default def({
  id: 'us-fica',
  anual: true,
  campos: [
    { id: 'salario', tipo: 'numero', def: 50000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario anual (W-2) o ganancia neta (1099)') },
    { id: 'tipo', tipo: 'select', def: 'w2', etiqueta: es('Tipo de trabajo'), opciones: [{ v: 'w2', t: es('Empleado con W-2') }, { v: '1099', t: es('Por cuenta propia o contratista 1099') }] },
  ],
  calcular(v, { P }) {
    const L = P.laboral, f = L.fica;
    if (v.tipo === '1099') {
      const r = impuestoAutonomo(v.salario, L);
      return {
        destacado: { e: es('Self-employment tax (Seguro Social y Medicare)'), v: r.total, nota: es(`Pagas las dos partes, la tuya y la del empleador: ${L.autonomos.seguro_social_pct + L.autonomos.medicare_pct}% sobre el ${L.autonomos.base_pct}% de tu ganancia`) },
        secundarios: [
          { e: es('Seguro Social'), v: r.ss },
          { e: es('Medicare'), v: r.medicare },
          { e: es('Mitad deducible'), v: r.deducible },
        ],
        filas: [
          { e: es('Ganancia neta'), v: v.salario },
          { e: es(`Base (${L.autonomos.base_pct}%)`), v: r.base },
          { e: es(`Seguro Social (${L.autonomos.seguro_social_pct}% hasta ${usd(f.tope_salarial)})`), v: r.ss },
          { e: es(`Medicare (${L.autonomos.medicare_pct}%)`), v: r.medicare },
          { e: es('Total'), v: r.total, fuerte: true },
        ],
        avisos: [es(`No se paga si la ganancia neta es menor de ${usd(L.autonomos.minimo_ganancia)}. Si ganas más de $200,000 ($250,000 en conjunta) se suma un 0.9% de Medicare adicional en la declaración.`)],
      };
    }
    const r = fica(v.salario, L);
    return {
      destacado: { e: es('FICA que te descuentan al año'), v: r.total, nota: es(`${f.seguro_social_pct}% de Seguro Social + ${f.medicare_pct}% de Medicare. Tu empleador paga otro tanto.`) },
      secundarios: [
        { e: es('Seguro Social'), v: r.ss },
        { e: es('Medicare'), v: r.medicare + r.adicional },
        { e: es('Al mes'), v: Math.round(r.total / 12 * 100) / 100 },
      ],
      filas: [
        { e: es('Salario sujeto a FICA'), v: v.salario },
        { e: es(`Seguro Social (${f.seguro_social_pct}% hasta ${usd(f.tope_salarial)})`), v: r.ss },
        { e: es(`Medicare (${f.medicare_pct}%, sin tope)`), v: r.medicare },
        ...(r.adicional ? [{ e: es(`Medicare adicional (${f.medicare_adicional_pct}% sobre lo que pasa de ${usd(f.umbral_retencion_adicional)})`), v: r.adicional }] : []),
        { e: es('Total FICA del empleado'), v: r.total, fuerte: true },
        { e: es('Lo que paga además tu empleador'), v: Math.round((r.ss + r.medicare) * 100) / 100, sub: true },
      ],
      avisos: [
        es(`Cuando tu salario del año llega a ${usd(f.tope_salarial)} dejan de descontarte Seguro Social hasta enero. Si tienes dos empleos y entre los dos pasas el tope, lo pagado de más se recupera en la declaración.`),
        es('Las aportaciones al 401(k) no reducen el FICA; el seguro médico de la empresa pagado antes de impuestos (sección 125), sí.'),
      ],
    };
  },
});
