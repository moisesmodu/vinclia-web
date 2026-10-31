import { def, tt } from '../lib/def';
import { campoComunidad, campoPagas, campoContrato, camposFamilia, familia, nombreComunidad } from '../lib/campos';
import { sueldoNeto } from '../lib/calc/laboral';

export default def({
  id: 'sueldo-neto',
  anual: true,
  campos: [
    { id: 'bruto', tipo: 'numero', def: 30000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual', 'Salari brut anual') },
    campoPagas, campoComunidad(), campoContrato, ...camposFamilia,
  ],
  calcular(v, { P, lang }) {
    const r = sueldoNeto({ brutoAnual: v.bruto, pagas: Number(v.pagas) as 12 | 14, contrato: v.contrato, ccaa: v.ccaa, ...familia(v) }, P);
    const avisos = [];
    if (r.renta) {
      const d = r.renta.diferencia;
      avisos.push(Math.abs(d) < 1
        ? tt('La retención cubre lo que pagarás en la renta.', 'La retenció cobreix el que pagaràs a la renda.')
        : d > 0
          ? tt(`En la renta te saldría a pagar unos ${Math.round(d)} €: la retención de la nómina es igual en toda España, pero el IRPF de ${nombreComunidad(v.ccaa, 'es')} es algo más alto.`, `A la renda et sortiria a pagar uns ${Math.round(d)} €: la retenció de la nòmina és igual a tot Espanya, però l’IRPF de ${nombreComunidad(v.ccaa, 'ca')} és una mica més alt.`)
          : tt(`En la renta te devolverían unos ${Math.round(-d)} € si no tienes otras rentas ni deducciones.`, `A la renda et retornarien uns ${Math.round(-d)} € si no tens altres rendes ni deduccions.`));
    }
    if (r.ss.topada) avisos.push(tt('Tu salario supera la base máxima de cotización: pagas cotización de solidaridad sobre el exceso.', 'El teu salari supera la base màxima de cotització: pagues cotització de solidaritat sobre l’excés.'));
    return {
      destacado: { e: v.pagas === '14' ? tt('Neto en cada nómina ordinaria', 'Net a cada nòmina ordinària') : tt('Neto mensual', 'Net mensual'), v: r.netoOrdinaria, nota: v.pagas === '14' ? tt(`Y ${r.netoExtra.toLocaleString(lang === 'es' ? 'es-ES' : 'ca-ES')} € en cada paga extra`, `I ${r.netoExtra.toLocaleString('ca-ES')} € a cada paga extra`) : undefined },
      secundarios: [
        { e: tt('Neto anual', 'Net anual'), v: r.netoAnual },
        { e: tt('Retención de IRPF', 'Retenció d’IRPF'), v: r.ret.tipo, f: 'pct' },
        { e: tt('Coste para la empresa', 'Cost per a l’empresa'), v: r.costeEmpresa },
      ],
      filas: [
        { e: tt('Salario bruto anual', 'Salari brut anual'), v: v.bruto },
        { e: tt('Cotización a la Seguridad Social', 'Cotització a la Seguretat Social'), v: r.ss.trabajador.anual, signo: '-' },
        { e: tt(`Retención de IRPF (${String(r.ret.tipo).replace(".", ",")} %)`, `Retenció d’IRPF (${String(r.ret.tipo).replace(".", ",")} %)`), v: r.ret.importe, signo: '-' },
        { e: tt('Salario neto anual', 'Salari net anual'), v: r.netoAnual, fuerte: true },
        { e: tt('Bruto de cada paga', 'Brut de cada paga'), v: r.brutoPaga, sub: true },
        { e: tt('Seguridad Social al mes', 'Seguretat Social al mes'), v: r.ss.trabajador.mensual, sub: true, signo: '-' },
        { e: tt('IRPF de cada paga', 'IRPF de cada paga'), v: r.irpfPaga, sub: true, signo: '-' },
        ...(r.renta ? [
          { e: tt('IRPF real estimado en la renta', 'IRPF real estimat a la renda'), v: r.renta.cuota },
          { e: tt('Tipo marginal (estatal + autonómico)', 'Tipus marginal (estatal + autonòmic)'), v: r.renta.tipoMarginal, f: 'pct' as const },
        ] : []),
      ],
      avisos,
    };
  },
});
