import { def, tt } from '../lib/def';
import { campoComunidad, camposFamilia, familia, nombreComunidad } from '../lib/campos';
import { cotizacion } from '../lib/calc/ss';
import { baseTrabajo, cuotaAnual, retencion } from '../lib/calc/irpf';
import { r2, pos } from '../lib/calc/base';

export default def({
  id: 'irpf-renta',
  anual: true,
  campos: [
    { id: 'trabajo', tipo: 'numero', def: 30000, min: 0, paso: 100, sufijo: '€', etiqueta: tt('Salario bruto anual (rendimientos del trabajo)', 'Salari brut anual (rendiments del treball)') },
    { id: 'actividad', tipo: 'numero', def: 0, paso: 100, sufijo: '€', etiqueta: tt('Rendimiento neto de actividad como autónomo', 'Rendiment net d’activitat com a autònom') },
    { id: 'ahorro', tipo: 'numero', def: 0, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Intereses, dividendos y ganancias del año', 'Interessos, dividends i guanys de l’any') },
    { id: 'retenido', tipo: 'numero', def: -1, min: -1, paso: 10, sufijo: '€', etiqueta: tt('Retenciones y pagos a cuenta ya hechos (−1 = estimar)', 'Retencions i pagaments a compte ja fets (−1 = estimar)') },
    campoComunidad(), ...camposFamilia,
  ],
  calcular(v, { P }) {
    const fam = familia(v);
    const ss = cotizacion({ brutoAnual: v.trabajo }, P.laboral);
    const ssA = v.trabajo > 0 ? ss.trabajador.anual : 0;
    const bt = v.trabajo > 0 ? baseTrabajo(v.trabajo, ssA, P.fiscal, fam) : { base: 0, rnPrevio: 0, reduccion: 0, gastos: 0 };
    const baseGeneral = pos(bt.base + v.actividad);
    const c = cuotaAnual({ ...fam, baseGeneral, baseAhorro: v.ahorro, ccaa: v.ccaa, rendimientosTrabajoIntegros: v.trabajo > 0 ? v.trabajo : Infinity }, P.fiscal);
    const retEst = v.trabajo > 0 ? retencion({ brutoAnual: v.trabajo, ssAnual: ssA, ...fam }, P.fiscal).importe : 0;
    const ret = v.retenido >= 0 ? v.retenido : retEst + v.ahorro * 0.19;
    const dif = c.total - ret;
    return {
      destacado: { e: dif >= 0 ? tt('Resultado estimado: a pagar', 'Resultat estimat: a pagar') : tt('Resultado estimado: a devolver', 'Resultat estimat: a retornar'), v: r2(Math.abs(dif)) },
      secundarios: [
        { e: tt('Cuota líquida de IRPF', 'Quota líquida d’IRPF'), v: c.total },
        { e: tt('Tipo medio', 'Tipus mitjà'), v: c.tipoMedio, f: 'pct' },
        { e: tt('Tipo marginal', 'Tipus marginal'), v: c.tipoMarginal, f: 'pct' },
      ],
      filas: [
        ...(v.trabajo > 0 ? [
          { e: tt('Rendimiento íntegro del trabajo', 'Rendiment íntegre del treball'), v: v.trabajo },
          { e: tt('Seguridad Social y otros gastos', 'Seguretat Social i altres despeses'), v: r2(ssA + bt.gastos), signo: '-' as const, sub: true },
          { e: tt('Reducción por rendimientos del trabajo', 'Reducció per rendiments del treball'), v: r2(bt.reduccion), signo: '-' as const, sub: true },
        ] : []),
        ...(v.actividad ? [{ e: tt('Rendimiento de actividades', 'Rendiment d’activitats'), v: v.actividad }] : []),
        { e: tt('Base liquidable general', 'Base liquidable general'), v: r2(baseGeneral), fuerte: true },
        ...(v.ahorro ? [{ e: tt('Base liquidable del ahorro', 'Base liquidable de l’estalvi'), v: v.ahorro, fuerte: true }] : []),
        { e: tt('Mínimo personal y familiar (estatal)', 'Mínim personal i familiar (estatal)'), v: c.minimoEstatal, sub: true },
        { e: tt('Cuota estatal', 'Quota estatal'), v: c.estatal },
        { e: { es: `Cuota autonómica (${nombreComunidad(v.ccaa, 'es')})`, ca: `Quota autonòmica (${nombreComunidad(v.ccaa, 'ca')})` }, v: c.autonomica },
        ...(c.ahorro ? [{ e: tt('Cuota del ahorro', 'Quota de l’estalvi'), v: c.ahorro }] : []),
        ...(c.deduccionSMI ? [{ e: tt('Deducción por rendimientos del trabajo (SMI)', 'Deducció per rendiments del treball (SMI)'), v: c.deduccionSMI, signo: '-' as const }] : []),
        { e: tt('Cuota líquida', 'Quota líquida'), v: c.total, fuerte: true },
        { e: v.retenido >= 0 ? tt('Retenciones y pagos a cuenta', 'Retencions i pagaments a compte') : tt('Retenciones estimadas', 'Retencions estimades'), v: r2(ret), signo: '-' },
      ],
      avisos: [tt('Estimación sin deducciones autonómicas, planes de pensiones, vivienda habitual anterior a 2013 ni donativos: cada una reduciría el resultado.', 'Estimació sense deduccions autonòmiques, plans de pensions, habitatge habitual anterior al 2013 ni donatius: cadascuna reduiria el resultat.')],
    };
  },
});
