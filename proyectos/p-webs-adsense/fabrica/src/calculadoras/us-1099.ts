import { def } from '../lib/def';
import { es, campoEstadoCivil, usd } from '../lib/camposUS';
import { impuestoFederal, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-1099',
  anual: true,
  campos: [
    { id: 'ingresos', tipo: 'numero', def: 50000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Ingresos 1099 del año'), ayuda: es('Todo lo que te pagaron como contratista independiente (1099-NEC, 1099-K, efectivo).') },
    { id: 'gastos', tipo: 'numero', def: 5000, min: 0, paso: 100, sufijo: '$', etiqueta: es('Gastos del negocio'), ayuda: es('Millas, herramientas, teléfono, seguro, comisiones de la plataforma… (Schedule C).') },
    { id: 'w2', tipo: 'numero', def: 0, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario W-2 de otro trabajo (si tienes)') },
    campoEstadoCivil(),
  ],
  calcular(v, { P }) {
    const gan = Math.max(0, v.ingresos - v.gastos);
    const r = impuestoFederal({ ec: estadoCivil(v.ec), salarios: v.w2, gananciaAutonomo: gan, anio: P.anio }, P);
    const sinW2 = impuestoFederal({ ec: estadoCivil(v.ec), salarios: v.w2, anio: P.anio }, P);
    const extraRenta = Math.max(0, r.impuestoRenta - sinW2.impuestoRenta);
    const total1099 = r.se.total + extraRenta;
    const trimestral = Math.round(total1099 / 4 * 100) / 100;
    const apartar = gan > 0 ? Math.round(total1099 / gan * 1000) / 10 : 0;
    return {
      destacado: { e: es('Impuestos federales por tus ingresos 1099'), v: total1099, nota: es(`Aparta el ${apartar}% de tu ganancia: unos ${usd(trimestral)} por trimestre en pagos estimados`) },
      secundarios: [
        { e: es('Self-employment tax'), v: r.se.total },
        { e: es('Impuesto sobre la renta extra'), v: extraRenta },
        { e: es('Pago estimado trimestral'), v: trimestral },
      ],
      filas: [
        { e: es('Ingresos 1099'), v: v.ingresos },
        { e: es('Gastos del negocio'), v: v.gastos, signo: '-' },
        { e: es('Ganancia neta (Schedule C)'), v: gan, fuerte: true },
        { e: es('Base del self-employment tax (92.35%)'), v: r.se.base, sub: true },
        { e: es('Seguro Social (12.4%)'), v: r.se.ss, sub: true },
        { e: es('Medicare (2.9%)'), v: r.se.medicare, sub: true },
        { e: es('Self-employment tax'), v: r.se.total, fuerte: true },
        { e: es('Mitad deducible del self-employment tax'), v: r.se.deducible, sub: true, signo: '-' },
        ...(r.qbi ? [{ e: es('Deducción por ingreso de negocio (QBI, 20%)'), v: r.qbi, sub: true, signo: '-' as const }] : []),
        { e: es('Renta imponible total'), v: r.imponible },
        { e: es('Impuesto sobre la renta por la ganancia 1099'), v: extraRenta },
        { e: es('Total de impuestos federales por el 1099'), v: total1099, fuerte: true },
      ],
      avisos: [
        es('Como contratista nadie te retiene impuestos: el IRS espera pagos estimados (Form 1040-ES) en abril, junio, septiembre y enero si vas a deber $1,000 o más.'),
        es('No incluye el impuesto estatal ni créditos. La deducción QBI solo se calcula por debajo del umbral de ingresos; por encima hay límites que dependen del tipo de negocio.'),
      ],
    };
  },
});
