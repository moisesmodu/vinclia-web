import { def, tt } from '../lib/def';
import { recargoExtemporaneo } from '../lib/calc/fiscal';

export default def({
  id: 'recargo-fuera-plazo',
  anual: true,
  campos: [
    { id: 'cuota', tipo: 'numero', def: 1200, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Cuota que no ingresaste a tiempo', 'Quota que no vas ingressar a temps') },
    { id: 'finPlazo', tipo: 'fecha', def: '2026-07-20', etiqueta: tt('Último día del plazo voluntario', 'Últim dia del termini voluntari') },
    { id: 'presentacion', tipo: 'fecha', def: '2026-11-05', etiqueta: tt('Fecha en que lo presentas', 'Data en què ho presentes') },
    { id: 'reduccion', tipo: 'casilla', def: true, etiqueta: tt('Pagaré en plazo (reducción del 25 %)', 'Pagaré en termini (reducció del 25 %)') },
  ],
  calcular(v, { P }) {
    const r = recargoExtemporaneo({ cuota: v.cuota, finPlazo: v.finPlazo, presentacion: v.presentacion, reduccion: v.reduccion }, P.fiscal);
    return {
      destacado: { e: tt('Recargo a pagar', 'Recàrrec a pagar'), v: r.recargo, nota: { es: `${r.pct} % por ${r.mesesRetraso} meses completos de retraso`, ca: `${r.pct} % per ${r.mesesRetraso} mesos complets de retard` } },
      secundarios: [{ e: tt('Total a pagar', 'Total a pagar'), v: r.total }, ...(r.intereses ? [{ e: tt('Intereses de demora', 'Interessos de demora'), v: r.intereses }] : [])],
      filas: [
        { e: tt('Cuota', 'Quota'), v: v.cuota },
        { e: tt(`Recargo (${r.pct} %)`, `Recàrrec (${r.pct} %)`), v: r.recargoBruto },
        ...(r.reduccion ? [{ e: tt('Reducción del 25 %', 'Reducció del 25 %'), v: r.reduccion, signo: '-' as const }] : []),
        ...(r.intereses ? [{ e: tt(`Intereses de demora (${r.diasIntereses} días)`, `Interessos de demora (${r.diasIntereses} dies)`), v: r.intereses }] : []),
        { e: tt('Total', 'Total'), v: r.total, fuerte: true },
      ],
      avisos: [tt('Se aplica solo si presentas por tu cuenta, sin requerimiento previo de Hacienda. Si te llega un requerimiento, ya es una sanción, mucho más cara.', 'S’aplica només si presentes pel teu compte, sense requeriment previ d’Hisenda. Si et arriba un requeriment, ja és una sanció, molt més cara.')],
    };
  },
});
