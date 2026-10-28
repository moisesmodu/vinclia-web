import { def } from '../lib/def';
import { es, num, usd } from '../lib/camposUS';
import { cambioDivisa } from '../lib/calc/us';

export default def({
  id: 'us-tipo-cambio',
  campos: [
    { id: 'monto', tipo: 'numero', def: 100, min: 0, paso: 1, sufijo: '$', etiqueta: es('Dólares a cambiar') },
    { id: 'tasa', tipo: 'numero', def: 18.5, min: 0, paso: 0.0001, etiqueta: es('Tipo de cambio (unidades de la otra moneda por 1 dólar)'), ayuda: es('Ejemplo con pesos mexicanos. Escribe el tipo del día: pesos, quetzales, lempiras, pesos colombianos, soles…') },
    { id: 'margen', tipo: 'numero', def: 0, min: 0, max: 20, paso: 0.1, sufijo: '%', etiqueta: es('Margen que aplica la casa de cambio'), ayuda: es('Diferencia entre el tipo de referencia y el que te dan. En aeropuertos suele pasar del 5%.') },
    { id: 'comision', tipo: 'numero', def: 0, min: 0, paso: 0.5, sufijo: '$', etiqueta: es('Comisión fija') },
  ],
  calcular(v) {
    const r = cambioDivisa({ monto: v.monto, tasa: v.tasa, margenPct: v.margen, comision: v.comision });
    const tabla = [10, 50, 100, 200, 500, 1000].map((m) => { const x = cambioDivisa({ monto: m, tasa: v.tasa, margenPct: v.margen, comision: v.comision }); return [m, x.recibe, x.sinCostes]; });
    return {
      destacado: { e: es('Recibes'), v: r.recibe, f: 'num', nota: es(`Tipo efectivo: ${num(r.tasaEfectiva, 4)} por dólar`) },
      secundarios: [
        { e: es('Sin margen ni comisión'), v: r.sinCostes, f: 'num' },
        { e: es('Pierdes por costes'), v: r.perdidaUsd },
        { e: es('1 unidad de la otra moneda en dólares'), v: r.inversa, f: 'num' },
      ],
      filas: [
        { e: es('Dólares'), v: v.monto },
        { e: es('Comisión'), v: v.comision, signo: '-' },
        { e: es('Tipo de cambio de referencia'), v: v.tasa, f: 'num' },
        { e: es('Tipo de cambio aplicado'), v: r.tasaEfectiva, f: 'num' },
        { e: es('Recibes'), v: r.recibe, f: 'num', fuerte: true },
        { e: es(`Coste total en dólares (${v.monto > 0 ? Math.round(r.perdidaUsd / v.monto * 1000) / 10 : 0}%)`), v: r.perdidaUsd, sub: true },
      ],
      tablas: [{ titulo: es('Tabla de conversión'), cab: [es('Dólares'), es('Recibes'), es('Al tipo de referencia')], formatos: ['eur0', 'num', 'num'], filas: tabla }],
      avisos: [es(`El tipo de cambio cambia cada minuto: esta calculadora no lo descarga, usa el que escribas. ${v.comision > 0 ? `Una comisión fija de ${usd(v.comision, 2)} pesa más cuanto menos cambias.` : ''}`.trim())],
    };
  },
});
