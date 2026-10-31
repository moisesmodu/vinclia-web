import { def, tt } from '../lib/def';
import { cuotaAutonomos } from '../lib/calc/laboral';
import { r2, sumarMeses, sumarDias } from '../lib/calc/base';

export default def({
  id: 'tarifa-plana-autonomos',
  anual: true,
  campos: [
    { id: 'alta', tipo: 'fecha', def: '2027-01-01', etiqueta: tt('Fecha de alta como autónomo', 'Data d’alta com a autònom') },
    { id: 'rend', tipo: 'numero', def: 18000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Rendimiento neto anual previsto', 'Rendiment net anual previst') },
    { id: 'prorroga', tipo: 'casilla', def: true, etiqueta: tt('Pediré la prórroga si gano menos del SMI', 'Demanaré la pròrroga si guanyo menys del SMI') },
  ],
  calcular(v, { P }) {
    const A = P.laboral.autonomos;
    const normal = cuotaAutonomos({ rendimientoAnual: v.rend }, P.laboral);
    const smi = P.laboral.smi.anual;
    const meses = A.tarifa_plana_meses + (v.prorroga && v.rend < smi ? 12 : 0);
    const ahorro = (normal.cuota - A.tarifa_plana_euros) * meses;
    return {
      destacado: { e: tt('Ahorro con la tarifa plana', 'Estalvi amb la tarifa plana'), v: r2(Math.max(0, ahorro)), nota: { es: `${meses} meses pagando ${A.tarifa_plana_euros} €`, ca: `${meses} mesos pagant ${A.tarifa_plana_euros} €` } },
      secundarios: [{ e: tt('Fin de la tarifa plana', 'Fi de la tarifa plana'), v: sumarDias(sumarMeses(v.alta, meses), -1), f: 'fecha' }, { e: tt('Cuota después', 'Quota després'), v: normal.cuota }],
      filas: [
        { e: tt('Cuota con tarifa plana', 'Quota amb tarifa plana'), v: A.tarifa_plana_euros },
        { e: tt('Cuota normal por tu tramo', 'Quota normal pel teu tram'), v: normal.cuota },
        { e: tt('SMI anual (límite para la prórroga)', 'SMI anual (límit per a la pròrroga)'), v: smi },
      ],
      avisos: [tt('Requisito: no haber estado de alta como autónomo en los 2 años anteriores (3 si ya disfrutaste de la tarifa). La prórroga se pide expresamente antes de que acaben los primeros 12 meses.', 'Requisit: no haver estat d’alta com a autònom els 2 anys anteriors (3 si ja vas gaudir de la tarifa). La pròrroga es demana expressament abans que acabin els primers 12 mesos.')],
    };
  },
});
