import { def } from '../lib/def';
import { es, campoEstado, campoEstadoCivil, campoFrecuencia, campoHijos, campoOtrosDep, nombreEstado, usd, FRECUENCIAS } from '../lib/camposUS';
import { chequePago, estadoCivil } from '../lib/calc/us';

export default def({
  id: 'us-cheque-pago',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 50000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario bruto anual'), ayuda: es('Antes de impuestos. Si cobras por hora, multiplica la tarifa por las horas al año (40 h × 52 semanas = 2.080 h).') },
    campoFrecuencia, campoEstado('TX'), campoEstadoCivil(true),
    campoHijos, campoOtrosDep,
    { id: 'p401k', tipo: 'numero', def: 0, min: 0, max: 100, paso: 1, sufijo: '%', etiqueta: es('Aporte al 401(k) tradicional'), ayuda: es('Porcentaje del salario que va al plan de jubilación antes de impuestos.') },
    { id: 'salud', tipo: 'numero', def: 0, min: 0, paso: 5, sufijo: '$', etiqueta: es('Seguro médico por cheque (antes de impuestos)') },
    { id: 'paso2', tipo: 'casilla', def: false, etiqueta: es('Marqué la casilla del paso 2 del W-4 (dos trabajos o pareja que trabaja)') },
  ],
  calcular(v, { P }) {
    const per = P.laboral.periodos_pago[v.frecuencia] ?? 26;
    const r = chequePago({ brutoAnual: v.bruto, periodos: per, ec: estadoCivil(v.ec), estado: v.estado, paso2: !!v.paso2, hijos: v.ninos, otrosDependientes: v.otros, pct401k: v.p401k, seguroMedico: v.salud }, P);
    const p = r.porPeriodo;
    const avisos = [];
    if (r.estatal.ninguno) avisos.push(es(`${nombreEstado(v.estado)} no cobra impuesto estatal sobre el salario: solo te descuentan el impuesto federal, el Seguro Social y Medicare.`));
    if (v.estado === 'NY') avisos.push(es('Si vives en la ciudad de Nueva York o en Yonkers pagas además un impuesto local que no está incluido.'));
    if (v.estado === 'PA') avisos.push(es('No incluye el impuesto local sobre el salario (EIT) de tu municipio, que suele rondar el 1% (3.74% en Filadelfia para residentes).'));
    if (P.laboral.contribuciones_estatales?.[v.estado]) avisos.push(es(`Incluye ${r.contribuciones.map((c) => c.nombre).join(' y ')}.`));
    if (r.fica.adicional > 0) avisos.push(es('Tu salario pasa de $200,000: el empleador retiene un 0.9% adicional de Medicare sobre el exceso.'));
    avisos.push(es('La retención estatal se estima repartiendo el impuesto anual del estado entre los cheques; la tabla de tu empleador puede variar unos dólares.'));
    return {
      destacado: { e: es('Cheque neto (take-home pay)'), v: p.neto, nota: es(`${FRECUENCIAS[v.frecuencia] ?? ''}: ${usd(r.netoAnual)} netos al año`) },
      secundarios: [
        { e: es('Bruto por cheque'), v: r.brutoPeriodo },
        { e: es('Impuestos totales'), v: r.tipoTotal, f: 'pct' },
        { e: es('Tipo federal marginal'), v: r.federal.marginal, f: 'pct' },
      ],
      filas: [
        { e: es('Salario bruto del cheque'), v: r.brutoPeriodo },
        { e: es('Impuesto federal sobre la renta (federal withholding)'), v: p.federal, signo: '-' },
        { e: es('Seguro Social (6.2%)'), v: p.ss, signo: '-' },
        { e: es('Medicare'), v: p.medicare, signo: '-' },
        { e: es(`Impuesto estatal de ${nombreEstado(v.estado)}`), v: p.estatal, signo: '-' },
        ...(r.contribTotal ? [{ e: es('Cotizaciones estatales (SDI, WA Cares)'), v: p.contrib, signo: '-' as const }] : []),
        ...(r.aporte401k ? [{ e: es('401(k)'), v: p.k401, signo: '-' as const }] : []),
        ...(r.salud ? [{ e: es('Seguro médico'), v: p.salud, signo: '-' as const }] : []),
        { e: es('Cheque neto'), v: p.neto, fuerte: true },
        { e: es('Bruto anual'), v: r.brutoAnual, sub: true },
        { e: es('Impuesto federal retenido al año'), v: r.federal.anual, sub: true, signo: '-' },
        { e: es('FICA al año (Seguro Social + Medicare)'), v: r.fica.total, sub: true, signo: '-' },
        { e: es('Impuesto estatal al año'), v: r.estatal.impuesto, sub: true, signo: '-' },
        { e: es('Neto anual'), v: r.netoAnual, sub: true, fuerte: true },
      ],
      avisos,
    };
  },
});
