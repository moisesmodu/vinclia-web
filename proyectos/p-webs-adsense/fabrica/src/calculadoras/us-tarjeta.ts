import { def } from '../lib/def';
import { es, usd } from '../lib/camposUS';
import { tarjetaCredito, pagoParaLiquidar } from '../lib/calc/us';

export default def({
  id: 'us-tarjeta',
  campos: [
    { id: 'saldo', tipo: 'numero', def: 5000, min: 0, paso: 50, sufijo: '$', etiqueta: es('Saldo de la tarjeta') },
    { id: 'apr', tipo: 'numero', def: 22, min: 0, max: 60, paso: 0.1, sufijo: '%', etiqueta: es('Tasa de interés anual (APR)'), ayuda: es('Aparece en tu estado de cuenta como «Purchase APR».') },
    { id: 'pago', tipo: 'numero', def: 200, min: 0, paso: 10, sufijo: '$', etiqueta: es('Pago mensual que puedes hacer') },
    { id: 'meta', tipo: 'numero', def: 12, min: 1, max: 120, paso: 1, etiqueta: es('Quiero liquidarla en (meses)') },
  ],
  calcular(v) {
    const r = tarjetaCredito(v.saldo, v.apr, v.pago);
    const meta = pagoParaLiquidar(v.saldo, v.apr, v.meta);
    const totalMeta = Math.round((meta * v.meta - v.saldo) * 100) / 100;
    const escenarios = [0.02, 0.03, 0.05, 0.1].map((f) => {
      const p = Math.max(25, Math.round(v.saldo * f));
      const x = tarjetaCredito(v.saldo, v.apr, p);
      return [p, x.nuncaTermina ? 'Nunca' : `${x.meses}`, x.nuncaTermina ? '—' : x.intereses];
    });
    if (r.nuncaTermina) {
      return {
        destacado: { e: es('Con ese pago la deuda no baja nunca'), v: r.interesMes1, nota: es(`Solo los intereses del primer mes son ${usd(r.interesMes1, 2)}. Paga al menos ${usd(r.pagoMinimoUtil, 2)} para empezar a reducirla.`) },
        secundarios: [{ e: es(`Pago para liquidarla en ${v.meta} meses`), v: meta }],
        tablas: [{ titulo: es('Qué pasa con distintos pagos mensuales'), cab: [es('Pago mensual'), es('Meses'), es('Intereses totales')], formatos: ['eur0', 'txt', 'eur'], filas: escenarios }],
        avisos: [es('Paga siempre más que el pago mínimo: el mínimo está pensado para que la deuda dure años.')],
      };
    }
    const anios = Math.floor(r.meses / 12), meses = r.meses % 12;
    return {
      destacado: { e: es('Meses para pagar la tarjeta'), v: r.meses, f: 'num0', nota: es(`${anios ? `${anios} año${anios > 1 ? 's' : ''}${meses ? ` y ${meses} mes${meses > 1 ? 'es' : ''}` : ''}` : `${meses} meses`} pagando ${usd(v.pago)} al mes`) },
      secundarios: [
        { e: es('Intereses totales'), v: r.intereses },
        { e: es('Total pagado'), v: Math.round((v.saldo + r.intereses) * 100) / 100 },
        { e: es(`Pago para liquidarla en ${v.meta} meses`), v: meta },
      ],
      filas: [
        { e: es('Saldo inicial'), v: v.saldo },
        { e: es('Intereses del primer mes'), v: r.interesMes1 },
        { e: es('Intereses hasta liquidarla'), v: r.intereses, fuerte: true },
        { e: es(`Intereses si la liquidas en ${v.meta} meses`), v: totalMeta, sub: true },
      ],
      tablas: [{ titulo: es('Qué pasa con distintos pagos mensuales'), cab: [es('Pago mensual'), es('Meses'), es('Intereses totales')], formatos: ['eur0', 'txt', 'eur'], filas: escenarios }],
      avisos: [es('Supone que no haces compras nuevas con la tarjeta y que la tasa no cambia. Los bancos calculan el interés con el saldo diario promedio, así que puede variar unos dólares.')],
    };
  },
});
