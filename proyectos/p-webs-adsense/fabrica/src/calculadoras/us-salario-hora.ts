import { def } from '../lib/def';
import { es, campoEstado, nombreEstado } from '../lib/camposUS';
import { horaAAnual, anualAHora, chequePago } from '../lib/calc/us';

export default def({
  id: 'us-salario-hora',
  anual: true,
  campos: [
    { id: 'modo', tipo: 'select', def: 'hora', etiqueta: es('Quiero convertir…'), opciones: [{ v: 'hora', t: es('De pago por hora a salario anual') }, { v: 'anual', t: es('De salario anual a pago por hora') }] },
    { id: 'tarifa', tipo: 'numero', def: 20, min: 0, paso: 0.25, sufijo: '$/h', etiqueta: es('Pago por hora'), si: (v) => v.modo === 'hora' },
    { id: 'anual', tipo: 'numero', def: 50000, min: 0, paso: 500, sufijo: '$', etiqueta: es('Salario anual'), si: (v) => v.modo === 'anual' },
    { id: 'horas', tipo: 'numero', def: 40, min: 1, max: 80, paso: 1, sufijo: 'h', etiqueta: es('Horas por semana') },
    { id: 'semanas', tipo: 'numero', def: 52, min: 1, max: 52, paso: 1, etiqueta: es('Semanas pagadas al año'), ayuda: es('52 si te pagan las vacaciones y los feriados; menos si son semanas sin sueldo.') },
    campoEstado('TX'),
  ],
  calcular(v, { P }) {
    const tarifa = v.modo === 'hora' ? v.tarifa : anualAHora(v.anual, v.horas, v.semanas);
    const r = horaAAnual(tarifa, v.horas, v.semanas);
    const neto = chequePago({ brutoAnual: r.anual, periodos: 52, ec: 'single', estado: v.estado }, P);
    const tabla = [15, 18, 20, 22, 25, 30, 35, 40].map((t) => { const a = horaAAnual(t, v.horas, v.semanas); return [t, a.anual, a.mensual, a.semanal]; });
    return {
      destacado: v.modo === 'hora'
        ? { e: es('Salario anual bruto'), v: r.anual, f: 'eur0', nota: es(`${v.horas} horas × ${v.semanas} semanas = ${v.horas * v.semanas} horas al año`) }
        : { e: es('Pago por hora equivalente'), v: tarifa, nota: es(`Con ${v.horas} horas a la semana y ${v.semanas} semanas pagadas`) },
      secundarios: [
        { e: es('Al mes'), v: r.mensual },
        { e: es('Cada dos semanas'), v: r.quincenal },
        { e: es('A la semana'), v: r.semanal },
      ],
      filas: [
        { e: es('Por hora'), v: tarifa },
        { e: es('Por día (5 días)'), v: r.diario },
        { e: es('Por semana'), v: r.semanal },
        { e: es('Cada dos semanas'), v: r.quincenal },
        { e: es('Por mes'), v: r.mensual },
        { e: es('Por año'), v: r.anual, fuerte: true },
        { e: es(`Neto aproximado al año en ${nombreEstado(v.estado)} (soltero/a)`), v: neto.netoAnual, sub: true },
        { e: es('Neto aproximado por semana'), v: neto.porPeriodo.neto, sub: true },
      ],
      tablas: [{ titulo: es(`Tabla rápida con ${v.horas} h/semana y ${v.semanas} semanas`), cab: [es('Por hora'), es('Al año'), es('Al mes'), es('A la semana')], formatos: ['eur', 'eur0', 'eur0', 'eur0'], filas: tabla }],
      avisos: [es('Las horas extra no están incluidas: si pasas de 40 horas a la semana, cada hora extra se paga al menos a tiempo y medio. Usa la calculadora de overtime.')],
    };
  },
});
