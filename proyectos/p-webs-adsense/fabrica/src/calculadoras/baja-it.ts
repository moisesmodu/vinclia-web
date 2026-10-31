import { def, tt } from '../lib/def';
import { bajaIT } from '../lib/calc/laboral';

export default def({
  id: 'baja-it',
  anual: true,
  campos: [
    { id: 'base', tipo: 'numero', def: 1900, min: 0, paso: 10, sufijo: '€', etiqueta: tt('Base de cotización del mes anterior a la baja', 'Base de cotització del mes anterior a la baixa'), ayuda: tt('En la nómina: base de contingencias comunes. Aproximación: bruto anual / 12.', 'A la nòmina: base de contingències comunes. Aproximació: brut anual / 12.') },
    { id: 'tipo', tipo: 'select', def: 'comun', etiqueta: tt('Causa de la baja', 'Causa de la baixa'), opciones: [{ v: 'comun', t: tt('Enfermedad común o accidente no laboral', 'Malaltia comuna o accident no laboral') }, { v: 'profesional', t: tt('Accidente de trabajo o enfermedad profesional', 'Accident de treball o malaltia professional') }] },
    { id: 'dias', tipo: 'numero', def: 30, min: 1, max: 545, paso: 1, etiqueta: tt('Días de baja', 'Dies de baixa') },
    { id: 'complemento', tipo: 'numero', def: 0, min: 0, max: 100, paso: 5, sufijo: '%', etiqueta: tt('Complemento de tu convenio hasta el…', 'Complement del teu conveni fins al…'), ayuda: tt('Muchos convenios completan hasta el 100 % del salario. Déjalo en 0 si el tuyo no lo hace.', 'Molts convenis completen fins al 100 % del salari. Deixa-ho en 0 si el teu no ho fa.') },
  ],
  calcular(v, { P }) {
    const r = bajaIT({ baseMensual: v.base, dias: v.dias, tipo: v.tipo, complementoPct: v.complemento }, P.laboral);
    return {
      destacado: { e: tt(`Cobrarás por ${v.dias} días de baja (bruto)`, `Cobraràs per ${v.dias} dies de baixa (brut)`), v: r.totalConComplemento },
      secundarios: [{ e: tt('Base reguladora diaria', 'Base reguladora diària'), v: r.baseDiaria }, { e: tt('Pierdes respecto a tu base', 'Perds respecte a la teva base'), v: r.perdida }],
      tablas: [{ cab: [tt('Días', 'Dies'), tt('Porcentaje', 'Percentatge'), tt('Al día', 'Al dia'), tt('Importe', 'Import')], formatos: ['txt', 'pct', 'eur', 'eur'], filas: r.filas.map((f) => [`${f.desde}–${f.hasta}`, f.pct, f.diario, f.importe]) }],
      filas: [
        { e: tt('Prestación legal', 'Prestació legal'), v: r.prestacion },
        ...(v.tipo === 'comun' ? [{ e: tt('La paga la empresa (días 4 a 15)', 'La paga l’empresa (dies 4 a 15)'), v: r.pagaEmpresa, sub: true }, { e: tt('La paga la Seguridad Social o la mutua (desde el día 16)', 'La paga la Seguretat Social o la mútua (des del dia 16)'), v: r.pagaSS, sub: true }] : []),
        ...(r.complemento ? [{ e: tt('Complemento del convenio', 'Complement del conveni'), v: r.complemento }] : []),
        { e: tt('Total', 'Total'), v: r.totalConComplemento, fuerte: true },
      ],
      avisos: [tt('La prestación por incapacidad temporal cotiza y lleva retención de IRPF como el salario. Los 3 primeros días de una baja común no se pagan salvo que tu convenio diga lo contrario.', 'La prestació per incapacitat temporal cotitza i porta retenció d’IRPF com el salari. Els 3 primers dies d’una baixa comuna no es paguen llevat que el teu conveni digui el contrari.')],
    };
  },
});
