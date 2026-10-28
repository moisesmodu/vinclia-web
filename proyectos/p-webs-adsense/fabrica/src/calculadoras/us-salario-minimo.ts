import { def } from '../lib/def';
import { es, campoEstado, nombreEstado, ESTADOS_MINIMO, usd } from '../lib/camposUS';
import { horaAAnual } from '../lib/calc/us';

export default def({
  id: 'us-salario-minimo',
  anual: true,
  campos: [
    { ...campoEstado('CA', ESTADOS_MINIMO), ayuda: es('Algunas ciudades y condados tienen un mínimo más alto que el del estado.') },
    { id: 'horas', tipo: 'numero', def: 40, min: 1, max: 80, paso: 1, sufijo: 'h', etiqueta: es('Horas por semana') },
    { id: 'nyc', tipo: 'casilla', def: false, etiqueta: es('Trabajo en la ciudad de Nueva York, Long Island o Westchester'), si: (v) => v.estado === 'NY' },
  ],
  calcular(v, { P }) {
    const M = P.laboral.salario_minimo;
    const s = M.estados[v.estado];
    const hora = v.estado === 'NY' && v.nyc && s.hora_nyc ? s.hora_nyc : Math.max(s.hora, M.federal);
    const r = horaAAnual(hora, v.horas);
    const tabla = ESTADOS_MINIMO.map((e) => { const x = M.estados[e]; const h = Math.max(x.hora, M.federal); return [nombreEstado(e), h, Math.round(h * 2080), x.desde]; }).sort((a, b) => (b[1] as number) - (a[1] as number));
    const avisos = [];
    if (s.hora <= M.federal) avisos.push(es(`${nombreEstado(v.estado)} usa el salario mínimo federal de ${usd(M.federal, 2)} la hora, sin cambios desde 2009.`));
    if (s.anterior) avisos.push(es(`Subió desde ${usd(s.anterior, 2)} el ${s.desde.split('-').reverse().join('/')}.`));
    avisos.push(es('Si te pagan menos del mínimo, puedes reclamar al departamento de trabajo de tu estado o a la División de Horas y Salarios del Departamento de Trabajo (DOL), aunque no tengas papeles.'));
    return {
      destacado: { e: es(`Salario mínimo en ${nombreEstado(v.estado)} (${P.anio})`), v: hora, nota: es(`por hora, vigente desde el ${s.desde.split('-').reverse().join('/')}`) },
      secundarios: [
        { e: es('A la semana'), v: r.semanal },
        { e: es('Al mes'), v: r.mensual },
        { e: es('Al año (bruto)'), v: r.anual },
      ],
      filas: [
        { e: es('Mínimo federal'), v: M.federal },
        { e: es(`Mínimo de ${nombreEstado(v.estado)}`), v: hora, fuerte: true },
        { e: es(`Pago semanal con ${v.horas} h`), v: r.semanal },
        { e: es('Pago anual (52 semanas)'), v: r.anual },
      ],
      tablas: [{ titulo: es('Salario mínimo por estado (de mayor a menor)'), cab: [es('Estado'), es('Por hora'), es('Al año a tiempo completo'), es('Desde')], formatos: ['txt', 'eur', 'eur0', 'fecha'], filas: tabla }],
      avisos,
    };
  },
});
