import { def } from '../lib/def';
import { es, usd } from '../lib/camposUS';
import { prestamo, deduccionObbba, impuestoEscala, deduccionEstandar } from '../lib/calc/us';

export default def({
  id: 'us-prestamo-auto',
  anual: true,
  campos: [
    { id: 'precio', tipo: 'numero', def: 32000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Precio del auto (con impuestos y cargos)') },
    { id: 'enganche', tipo: 'numero', def: 4000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Enganche (pago inicial) y valor de tu auto usado') },
    { id: 'tasa', tipo: 'numero', def: 7.5, min: 0, max: 30, paso: 0.1, sufijo: '%', etiqueta: es('Tasa de interés anual (APR)') },
    { id: 'meses', tipo: 'select', def: '60', etiqueta: es('Plazo'), opciones: ['36', '48', '60', '72', '84'].map((m) => ({ v: m, t: es(`${m} meses (${Number(m) / 12} años)`) })) },
    { id: 'nuevo', tipo: 'casilla', def: false, etiqueta: es('Auto nuevo ensamblado en EE. UU., para uso personal (deducción de intereses de 2025 a 2028)') },
    { id: 'ingreso', tipo: 'numero', def: 60000, min: 0, paso: 1000, sufijo: '$', etiqueta: es('Tu ingreso anual (para la deducción)'), si: (v) => !!v.nuevo },
  ],
  calcular(v, { P }) {
    const principal = Math.max(0, v.precio - v.enganche);
    const n = Number(v.meses);
    const r = prestamo(principal, v.tasa, n);
    const plazos = [36, 48, 60, 72, 84].map((m) => { const x = prestamo(principal, v.tasa, m); return [m, x.cuota, x.intereses, x.total]; });
    const filas: any[] = [
      { e: es('Precio del auto'), v: v.precio },
      { e: es('Enganche'), v: v.enganche, signo: '-' },
      { e: es('Monto del préstamo'), v: principal, fuerte: true },
      { e: es('Intereses totales'), v: r.intereses },
      { e: es('Total que pagarás (préstamo + intereses)'), v: r.total },
      { e: es('Intereses del primer año'), v: r.interesPrimerAnio, sub: true },
    ];
    const avisos = [es('La tasa depende de tu historial de crédito. Compara la oferta del concesionario con la de tu banco o cooperativa (credit union) antes de firmar.')];
    if (v.nuevo) {
      const d = deduccionObbba('intereses_auto', r.interesPrimerAnio, v.ingreso, 'single', P.fiscal, P.anio);
      const marg = impuestoEscala(Math.max(0, v.ingreso - deduccionEstandar('single', P.fiscal)), 'single', P.fiscal).marginal;
      filas.push({ e: es('Intereses deducibles el primer año (soltero/a)'), v: d.deduccion, sub: true });
      filas.push({ e: es(`Ahorro de impuesto federal estimado (tramo del ${marg}%)`), v: Math.round(d.deduccion * marg) / 100, sub: true });
      if (!d.vigente) avisos.push(es(`La deducción por intereses de auto solo existe de 2025 a 2028.`));
      avisos.push(es(`La deducción llega hasta ${usd(P.fiscal.obbba.intereses_auto.max)} de intereses al año y se reduce con ingresos de más de ${usd(P.fiscal.obbba.intereses_auto.umbral.single)} (${usd(P.fiscal.obbba.intereses_auto.umbral.mfj)} en conjunta). El préstamo debe ser posterior al 31/12/2024 y con el auto como garantía.`));
    }
    return {
      destacado: { e: es('Pago mensual'), v: r.cuota, nota: es(`${n} pagos de ${usd(r.cuota, 2)} por un préstamo de ${usd(principal)}`) },
      secundarios: [
        { e: es('Intereses totales'), v: r.intereses },
        { e: es('Total pagado'), v: r.total },
        { e: es('Intereses el primer año'), v: r.interesPrimerAnio },
      ],
      filas,
      tablas: [
        { titulo: es('Comparación de plazos'), cab: [es('Meses'), es('Pago mensual'), es('Intereses'), es('Total')], formatos: ['num0', 'eur', 'eur0', 'eur0'], filas: plazos },
        { titulo: es('Por año'), cab: [es('Año'), es('Intereses'), es('Capital'), es('Saldo pendiente')], formatos: ['num0', 'eur', 'eur', 'eur'], filas: r.anual.map((x) => [x.anio, x.interes, x.capital, x.saldo]) },
      ],
      avisos,
    };
  },
});
