import { def, tt } from '../lib/def';
import { modelo130 } from '../lib/calc/fiscal';

export default def({
  id: 'modelo-130',
  anual: true,
  campos: [
    { id: 'trimestre', tipo: 'select', def: '3', etiqueta: tt('Trimestre', 'Trimestre'), opciones: [{ v: '1', t: '1T' }, { v: '2', t: '2T' }, { v: '3', t: '3T' }, { v: '4', t: '4T' }] },
    { id: 'ingresos', tipo: 'numero', def: 30000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Ingresos acumulados desde el 1 de enero', 'Ingressos acumulats des de l’1 de gener') },
    { id: 'gastos', tipo: 'numero', def: 9000, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Gastos deducibles acumulados (con la cuota de autónomos)', 'Despeses deduïbles acumulades (amb la quota d’autònoms)') },
    { id: 'retenciones', tipo: 'numero', def: 0, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Retenciones que te han practicado en el año', 'Retencions que t’han practicat en l’any') },
    { id: 'anteriores', tipo: 'numero', def: 2400, min: 0, paso: 1, sufijo: '€', etiqueta: tt('Pagado en los modelos 130 anteriores del año', 'Pagat als models 130 anteriors de l’any') },
    { id: 'rendAnterior', tipo: 'numero', def: 20000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Rendimientos netos del año pasado', 'Rendiments nets de l’any passat') },
  ],
  calcular(v, { P }) {
    const r = modelo130({ ingresosAcum: v.ingresos, gastosAcum: v.gastos, retencionesAcum: v.retenciones, pagosAnteriores: v.anteriores, trimestre: Number(v.trimestre), rendAnterior: v.rendAnterior }, P.fiscal);
    const plazo = P.fiscal.modelos['130'].plazos[Number(v.trimestre) - 1];
    return {
      destacado: { e: tt('A ingresar este trimestre', 'A ingressar aquest trimestre'), v: r.aIngresar, nota: { es: `Plazo: ${plazo}`, ca: `Termini: ${plazo}` } },
      filas: [
        { e: tt('Rendimiento neto acumulado', 'Rendiment net acumulat'), v: r.rend },
        { e: tt(`Pago fraccionado (${r.pct} %)`, `Pagament fraccionat (${r.pct} %)`), v: r.pago },
        { e: tt('Retenciones soportadas', 'Retencions suportades'), v: v.retenciones, signo: '-' },
        { e: tt('Pagos anteriores', 'Pagaments anteriors'), v: v.anteriores, signo: '-' },
        ...(r.minoracion ? [{ e: tt('Minoración por rendimientos bajos', 'Minoració per rendiments baixos'), v: r.minoracion, signo: '-' as const }] : []),
        { e: tt('Resultado', 'Resultat'), v: r.resultado, fuerte: true },
      ],
      avisos: [tt('No estás obligado al 130 si el año anterior al menos el 70 % de tus ingresos profesionales llevaron retención. Un resultado negativo no se devuelve: se descuenta en los trimestres siguientes.', 'No estàs obligat al 130 si l’any anterior almenys el 70 % dels teus ingressos professionals van portar retenció. Un resultat negatiu no es retorna: es descompta als trimestres següents.')],
    };
  },
});
