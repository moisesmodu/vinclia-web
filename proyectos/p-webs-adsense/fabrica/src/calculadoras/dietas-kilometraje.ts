import { def, tt } from '../lib/def';
import { dietas } from '../lib/calc/fiscal';

export default def({
  id: 'dietas-kilometraje',
  anual: true,
  campos: [
    { id: 'pernocta', tipo: 'numero', def: 2, min: 0, paso: 1, etiqueta: tt('Días con pernocta', 'Dies amb pernoctació') },
    { id: 'sinPernocta', tipo: 'numero', def: 5, min: 0, paso: 1, etiqueta: tt('Días sin pernocta (comida fuera)', 'Dies sense pernoctació (dinar fora)') },
    { id: 'extranjero', tipo: 'casilla', def: false, etiqueta: tt('Desplazamientos al extranjero', 'Desplaçaments a l’estranger') },
    { id: 'km', tipo: 'numero', def: 300, min: 0, paso: 1, etiqueta: tt('Kilómetros con vehículo propio', 'Quilòmetres amb vehicle propi') },
    { id: 'pagado', tipo: 'numero', def: 350, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Lo que te paga la empresa por dietas y kilometraje', 'El que et paga l’empresa per dietes i quilometratge') },
  ],
  calcular(v, { P }) {
    const r = dietas({ diasPernocta: v.pernocta, diasSinPernocta: v.sinPernocta, extranjero: v.extranjero, km: v.km, pagado: v.pagado }, P.fiscal);
    const D = P.fiscal.dietas_exentas;
    const z = v.extranjero ? D.extranjero : D.espana;
    return {
      destacado: { e: tt('Importe exento de IRPF', 'Import exempt d’IRPF'), v: r.exento },
      secundarios: [{ e: tt('Parte que tributa', 'Part que tributa'), v: r.tributa }, { e: tt('Máximo exento con estos días y km', 'Màxim exempt amb aquests dies i km'), v: r.maximo }],
      filas: [
        { e: tt(`Manutención con pernocta (${z.pernocta} €/día)`, `Manutenció amb pernoctació (${z.pernocta} €/dia)`), v: Math.round(v.pernocta * z.pernocta * 100) / 100 },
        { e: tt(`Manutención sin pernocta (${z.sin_pernocta} €/día)`, `Manutenció sense pernoctació (${z.sin_pernocta} €/dia)`), v: Math.round(v.sinPernocta * z.sin_pernocta * 100) / 100 },
        { e: tt(`Kilometraje (${D.km_euros} €/km)`, `Quilometratge (${D.km_euros} €/km)`), v: r.exentoKm },
        { e: tt('Máximo exento', 'Màxim exempt'), v: r.maximo, fuerte: true },
      ],
      avisos: [tt('El alojamiento, los peajes y el aparcamiento están exentos por su importe justificado. Las dietas en el municipio donde trabajas o vives no están exentas.', 'L’allotjament, els peatges i l’aparcament estan exempts pel seu import justificat. Les dietes al municipi on treballes o vius no estan exemptes.')],
    };
  },
});
